import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { test, type TestContext } from 'node:test'
import {
  bindingExecutor,
  parseArguments,
  remoteBindingConfiguration,
  preflightSql,
  runOffboarding,
  runSelectedOffboarding,
} from '../scripts/offboard-staff.mjs'

const emails = ['retired-one@example.invalid', 'retired-two@example.invalid']
const now = '2026-10-16T12:00:00.000Z'

function setup(t: TestContext) {
  const db = new DatabaseSync(':memory:')
  t.after(() => db.close())
  for (const file of [
    '0001_init.sql',
    '0002_seed_reference_data.sql',
    '0006_admin_password_reset.sql',
  ])
    db.exec(
      readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'),
    )
  db.exec('PRAGMA foreign_keys=ON')
  for (const [id, email, role] of [
    ['support', 'support@xpresstend.com', 'owner'],
    ['colleague', 'abdikarim@xpresstend.com', 'compliance'],
    ['old-one', emails[0], 'owner'],
    ['old-two', emails[1], 'agent'],
    ['unrelated', 'unrelated@example.invalid', 'viewer'],
  ]) {
    db.prepare(
      `INSERT INTO admins(id,email,name,role,status,password_hash,password_salt,password_iterations,created_at,updated_at)
      VALUES (?,?,?,?,'active','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',200000,?,?)`,
    ).run(id, email, id, role, now, now)
  }
  for (const id of [
    'support',
    'colleague',
    'old-one',
    'old-two',
    'unrelated',
  ]) {
    db.prepare(
      `INSERT INTO admin_sessions(id,admin_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)`,
    ).run(`session-${id}`, id, `hash-${id}`, '2099-01-01T00:00:00.000Z', now)
    db.prepare(
      `INSERT INTO staff_invites(id,admin_id,token_hash,invited_by,expires_at,created_at)
      VALUES (?,?,?,'old-one','2099-01-01T00:00:00.000Z',?)`,
    ).run(`invite-${id}`, id, `invite-hash-${id}`, now)
    db.prepare(
      `INSERT INTO admin_password_resets(id,admin_id,token_hash,expires_at,issued_by,created_at)
      VALUES (?,?,?,'2099-01-01T00:00:00.000Z','old-one',?)`,
    ).run(`reset-${id}`, id, `reset-hash-${id}`, now)
  }
  db.exec(
    "UPDATE staff_invites SET accepted_at='2026-01-01' WHERE admin_id IN ('support','colleague')",
  )
  db.prepare(
    `INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at)
    VALUES ('historical','admin','old-one','staff.invited','admin','colleague','preserve-history',?)`,
  ).run(now)
  db.exec(`CREATE TRIGGER immutable_audit_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
    CREATE TRIGGER immutable_audit_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;`)
  const commands: string[] = []
  // Exercise the guarded batch as a transaction; the native binding is tested below.
  const execute = async (sql: string) => {
    commands.push(sql)
    if (/^SELECT (a\.id|email FROM)/.test(sql)) return db.prepare(sql).all()
    db.exec('BEGIN')
    try {
      db.exec(sql)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
    return []
  }
  return { db, execute, commands }
}

test('offboarding CLI is dry-run by default and requires explicit remote apply and bounded targets', () => {
  assert.equal(parseArguments(['--email', emails[0]]).apply, false)
  assert.equal(
    parseArguments(['--remote', '--apply', `--email=${emails[0]}`]).apply,
    true,
  )
  for (const args of [
    ['--apply', '--email', emails[0]],
    ['--remote', '--apply', '--dry-run', '--email', emails[0]],
    ['--email', 'support@xpresstend.com'],
    ['--email', 'ABDIkARIM@xpresstend.com'],
    ['--email', emails[0], '--email', emails[0]],
    ['--email'],
    ['--all'],
  ])
    assert.throws(() => parseArguments(args))
})

test('preflight is read-only and reports counts without identities, passwords or tokens', async (t) => {
  const { db, execute, commands } = setup(t)
  const before = db.prepare('SELECT total_changes() AS n').get()!.n
  const reports: unknown[] = []
  const result = await runOffboarding({
    emails,
    execute,
    report: (value: unknown) => reports.push(value),
  })
  assert.equal(result.event, 'staff-offboarding-dry-run')
  assert.equal(result.ready, true)
  assert.equal(result.found, 2)
  assert.equal(result.outstandingSessions, 2)
  assert.equal(db.prepare('SELECT total_changes() AS n').get()!.n, before)
  assert.equal(commands.length, 1)
  assert.match(commands[0], /^SELECT /)
  assert.doesNotMatch(
    JSON.stringify(reports),
    /example\.invalid|old-one|old-two|untouched|hash-|token|password/i,
  )
})

test('offboarding revokes every live capability and preserves staff identities, credentials, references and audit history', async (t) => {
  const { db, execute } = setup(t)
  db.exec(`UPDATE staff_invites SET accepted_at='2026-01-01' WHERE id='invite-old-two';
    UPDATE admin_password_resets SET used_at='2026-01-01' WHERE id='reset-old-two';`)
  const before = db
    .prepare(
      'SELECT id,email,name,role,password_hash,password_salt,password_iterations FROM admins ORDER BY id',
    )
    .all()
  const result = await runOffboarding({ emails, apply: true, execute, now })
  assert.equal(result.event, 'staff-offboarding-complete')
  assert.equal(result.disabled, 2)
  assert.equal(
    result.outstandingSessions +
      result.pendingInvitations +
      result.unusedResets,
    0,
  )
  assert.deepEqual(
    db
      .prepare(
        'SELECT id,email,name,role,password_hash,password_salt,password_iterations FROM admins ORDER BY id',
      )
      .all(),
    before,
  )
  for (const id of ['old-one', 'old-two']) {
    assert.equal(
      db.prepare('SELECT status FROM admins WHERE id=?').get(id)!.status,
      'disabled',
    )
    assert.equal(
      db
        .prepare('SELECT revoked_at FROM admin_sessions WHERE admin_id=?')
        .get(id)!.revoked_at,
      now,
    )
  }
  assert.equal(
    db
      .prepare("SELECT revoked_at FROM staff_invites WHERE id='invite-old-one'")
      .get()!.revoked_at,
    now,
  )
  assert.equal(
    db
      .prepare(
        "SELECT revoked_at FROM admin_password_resets WHERE id='reset-old-one'",
      )
      .get()!.revoked_at,
    now,
  )
  assert.equal(
    db
      .prepare("SELECT revoked_at FROM staff_invites WHERE id='invite-old-two'")
      .get()!.revoked_at,
    null,
  )
  assert.equal(
    db
      .prepare(
        "SELECT revoked_at FROM admin_password_resets WHERE id='reset-old-two'",
      )
      .get()!.revoked_at,
    null,
  )
  for (const id of ['support', 'colleague', 'unrelated']) {
    assert.equal(
      db.prepare('SELECT status FROM admins WHERE id=?').get(id)!.status,
      'active',
    )
    assert.equal(
      db
        .prepare('SELECT revoked_at FROM admin_sessions WHERE admin_id=?')
        .get(id)!.revoked_at,
      null,
    )
  }
  assert.equal(
    db
      .prepare(
        "SELECT invited_by FROM staff_invites WHERE id='invite-colleague'",
      )
      .get()!.invited_by,
    'old-one',
  )
  assert.equal(
    db.prepare("SELECT metadata FROM audit_log WHERE id='historical'").get()!
      .metadata,
    'preserve-history',
  )
  const audits = db
    .prepare(
      "SELECT actor_type,action,metadata FROM audit_log WHERE action='staff.offboarded'",
    )
    .all()
  assert.equal(audits.length, 2)
  assert.ok(audits.every((entry) => entry.actor_type === 'system'))
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
})

test('missing, invited or demoted business accounts block all production writes with exact gate information', async (t) => {
  for (const mutation of [
    "DELETE FROM admin_sessions WHERE admin_id='support'; DELETE FROM staff_invites WHERE admin_id='support'; DELETE FROM admin_password_resets WHERE admin_id='support'; DELETE FROM admins WHERE id='support'",
    "UPDATE admins SET status='invited' WHERE id='support'",
    "UPDATE admins SET role='compliance' WHERE id='support'",
    "UPDATE admins SET status='disabled' WHERE id='colleague'",
    "UPDATE admins SET role='reviewer' WHERE id='colleague'",
    "UPDATE staff_invites SET accepted_at=NULL WHERE admin_id='support'",
    "UPDATE admins SET password_hash='placeholder' WHERE id='support'",
  ]) {
    const { db, execute, commands } = setup(t)
    db.exec(mutation)
    const before = db.prepare('SELECT total_changes() AS n').get()!.n
    await assert.rejects(
      runOffboarding({ emails, apply: true, execute, now }),
      /Staff offboarding blocked: (Support|Abdikarim) must be.*role=.*status=/,
    )
    assert.equal(db.prepare('SELECT total_changes() AS n').get()!.n, before)
    assert.equal(commands.length, 1)
    assert.equal(
      db.prepare("SELECT status FROM admins WHERE id='old-one'").get()!.status,
      'active',
    )
  }
})

test('business-owner changes between preflight and apply abort the entire batch and retain the old owner', async (t) => {
  const { db, execute } = setup(t)
  let changed = false
  const racedExecute = async (sql: string) => {
    if (!/^SELECT a\.id/.test(sql) && !changed) {
      changed = true
      db.exec("UPDATE admins SET status='disabled' WHERE id='support'")
    }
    return execute(sql)
  }
  await assert.rejects(
    runOffboarding({ emails, apply: true, execute: racedExecute, now }),
    /Support must be an active owner.*status=disabled/,
  )
  assert.equal(
    db.prepare("SELECT status FROM admins WHERE id='old-one'").get()!.status,
    'active',
  )
  assert.equal(
    db
      .prepare("SELECT revoked_at FROM admin_sessions WHERE admin_id='old-one'")
      .get()!.revoked_at,
    null,
  )
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_log WHERE action='staff.offboarded'",
      )
      .get()!.n,
    0,
  )
})

