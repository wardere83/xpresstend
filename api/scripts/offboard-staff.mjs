import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const support = 'support@xpresstend.com'
const colleague = 'abdikarim@xpresstend.com'
const sqlValue = (value) => `'${String(value).replaceAll("'", "''")}'`

export function normalizeTargets(emails, minimum = 1) {
  if (!Array.isArray(emails) || emails.length < minimum || emails.length > 2)
    throw new Error('Provide one or two explicit --email values')
  const targets = emails.map((email) => String(email).trim().toLowerCase())
  if (targets.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    throw new Error('Invalid staff email')
  if (new Set(targets).size !== targets.length)
    throw new Error('Duplicate staff email')
  if (targets.some((email) => email === support || email === colleague))
    throw new Error(
      'The protected business staff accounts cannot be offboarded',
    )
  return targets
}

export function preflightSql(emails) {
  const targets = normalizeTargets(emails, 0)
  return `SELECT a.id,a.email,a.role,a.status,
    CASE WHEN ${acceptedCredential('a')} THEN 1 ELSE 0 END AS setup_complete,
    (SELECT COUNT(*) FROM admins other WHERE other.status IN ('active','invited') AND lower(other.email) NOT IN (${[support, colleague, ...targets].map(sqlValue).join(',')})) AS other_staff,
    (SELECT COUNT(*) FROM admin_sessions s WHERE s.admin_id=a.id AND s.revoked_at IS NULL) AS sessions,
    (SELECT COUNT(*) FROM staff_invites i WHERE i.admin_id=a.id AND i.accepted_at IS NULL AND i.revoked_at IS NULL) AS invitations,
    (SELECT COUNT(*) FROM admin_password_resets r WHERE r.admin_id=a.id AND r.used_at IS NULL AND r.revoked_at IS NULL) AS resets
    FROM admins a WHERE lower(a.email) IN (${[support, colleague, ...targets].map(sqlValue).join(',')});`
}

function acceptedCredential(alias) {
  return `length(${alias}.password_hash)=64 AND ${alias}.password_hash NOT GLOB '*[^0-9a-f]*'
    AND length(${alias}.password_salt)=32 AND ${alias}.password_salt NOT GLOB '*[^0-9a-f]*'
    AND ${alias}.password_iterations>0 AND (${alias}.last_login_at IS NOT NULL
      OR EXISTS(SELECT 1 FROM staff_invites accepted WHERE accepted.admin_id=${alias}.id AND accepted.accepted_at IS NOT NULL)
      OR EXISTS(SELECT 1 FROM admin_password_resets used WHERE used.admin_id=${alias}.id AND used.used_at IS NOT NULL))`
}

const findEmail = (rows, email) =>
  rows.find((row) => String(row.email).toLowerCase() === email)

/** Counts and business-account gates only: never log staff identities or capabilities. */
export function preflightSummary(rows, emails) {
  const targets = normalizeTargets(emails, 0)
  const owner = findEmail(rows, support)
  const staff = findEmail(rows, colleague)
  const blockers = []
  if (
    owner?.role !== 'owner' ||
    owner.status !== 'active' ||
    Number(owner.setup_complete) !== 1
  )
    blockers.push(
      `Support must be an active owner (role=${owner?.role ?? 'missing'}, status=${owner?.status ?? 'missing'}, setupComplete=${Number(owner?.setup_complete) === 1})`,
    )
  if (
    !staff ||
    staff.status !== 'active' ||
    staff.role === 'reviewer' ||
    Number(staff.setup_complete) !== 1
  )
    blockers.push(
      `Abdikarim must be active operational staff (role=${staff?.role ?? 'missing'}, status=${staff?.status ?? 'missing'}, setupComplete=${Number(staff?.setup_complete) === 1})`,
    )
  const selected = targets.flatMap((email) => {
    const row = findEmail(rows, email)
    return row ? [row] : []
  })
  return {
    ready: blockers.length === 0,
    otherActiveOrInvited: rows.length ? Number(rows[0].other_staff) : null,
    blockers,
    requested: targets.length,
    found: selected.length,
    missing: targets.length - selected.length,
    disabled: selected.filter((row) => row.status === 'disabled').length,
    outstandingSessions: selected.reduce(
      (n, row) => n + Number(row.sessions),
      0,
    ),
    pendingInvitations: selected.reduce(
      (n, row) => n + Number(row.invitations),
      0,
    ),
    unusedResets: selected.reduce((n, row) => n + Number(row.resets), 0),
  }
}

const businessGuard = `EXISTS(SELECT 1 FROM admins a WHERE lower(a.email)=${sqlValue(support)} AND a.role='owner' AND a.status='active' AND ${acceptedCredential('a')})
  AND EXISTS(SELECT 1 FROM admins a WHERE lower(a.email)=${sqlValue(colleague)} AND a.role<>'reviewer' AND a.status='active' AND ${acceptedCredential('a')})`

/** One bounded D1 command batch; no schema, credential, email or history changes. */
export function offboardingSql(rows, emails, now, operationId = randomUUID()) {
  const targets = normalizeTargets(emails)
  const summary = preflightSummary(rows, targets)
  if (!summary.ready)
    throw new Error(`Staff offboarding blocked: ${summary.blockers.join('; ')}`)
  if (!Number.isFinite(Date.parse(now)))
    throw new Error('Invalid operation time')
  const selected = targets.flatMap((email) => {
    const row = findEmail(rows, email)
    return row ? [row] : []
  })
  const snapshotGuards = targets.map((email) => {
    const row = findEmail(rows, email)
    return row
      ? `EXISTS(SELECT 1 FROM admins WHERE id=${sqlValue(row.id)} AND lower(email)=${sqlValue(email)} AND role=${sqlValue(row.role)} AND status=${sqlValue(row.status)})`
      : `NOT EXISTS(SELECT 1 FROM admins WHERE lower(email)=${sqlValue(email)})`
  })
  // The apply executor uses documented D1Database.batch atomicity. Invalid
  // JSON aborts that transaction if a protected account or target changed.
  // REST --command is used only for the read-only preflight, never writes.
  const statements = [
    `SELECT json(CASE WHEN ${businessGuard} AND ${snapshotGuards.join(' AND ')} THEN 'true' ELSE '' END) AS offboarding_guard;`,
  ]
  for (const row of selected) {
    const target = `id=${sqlValue(row.id)} AND lower(email)=${sqlValue(String(row.email).toLowerCase())}`
    const id = sqlValue(row.id)
    const changed = `(a.status<>'disabled'
      OR EXISTS(SELECT 1 FROM admin_sessions WHERE admin_id=a.id AND revoked_at IS NULL)
      OR EXISTS(SELECT 1 FROM staff_invites WHERE admin_id=a.id AND accepted_at IS NULL AND revoked_at IS NULL)
      OR EXISTS(SELECT 1 FROM admin_password_resets WHERE admin_id=a.id AND used_at IS NULL AND revoked_at IS NULL))`
    const auditId = `aud_offboard_${createHash('sha256').update(`${operationId}:${row.id}`).digest('hex').slice(0, 32)}`
    statements.push(
      `INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at)
       SELECT ${sqlValue(auditId)},'system',NULL,'staff.offboarded','admin',a.id,
         json_object('reason','owner_requested_offboarding','fromStatus',a.status,'role',a.role),${sqlValue(now)}
       FROM admins a WHERE ${target} AND ${changed} AND ${businessGuard};`,
      `UPDATE admin_sessions SET revoked_at=${sqlValue(now)} WHERE admin_id=${id} AND revoked_at IS NULL AND ${businessGuard};`,
      `UPDATE staff_invites SET revoked_at=${sqlValue(now)} WHERE admin_id=${id} AND accepted_at IS NULL AND revoked_at IS NULL AND ${businessGuard};`,
      `UPDATE admin_password_resets SET revoked_at=${sqlValue(now)} WHERE admin_id=${id} AND used_at IS NULL AND revoked_at IS NULL AND ${businessGuard};`,
      `UPDATE admins SET status='disabled',updated_at=${sqlValue(now)} WHERE ${target} AND status<>'disabled' AND ${businessGuard};`,
    )
  }
  return statements.join('\n')
}

export async function runOffboarding({
  emails,
  apply = false,
  execute,
  report = () => {},
  now = new Date().toISOString(),
}) {
  const targets = normalizeTargets(emails)
  const query = preflightSql(targets)
  const before = await execute(query)
  const summary = preflightSummary(before, targets)
  report({ event: 'staff-offboarding-preflight', ...summary })
  if (!apply) return { event: 'staff-offboarding-dry-run', ...summary }
  const sql = offboardingSql(before, targets, now)
  try {
    await execute(sql)
  } catch {
    // Do not forward Wrangler output: it can include SQL or credentials. A
    // fresh read gives the actual business gate if it changed during preflight.
    const after = preflightSummary(await execute(query), targets)
    if (!after.ready)
      throw new Error(`Staff offboarding blocked: ${after.blockers.join('; ')}`)
    throw new Error(
      'Staff offboarding batch failed; read-only recheck required before retry',
    )
  }
  const afterRows = await execute(query)
  const after = preflightSummary(afterRows, targets)
  if (
    !after.ready ||
    after.disabled !== after.found ||
    after.outstandingSessions ||
    after.pendingInvitations ||
    after.unusedResets
  )
    throw new Error(
      'Staff offboarding post-check failed; inspect the read-only preflight before retry',
    )
  if (
    before.some(
      (row) =>
        targets.includes(String(row.email).toLowerCase()) &&
        !afterRows.some(
          (next) => next.id === row.id && next.email === row.email,
        ),
    )
  )
    throw new Error(
      'Staff identity changed during offboarding; manual review required',
    )
  return { event: 'staff-offboarding-complete', ...after }
}

export function parseArguments(args) {
  const emails = []
  let remote = false
  let apply = false
  let database = 'xpresstend-production'
  const emailSha256 = []
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--remote') remote = true
    else if (arg === '--apply') apply = true
    else if (arg === '--dry-run') continue
    else if (arg === '--email') emails.push(args[++index])
    else if (arg === '--email-sha256') emailSha256.push(args[++index])
    else if (arg.startsWith('--email-sha256=')) emailSha256.push(arg.slice(15))
    else if (arg.startsWith('--email=')) emails.push(arg.slice(8))
    else if (arg.startsWith('--database=')) database = arg.slice(11)
    else
      throw new Error(
        'Use --email ADDRESS (one or two), --remote, --apply, --dry-run, or --database=NAME',
      )
  }
  if (apply && !remote)
    throw new Error('Writes require both --remote and --apply')
  if (apply && args.includes('--dry-run'))
    throw new Error('Choose --apply or --dry-run')
  if (!/^[a-zA-Z0-9_-]+$/.test(database))
    throw new Error('Invalid D1 database name')
  if (
    emails.length + emailSha256.length < 1 ||
    emails.length + emailSha256.length > 2
  )
    throw new Error('Provide one or two explicit email selectors')
  const normalizedHashes = emailSha256.map((hash) => String(hash).toLowerCase())
  if (
    normalizedHashes.some((hash) => !/^[a-f0-9]{64}$/.test(hash)) ||
    new Set(normalizedHashes).size !== normalizedHashes.length
  )
    throw new Error('Invalid or duplicate email SHA-256 selector')
  const protectedHashes = [support, colleague].map((email) =>
    createHash('sha256').update(email).digest('hex'),
  )
  if (normalizedHashes.some((hash) => protectedHashes.includes(hash)))
    throw new Error(
      'The protected business staff accounts cannot be offboarded',
    )
  return {
    emails: normalizeTargets(emails, 0),
    emailSha256: normalizedHashes,
    apply,
    database,
  }
}

