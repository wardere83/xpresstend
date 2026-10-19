import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import {
  APPROVED_CUTOFF,
  EXPECTED_COHORT,
  parseArguments,
  preflightSql,
  runClassification,
} from '../scripts/classify-internal-tests.mjs'
import { seedParties, seedTransfer, SqliteD1 } from './sanctions-fixture.ts'

const now = '2026-10-19T02:00:00.000Z'
const later = '2026-10-19T01:54:23.001Z'
const classificationAction = 'customer.classified_internal_test'

function addUser(db: SqliteD1, id: string, createdAt: string) {
  db.sqlite.prepare(`INSERT INTO users(id,email,password_hash,password_salt,password_iterations,first_name,last_name,created_at,updated_at)
    VALUES (?,?,'preserved-hash','preserved-salt',1000,'Fixture','Customer',?,?)`)
    .run(id, `${id}@example.invalid`, createdAt, createdAt)
}

async function setup(t: TestContext) {
  const db = new SqliteD1()
  t.after(() => db.close())
  await seedParties(db)
  db.sqlite.prepare('UPDATE users SET created_at=?').run('2026-10-01T00:00:00.000Z')
  addUser(db, 'customer-2', '2026-10-18T00:00:00.000Z')
  addUser(db, 'customer-3', '2026-10-19T01:54:22.999Z')
  addUser(db, 'customer-4', APPROVED_CUTOFF)
  addUser(db, 'later-customer', later)
  seedTransfer(db, 'retained-financial-record', 'completed')
  db.sqlite.prepare(`INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at)
    VALUES ('historical-audit','customer','customer-1','historical.action','user','customer-1','{}',?)`).run(now)
  return db
}

function preservedRecords(db: SqliteD1) {
  return Object.fromEntries([
    'users', 'sessions', 'recipients', 'transfers', 'transfer_events', 'ledger_entries', 'kyc_checks',
  ].map((table) => [table, db.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all()]))
}

const classifications = (db: SqliteD1) => db.sqlite.prepare('SELECT * FROM user_account_classifications ORDER BY user_id').all()
const audits = (db: SqliteD1) => db.sqlite.prepare('SELECT * FROM audit_log WHERE action=? ORDER BY entity_id').all(classificationAction)

test('classification CLI defaults to dry-run and cannot widen the fixed approved cohort', () => {
  assert.equal(APPROVED_CUTOFF, '2026-10-19T01:54:23.000Z')
  assert.equal(EXPECTED_COHORT, 4)
  assert.deepEqual(parseArguments([]), { apply: false, database: 'xpresstend-production' })
  assert.equal(parseArguments(['--remote', '--apply']).apply, true)
  for (const args of [
    ['--apply'], ['--remote', '--apply', '--dry-run'], ['--all'],
    ['--cutoff=2099-01-01'], ['--expected=5'], ['--database=invalid;SQL'],
  ]) assert.throws(() => parseArguments(args))
  assert.match(preflightSql(), /SELECT u\.id,u\.created_at,c\.kind/)
  assert.doesNotMatch(preflightSql(), /email|password|phone|first_name|last_name/i)
})

test('dry-run reads only the approved four and reports counts without changing records', async (t) => {
  const db = await setup(t)
  const before = preservedRecords(db)
  const changes = db.sqlite.prepare('SELECT total_changes() AS n').get()!.n
  let batches = 0
  const originalBatch = db.batch.bind(db)
  db.batch = async (statements) => { batches++; return originalBatch(statements) }
  const result = await runClassification({ db, now })
  assert.deepEqual(result, { ready: true, classified: 0, pending: 4 })
  assert.equal(batches, 0)
  assert.equal(db.sqlite.prepare('SELECT total_changes() AS n').get()!.n, changes)
  assert.deepEqual(preservedRecords(db), before)
  assert.deepEqual(classifications(db), [])
  assert.deepEqual(audits(db), [])
  assert.doesNotMatch(JSON.stringify(result), /customer-|@|hash|salt|token/i)
})

test('atomic classification preserves later customers and all existing records; audited retries write nothing', async (t) => {
  const db = await setup(t)
  const before = preservedRecords(db)
  const historical = db.sqlite.prepare('SELECT * FROM audit_log ORDER BY id').all()
  let batches = 0
  const originalBatch = db.batch.bind(db)
  db.batch = async (statements) => { batches++; return originalBatch(statements) }
  assert.deepEqual(await runClassification({ db, apply: true, now }), { ready: true, classified: 4, pending: 0 })
  assert.equal(batches, 1, 'classification and audit use one native D1 transaction')
  assert.deepEqual(preservedRecords(db), before, 'status, credentials, sessions, verification and financial history remain intact')
  assert.equal(classifications(db).length, 4)
  assert.equal(classifications(db).some((row) => row.user_id === 'later-customer'), false)
  assert.equal(audits(db).length, 4)
  for (const row of classifications(db)) {
    assert.equal(row.kind, 'internal_test')
    assert.equal(row.reason, 'owner_confirmed_internal_test')
    assert.equal(row.classified_at, now)
  }
  for (const row of audits(db)) {
    assert.equal(row.actor_type, 'system')
    assert.equal(row.actor_id, null)
    assert.equal(row.entity_type, 'user')
    assert.equal(row.created_at, now)
    assert.deepEqual(JSON.parse(String(row.metadata)), { reason: 'owner_confirmed_internal_test', approvedCutoff: APPROVED_CUTOFF })
  }
  assert.deepEqual(db.sqlite.prepare('SELECT * FROM audit_log WHERE id=?').all('historical-audit'), historical)
  const classifiedBefore = classifications(db)
  const auditBefore = audits(db)
  const changes = db.sqlite.prepare('SELECT total_changes() AS n').get()!.n
  assert.deepEqual(await runClassification({ db, apply: true, now: '2026-10-20T00:00:00.000Z' }), { ready: true, classified: 4, pending: 0 })
  assert.equal(batches, 1)
  assert.equal(db.sqlite.prepare('SELECT total_changes() AS n').get()!.n, changes)
  assert.deepEqual(classifications(db), classifiedBefore)
  assert.deepEqual(audits(db), auditBefore)
})