test('target changes between preflight and apply are rejected rather than offboarding another identity', async (t) => {
  const { db, execute } = setup(t)
  const racedExecute = async (sql: string) => {
    if (!/^SELECT a\.id/.test(sql))
      db.exec(
        "UPDATE admins SET email='replacement@example.invalid' WHERE id='old-one'",
      )
    return execute(sql)
  }
  await assert.rejects(
    runOffboarding({ emails, apply: true, execute: racedExecute, now }),
    /batch failed; read-only recheck required/,
  )
  assert.equal(
    db.prepare("SELECT status FROM admins WHERE id='old-one'").get()!.status,
    'active',
  )
  assert.equal(
    db.prepare("SELECT status FROM admins WHERE id='old-two'").get()!.status,
    'active',
  )
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_log WHERE action='staff.offboarded'",
      )
      .get()!.n,
    0,
  )
})

test('rerunning completed offboarding is idempotent and does not create duplicate audit entries', async (t) => {
  const { db, execute } = setup(t)
  await runOffboarding({ emails, apply: true, execute, now })
  const before = db.prepare('SELECT total_changes() AS n').get()!.n
  const result = await runOffboarding({
    emails,
    apply: true,
    execute,
    now: '2026-10-17T12:00:00.000Z',
  })
  assert.equal(result.disabled, 2)
  assert.equal(db.prepare('SELECT total_changes() AS n').get()!.n, before)
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_log WHERE action='staff.offboarded'",
      )
      .get()!.n,
    2,
  )
  assert.equal(
    db.prepare("SELECT updated_at FROM admins WHERE id='old-one'").get()!
      .updated_at,
    now,
  )
})

