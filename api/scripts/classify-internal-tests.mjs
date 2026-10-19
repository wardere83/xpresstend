import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { remoteBindingConfiguration } from './offboard-staff.mjs'

// The owner confirmed these four existing registrations, not future customers.
// Neither the CLI nor the deployment can widen this approved snapshot.
export const APPROVED_CUTOFF = '2026-10-19T01:54:23.000Z'
export const EXPECTED_COHORT = 4
const reason = 'owner_confirmed_internal_test'
const action = 'customer.classified_internal_test'
const metadata = JSON.stringify({ reason, approvedCutoff: APPROVED_CUTOFF })
const apiDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
class ClassificationError extends Error {}
const blocked = () => new ClassificationError('Internal test classification blocked: approved cohort or audit state changed; no writes attempted')
const unavailable = () => new ClassificationError('Internal test classification unavailable; read-only verification required before retry')
const auditId = (id) => `aud_internal_test_${createHash('sha256').update(`${APPROVED_CUTOFF}:${id}`).digest('hex').slice(0, 32)}`

export function parseArguments(args) {
  let apply = false
  let remote = false
  let database = 'xpresstend-production'
  for (const arg of args) {
    if (arg === '--apply') apply = true
    else if (arg === '--remote') remote = true
    else if (arg === '--dry-run') continue
    else if (arg.startsWith('--database=')) database = arg.slice(11)
    else throw new ClassificationError('Use only --remote, --apply, --dry-run or --database=NAME')
  }
  if (apply && !remote) throw new ClassificationError('Writes require both --remote and --apply')
  if (apply && args.includes('--dry-run')) throw new ClassificationError('Choose --apply or --dry-run')
  if (!/^[a-zA-Z0-9_-]+$/.test(database)) throw new ClassificationError('Invalid D1 database name')
  return { apply, database }
}

export function preflightSql() {
  return `SELECT u.id,u.created_at,c.kind FROM users u
    LEFT JOIN user_account_classifications c ON c.user_id=u.id
    WHERE u.created_at<=? ORDER BY u.id`
}

export function classificationSummary(rows) {
  const valid = Array.isArray(rows) && rows.length === EXPECTED_COHORT &&
    new Set(rows.map((row) => row.id)).size === EXPECTED_COHORT &&
    rows.every((row) => typeof row.id === 'string' && row.id.length > 0 &&
      typeof row.created_at === 'string' && Number.isFinite(Date.parse(row.created_at)) &&
      new Date(row.created_at).toISOString() === row.created_at && row.created_at <= APPROVED_CUTOFF &&
      (row.kind === null || row.kind === 'internal_test'))
  return {
    ready: valid,
    classified: Array.isArray(rows) ? rows.filter((row) => row.kind === 'internal_test').length : 0,
    pending: Array.isArray(rows) ? rows.filter((row) => row.kind === null).length : 0,
  }
}

/** Bound snapshot/audit guards run again inside the same atomic D1 batch. */
function snapshotGuard(rows) {
  const bindings = [APPROVED_CUTOFF, EXPECTED_COHORT]
  const checks = ['(SELECT COUNT(*) FROM users WHERE created_at<=?)=?']
  for (const row of rows) {
    checks.push(`EXISTS(SELECT 1 FROM users u LEFT JOIN user_account_classifications c ON c.user_id=u.id
      WHERE u.id=? AND u.created_at=? AND c.kind IS ?)`)
    bindings.push(row.id, row.created_at, row.kind)
    if (row.kind === null) {
      checks.push(`NOT EXISTS(SELECT 1 FROM audit_log WHERE id=? OR (action=? AND entity_type='user' AND entity_id=?))`)
      bindings.push(auditId(row.id), action, row.id)
    } else {
      checks.push(`EXISTS(SELECT 1 FROM user_account_classifications c JOIN audit_log a ON a.entity_id=c.user_id
        WHERE c.user_id=? AND c.kind='internal_test' AND c.reason=? AND c.classified_at=a.created_at
          AND a.id=? AND a.actor_type='system' AND a.actor_id IS NULL AND a.action=?
          AND a.entity_type='user' AND a.metadata=?)
        AND (SELECT COUNT(*) FROM audit_log WHERE action=? AND entity_type='user' AND entity_id=?)=1`)
      bindings.push(row.id, reason, auditId(row.id), action, metadata, action, row.id)
    }
  }
  return { sql: checks.join(' AND '), bindings }
}