function executeD1(database, sql) {
  const wrangler = join(
    apiDirectory,
    'node_modules',
    'wrangler',
    'bin',
    'wrangler.js',
  )
  const result = spawnSync(
    process.execPath,
    [
      wrangler,
      'd1',
      'execute',
      database,
      '--remote',
      '--yes',
      '--json',
      '--command',
      sql,
    ],
    {
      cwd: apiDirectory,
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
      timeout: 30_000,
    },
  )
  if (result.error || result.status !== 0)
    throw new Error('Staff offboarding D1 command failed')
  let output
  try {
    output = JSON.parse(result.stdout.trim())
  } catch {
    throw new Error('Staff offboarding D1 returned invalid JSON')
  }
  if (!Array.isArray(output) || output.some((entry) => entry.success !== true))
    throw new Error('Staff offboarding D1 rejected the operation')
  return output.flatMap((entry) => entry.results || [])
}

export async function runSelectedOffboarding({ emailSha256 = [], ...options }) {
  if (!emailSha256.length) return runOffboarding(options)
  const known = await options.execute('SELECT email FROM admins;')
  const resolved = emailSha256.flatMap((hash) =>
    known
      .filter(
        (row) =>
          createHash('sha256')
            .update(String(row.email).trim().toLowerCase())
            .digest('hex') === hash,
      )
      .map((row) => String(row.email).trim().toLowerCase()),
  )
  const emails = [...options.emails, ...resolved]
  if (resolved.length !== emailSha256.length) {
    const rows = await options.execute(preflightSql(emails))
    const summary = {
      event: 'staff-offboarding-preflight',
      ...preflightSummary(rows, emails),
      missingSelectors: emailSha256.length - resolved.length,
    }
    options.report?.(summary)
    if (options.apply)
      throw new Error(
        'Staff offboarding blocked: one or more requested account selectors were not found; no writes attempted',
      )
    return { ...summary, event: 'staff-offboarding-dry-run' }
  }
  return runOffboarding({ ...options, emails })
}