test('an absent target is an explicit no-op and quoted addresses cannot inject additional SQL', async (t) => {
  const { db, execute } = setup(t)
  const targets = ["absent'@example.invalid"]
  assert.match(preflightSql(targets), /absent''@example\.invalid/)
  const before = db.prepare('SELECT total_changes() AS n').get()!.n
  const result = await runOffboarding({
    emails: targets,
    apply: true,
    execute,
    now,
  })
  assert.equal(result.missing, 1)
  assert.equal(result.found, 0)
  assert.equal(db.prepare('SELECT total_changes() AS n').get()!.n, before)
})

test('private digest selectors resolve exact targets and never log addresses, hashes or IDs', async (t) => {
  const { db, execute } = setup(t)
  const hashes = emails.map((email) =>
    createHash('sha256').update(email).digest('hex'),
  )
  const options = parseArguments([
    '--remote',
    '--apply',
    ...hashes.flatMap((hash) => ['--email-sha256', hash]),
  ])
  const reports: unknown[] = []
  const result = await runSelectedOffboarding({
    ...options,
    execute,
    now,
    report: (entry: unknown) => reports.push(entry),
  })
  assert.equal(result.disabled, 2)
  assert.equal(result.otherActiveOrInvited, 1)
  assert.doesNotMatch(
    JSON.stringify(reports),
    /example\.invalid|old-one|old-two|[a-f0-9]{64}/,
  )
  assert.equal(
    db.prepare("SELECT status FROM admins WHERE id='unrelated'").get()!.status,
    'active',
  )
})