export function classificationStatements(rows, now) {
  if (!classificationSummary(rows).ready) throw blocked()
  if (typeof now !== 'string' || !Number.isFinite(Date.parse(now)) ||
    new Date(now).toISOString() !== now || now < APPROVED_CUTOFF)
    throw new ClassificationError('Invalid classification time')
  const guard = snapshotGuard(rows)
  const statements = [{
    sql: `SELECT json(CASE WHEN ${guard.sql} THEN 'true' ELSE '' END) AS classification_guard`,
    bindings: guard.bindings,
  }]
  for (const row of rows.filter((row) => row.kind === null)) {
    statements.push({
      sql: `INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at)
        SELECT ?,'system',NULL,?,'user',?,?,? WHERE NOT EXISTS(SELECT 1 FROM user_account_classifications WHERE user_id=?)`,
      bindings: [auditId(row.id), action, row.id, metadata, now, row.id],
    }, {
      sql: `INSERT INTO user_account_classifications(user_id,kind,reason,classified_at)
        SELECT ?,'internal_test',?,? WHERE NOT EXISTS(SELECT 1 FROM user_account_classifications WHERE user_id=?)`,
      bindings: [row.id, reason, now, row.id],
    })
  }
  // A missing classification or audit also aborts earlier writes in the batch.
  const after = snapshotGuard(rows.map((row) => ({ ...row, kind: 'internal_test' })))
  statements.push({
    sql: `SELECT json(CASE WHEN ${after.sql} THEN 'true' ELSE '' END) AS classification_post_guard`,
    bindings: after.bindings,
  })
  return statements
}

export async function runClassification({ db, apply = false, now = new Date().toISOString() }) {
  try {
    const read = async () => {
      const result = await db.prepare(preflightSql()).bind(APPROVED_CUTOFF).all()
      if (result.success !== true || !Array.isArray(result.results)) throw unavailable()
      return result.results
    }
    const rows = await read()
    const summary = classificationSummary(rows)
    if (summary.ready) {
      const guard = snapshotGuard(rows)
      const result = await db.prepare(`SELECT CASE WHEN ${guard.sql} THEN 1 ELSE 0 END AS ready`).bind(...guard.bindings).first()
      summary.ready = Number(result?.ready) === 1
    }
    if (!apply) return summary
    if (!summary.ready) throw blocked()
    // An already classified and audited snapshot is a genuinely read-only retry.
    if (summary.pending === 0) return summary
    const result = await db.batch(classificationStatements(rows, now).map(({ sql, bindings }) => db.prepare(sql).bind(...bindings)))
    if (!Array.isArray(result) || result.some((entry) => entry.success !== true)) throw unavailable()
    const after = await read()
    const verified = classificationSummary(after)
    if (!verified.ready || verified.classified !== EXPECTED_COHORT || verified.pending !== 0 ||
      after.some((row) => !rows.some((prior) => prior.id === row.id && prior.created_at === row.created_at)))
      throw new ClassificationError('Internal test classification post-check failed; read-only verification required before retry')
    return verified
  } catch (error) {
    // D1/SDK errors can contain SQL, identifiers, signed URLs or credentials.
    if (error instanceof ClassificationError) throw error
    throw unavailable()
  }
}

async function withRemoteBinding(options) {
  const directory = await mkdtemp(join(tmpdir(), 'xpresstend-internal-test-maintenance-'))
  const previousLogLevel = process.env.WRANGLER_LOG
  process.env.WRANGLER_LOG = 'none'
  let platform
  const deadline = setTimeout(() => {
    console.error('Internal test classification timed out; read-only verification required before retry')
    process.exit(1)
  }, 60_000)
  try {
    const configuration = remoteBindingConfiguration(await readFile(join(apiDirectory, 'wrangler.toml'), 'utf8'), options.database)
    configuration.name = 'xpresstend-internal-test-maintenance'
    const configPath = join(directory, 'wrangler.json')
    await writeFile(configPath, JSON.stringify(configuration), { mode: 0o600 })
    const { getPlatformProxy } = await import('wrangler')
    platform = await getPlatformProxy({ configPath, remoteBindings: true, envFiles: [], persist: false })
    return await runClassification({ db: platform.env.DB, apply: options.apply })
  } catch (error) {
    if (error instanceof ClassificationError) throw error
    throw unavailable()
  } finally {
    try { await platform?.dispose() } catch { /* Never echo signed proxy URLs. */ }
    try { await rm(directory, { recursive: true, force: true }) } catch { /* The temporary configuration contains D1 identity only. */ }
    clearTimeout(deadline)
    if (previousLogLevel === undefined) delete process.env.WRANGLER_LOG
    else process.env.WRANGLER_LOG = previousLogLevel
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new ClassificationError('CLOUDFLARE_API_TOKEN is required for the production preflight')
  console.log(JSON.stringify(await withRemoteBinding(options)))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof ClassificationError ? error.message : unavailable().message)
    process.exitCode = 1
  })
}