/** Build a D1-only proxy configuration; no public HTTP handler or app secrets. */
export function remoteBindingConfiguration(configuration, database) {
  const sections =
    configuration.match(/\[\[d1_databases\]\][\s\S]*?(?=\n\[|$)/g) || []
  const selected = sections.find((section) =>
    [
      section.match(/database_name\s*=\s*"([^"]+)"/)?.[1],
      section.match(/binding\s*=\s*"([^"]+)"/)?.[1],
    ].includes(database),
  )
  const databaseId = selected?.match(/database_id\s*=\s*"([a-f0-9-]+)"/)?.[1]
  const databaseName = selected?.match(/database_name\s*=\s*"([^"]+)"/)?.[1]
  if (
    !databaseId ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      databaseId,
    ) ||
    !databaseName
  )
    throw new Error('The requested D1 database is not explicitly configured')
  return {
    name: 'xpresstend-staff-maintenance',
    compatibility_date: '2026-08-26',
    d1_databases: [
      {
        binding: 'DB',
        database_name: databaseName,
        database_id: databaseId,
        preview_database_id: databaseId,
        remote: true,
      },
    ],
  }
}

export function bindingExecutor(db, splitSqlQuery) {
  return async (sql) => {
    const result = await db.batch(
      splitSqlQuery(sql).map((statement) => db.prepare(statement)),
    )
    if (
      !Array.isArray(result) ||
      result.some((entry) => entry.success !== true)
    )
      throw new Error('The transactional D1 binding rejected the operation')
    return result.flatMap((entry) => entry.results || [])
  }
}