test('missing digest selectors are counted in dry-run and block apply without writes', async (t) => {
  const { db, execute } = setup(t)
  const emailSha256 = [
    createHash('sha256').update('absent@example.invalid').digest('hex'),
  ]
  const before = db.prepare('SELECT total_changes() AS n').get()!.n
  const result = await runSelectedOffboarding({
    emails: [],
    emailSha256,
    execute,
  })
  assert.equal(result.missingSelectors, 1)
  await assert.rejects(
    runSelectedOffboarding({ emails: [], emailSha256, apply: true, execute }),
    /selectors were not found; no writes attempted/,
  )
  assert.equal(db.prepare('SELECT total_changes() AS n').get()!.n, before)
})

test('the remote proxy configuration copies only the exact configured D1 identity and enables its remote binding', () => {
  const databaseId = '12345678-1234-1234-1234-123456789abc'
  const result = remoteBindingConfiguration(
    `name="app"
[[d1_databases]]
binding="DB"
database_name="production"
database_id="${databaseId}"
[vars]
PRIVATE_SETTING="must-not-copy"`,
    'production',
  )
  assert.deepEqual(Object.keys(result).sort(), [
    'compatibility_date',
    'd1_databases',
    'name',
  ])
  assert.deepEqual(result.d1_databases, [
    {
      binding: 'DB',
      database_name: 'production',
      database_id: databaseId,
      preview_database_id: databaseId,
      remote: true,
    },
  ])
  assert.throws(() =>
    remoteBindingConfiguration(
      '[[d1_databases]]\nbinding="DB"\ndatabase_id="not-an-id"',
      'DB',
    ),
  )
})

test('the exact Wrangler native D1 binding rolls back earlier writes when a batch guard fails', async () => {
  const { getPlatformProxy, unstable_splitSqlQuery } = await import('wrangler')
  const directory = await mkdtemp(
    join(tmpdir(), 'xpresstend-native-offboard-test-'),
  )
  let platform: Awaited<ReturnType<typeof getPlatformProxy>> | undefined
  const oldLogLevel = process.env.WRANGLER_LOG
  process.env.WRANGLER_LOG = 'none'
  try {
    const configPath = join(directory, 'wrangler.json')
    await writeFile(
      configPath,
      JSON.stringify({
        name: 'offboarding-local-test',
        compatibility_date: '2026-08-26',
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'isolated-local-only',
            database_id: '12345678-1234-1234-1234-123456789abc',
            remote: false,
          },
        ],
      }),
    )
    platform = await getPlatformProxy({
      configPath,
      remoteBindings: false,
      envFiles: [],
      persist: false,
    })
    const db = platform.env.DB as D1Database
    const execute = bindingExecutor(db, unstable_splitSqlQuery)
    await execute(
      "CREATE TABLE guard_fixture(id INTEGER PRIMARY KEY,status TEXT); INSERT INTO guard_fixture VALUES(1,'active');",
    )
    await assert.rejects(
      execute(
        "UPDATE guard_fixture SET status='disabled' WHERE id=1; SELECT json('');",
      ),
    )
    assert.equal(
      (await execute('SELECT status FROM guard_fixture WHERE id=1;'))[0].status,
      'active',
    )
    await execute(
      "SELECT json('true'); UPDATE guard_fixture SET status='disabled' WHERE id=1;",
    )
    assert.equal(
      (await execute('SELECT status FROM guard_fixture WHERE id=1;'))[0].status,
      'disabled',
    )
  } finally {
    await platform?.dispose()
    await rm(directory, { recursive: true, force: true })
    if (oldLogLevel === undefined) delete process.env.WRANGLER_LOG
    else process.env.WRANGLER_LOG = oldLogLevel
  }
})