test('a missing or additional pre-cutoff registration fails closed before writes', async (t) => {
  for (const scenario of ['missing', 'additional']) await t.test(scenario, async (context) => {
    const db = await setup(context)
    if (scenario === 'missing') db.sqlite.exec("DELETE FROM users WHERE id='customer-4'")
    else addUser(db, 'unexpected-earlier-customer', '2026-10-18T00:00:00.000Z')
    const result = await runClassification({ db, now })
    assert.equal(result.ready, false)
    await assert.rejects(runClassification({ db, apply: true, now }), /blocked/)
    assert.equal(classifications(db).length, 0)
    assert.equal(audits(db).length, 0)
  })
})

test('stable cohort guards reject count, identity, timestamp, classification and audit changes before the write batch', async (t) => {
  for (const scenario of ['count', 'identity', 'timestamp', 'kind', 'audit']) await t.test(scenario, async (context) => {
    const db = await setup(context)
    const originalBatch = db.batch.bind(db)
    db.batch = async (statements) => {
      if (scenario === 'count') addUser(db, 'concurrent-earlier-customer', '2026-10-18T00:00:00.000Z')
      if (scenario === 'identity') {
        db.sqlite.exec("DELETE FROM users WHERE id='customer-4'")
        addUser(db, 'replacement-customer', APPROVED_CUTOFF)
      }
      if (scenario === 'timestamp') db.sqlite.exec("UPDATE users SET created_at='2026-10-02T00:00:00.000Z' WHERE id='customer-4'")
      if (scenario === 'kind') db.sqlite.prepare("INSERT INTO user_account_classifications VALUES ('customer-4','internal_test','concurrent_classification',?)").run(now)
      if (scenario === 'audit') db.sqlite.prepare(`INSERT INTO audit_log(id,actor_type,action,entity_type,entity_id,created_at)
        VALUES ('concurrent-audit','system',?,'user','customer-4',?)`).run(classificationAction, now)
      return originalBatch(statements)
    }
    await assert.rejects(runClassification({ db, apply: true, now }), /unavailable/)
    assert.equal(classifications(db).length, scenario === 'kind' ? 1 : 0)
    assert.equal(audits(db).length, scenario === 'audit' ? 1 : 0)
  })
})

test('mid-batch audit or classification failure rolls back every new classification and audit', async (t) => {
  for (const table of ['audit_log', 'user_account_classifications']) await t.test(table, async (context) => {
    const db = await setup(context)
    const before = preservedRecords(db)
    const field = table === 'audit_log' ? 'entity_id' : 'user_id'
    db.sqlite.exec(`CREATE TRIGGER fail_classification BEFORE INSERT ON ${table} WHEN NEW.${field}='customer-3'
      BEGIN SELECT RAISE(ABORT,'injected mid-batch failure'); END`)
    await assert.rejects(runClassification({ db, apply: true, now }), /unavailable/)
    assert.deepEqual(preservedRecords(db), before)
    assert.equal(classifications(db).length, 0)
    assert.equal(audits(db).length, 0)
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM audit_log').get()!.n, 1)
  })
})

test('an unaudited classification blocks retries and database errors never expose SDK material', async (t) => {
  const db = await setup(t)
  db.sqlite.prepare("INSERT INTO user_account_classifications VALUES ('customer-4','internal_test','owner_confirmed_internal_test',?)").run(now)
  assert.deepEqual(await runClassification({ db, now }), { ready: false, classified: 1, pending: 3 })
  await assert.rejects(runClassification({ db, apply: true, now }), /blocked/)
  assert.equal(classifications(db).length, 1)
  assert.equal(audits(db).length, 0)
  const secret = 'https://signed-proxy.invalid/?token=private-sdk-value&user=private-identity'
  await assert.rejects(runClassification({ db: { prepare() { throw new Error(secret) } }, now }), (error: Error) => {
    assert.match(error.message, /unavailable/)
    assert.doesNotMatch(error.message, /signed-proxy|private-sdk|private-identity|https:/)
    return true
  })
})