async function applyWithRemoteBinding(options) {
  const directory = await mkdtemp(
    join(tmpdir(), 'xpresstend-staff-maintenance-'),
  )
  let platform
  const oldLogLevel = process.env.WRANGLER_LOG
  process.env.WRANGLER_LOG = 'none'
  const deadline = setTimeout(() => {
    console.error(
      '[Staff offboarding] Remote binding timed out; read-only preflight required before retry',
    )
    process.exit(1)
  }, 60_000)
  let result
  let cleanupFailed = false
  try {
    const configuration = remoteBindingConfiguration(
      await readFile(join(apiDirectory, 'wrangler.toml'), 'utf8'),
      options.database,
    )
    const configPath = join(directory, 'wrangler.json')
    await writeFile(configPath, JSON.stringify(configuration), { mode: 0o600 })
    const { getPlatformProxy, unstable_splitSqlQuery } = await import(
      'wrangler'
    )
    platform = await getPlatformProxy({
      configPath,
      remoteBindings: true,
      envFiles: [],
      persist: false,
    })
    result = await runSelectedOffboarding({
      ...options,
      apply: true,
      execute: bindingExecutor(platform.env.DB, unstable_splitSqlQuery),
      report: (summary) => console.log(JSON.stringify(summary)),
    })
  } catch (error) {
    // Never echo SDK errors, signed proxy URLs, SQL or authentication material.
    if (
      /^Staff offboarding (blocked:|post-check failed|batch failed)/.test(
        error.message,
      )
    )
      throw error
    throw new Error(
      'Staff offboarding remote binding unavailable; read-only preflight required before retry',
    )
  } finally {
    try {
      try {
        await platform?.dispose()
      } catch {
        // SDK cleanup errors may contain signed proxy URLs; never forward them.
      }
    } catch {
      cleanupFailed = true
    }
    try {
      await rm(directory, { recursive: true, force: true })
    } catch {
      cleanupFailed = true
    }
    if (oldLogLevel === undefined) delete process.env.WRANGLER_LOG
    else process.env.WRANGLER_LOG = oldLogLevel
    clearTimeout(deadline)
  }
  if (cleanupFailed)
    throw new Error(
      'Staff offboarding binding cleanup failed; read-only preflight required before retry',
    )
  return result
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!process.env.CLOUDFLARE_API_TOKEN)
    throw new Error(
      'CLOUDFLARE_API_TOKEN is required for the read-only production preflight',
    )
  const result = await runSelectedOffboarding({
    ...options,
    apply: false,
    execute: (sql) => executeD1(options.database, sql),
    report: (summary) => console.log(JSON.stringify(summary)),
  })
  console.log(JSON.stringify(result))
  if (options.apply) {
    if (!result.ready)
      throw new Error(
        `Staff offboarding blocked: ${result.blockers.join('; ')}`,
      )
    if (result.missingSelectors)
      throw new Error(
        'Staff offboarding blocked: one or more requested account selectors were not found; no writes attempted',
      )
    console.log(JSON.stringify(await applyWithRemoteBinding(options)))
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(`[Staff offboarding] ${error.message}`)
    process.exitCode = 1
  })
}
