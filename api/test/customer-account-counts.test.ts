import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { after, before, test, type TestContext } from 'node:test'
import { build } from 'esbuild'
import { hashToken } from '../src/crypto.ts'
import { fixtureEnv, seedParties, seedTransfer, SqliteD1 } from './sanctions-fixture.ts'

let worker: { fetch: Function }
let directory: string
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'xpresstend-customer-counts-'))
  const outfile = join(directory, 'worker.mjs')
  await build({ entryPoints: [new URL('../src/index.ts', import.meta.url).pathname], outfile,
    bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' })
  worker = (await import(pathToFileURL(outfile).href)).default
})
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

async function setup(t: TestContext, options: { emptyCustomers?: boolean } = {}) {
  const db = new SqliteD1()
  t.after(() => db.close())
  const sessions = await seedParties(db)
  db.sqlite.prepare(`INSERT INTO admins
    (id,email,password_hash,password_salt,password_iterations,name,role,status,created_at,updated_at)
    SELECT 'staff-reviewer','reviewer@example.invalid',password_hash,password_salt,password_iterations,
           'Fixture reviewer','reviewer','active',created_at,updated_at
      FROM admins WHERE id='staff-agent'`).run()
  db.sqlite.prepare(`INSERT INTO admin_sessions(id,admin_id,token_hash,expires_at,created_at)
    SELECT 'session-reviewer','staff-reviewer',?,expires_at,created_at
      FROM admin_sessions WHERE id='session-agent'`).run(await hashToken('fixture-reviewer-session'))
  sessions.staffCookies.reviewer = 'xt_admin=fixture-reviewer-session'
  if (options.emptyCustomers) {
    db.sqlite.exec('DELETE FROM recipients; DELETE FROM sessions; DELETE FROM users;')
  } else {
    for (const id of ['customer-2', 'customer-3', 'customer-4']) {
      db.sqlite.prepare(`INSERT INTO users
        (id,email,password_hash,password_salt,password_iterations,first_name,last_name,
         status,kyc_status,kyc_tier,created_at,updated_at)
        SELECT ?,?,password_hash,password_salt,password_iterations,first_name,last_name,
               status,kyc_status,kyc_tier,created_at,updated_at
          FROM users WHERE id='customer-1'`).run(id, `${id}@example.invalid`)
    }
    seedTransfer(db)
    db.sqlite.exec(`INSERT INTO ledger_entries
      (id,transfer_id,account_code,currency,amount_minor,entry_group,created_at) VALUES
      ('fixture-cash','transfer-fixture','cash','USD',10099,'fixture-funding','2026-10-18T00:00:00Z'),
      ('fixture-payable','transfer-fixture','payout_payable','USD',-10099,'fixture-funding','2026-10-18T00:00:00Z')`)
  }
  const env = fixtureEnv(db)
  async function request(path: string, cookie = '', method = 'GET', body?: unknown) {
    const response = await worker.fetch(new Request(`https://test.invalid/api${path}`, {
      method, headers: { cookie, origin: 'https://test.invalid', 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), env, { waitUntil() {} })
    return { status: response.status, body: await response.json() }
  }
  function classifyInternalTests() {
    db.sqlite.prepare(`INSERT INTO user_account_classifications(user_id,kind,reason,classified_at)
      SELECT id,'internal_test','Owner-confirmed internal registrations','2026-10-18T01:54:23.000Z'
        FROM users`).run()
  }
  const overviews = async () => Promise.all([
    request('/admin/overview', sessions.staffCookies.owner),
    request('/admin/reviewer/overview', sessions.staffCookies.reviewer),
  ])
  return { db, sessions, request, classifyInternalTests, overviews }
}

test('explicit internal tests are separated from dynamic customer totals without changing accounts or evidence', async (t) => {
  const f = await setup(t)
  for (const result of await f.overviews()) {
    assert.equal(result.status, 200)
    assert.deepEqual(result.body.customers, { total: 4, active: 4, verified: 4, internalTestAccounts: 0 })
  }
  const before = Object.fromEntries(['users', 'admins', 'sessions', 'recipients', 'transfers', 'ledger_entries']
    .map((table) => [table, f.db.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all()]))
  f.classifyInternalTests()
  // A migration rerun must neither duplicate nor discard the explicit labels.
  f.db.sqlite.exec(readFileSync(new URL('../migrations/0010_internal_test_accounts.sql', import.meta.url), 'utf8'))
  for (const result of await f.overviews()) {
    assert.equal(result.status, 200)
    assert.deepEqual(result.body.customers, { total: 0, active: 0, verified: 0, internalTestAccounts: 4 })
    assert.equal(result.body.awaitingReview, 1, 'operational transfer counts remain truthful')
  }
  for (const [table, rows] of Object.entries(before)) {
    assert.deepEqual(f.db.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all(), rows, `${table} unchanged`)
  }
  const me = await f.request('/auth/me', f.sessions.userCookie)
  assert.equal(me.status, 200, 'classification does not disable internal account access')
  const directoryBefore = await f.request('/admin/reviewer/consumers', f.sessions.staffCookies.reviewer)
  assert.equal(directoryBefore.status, 200)
  assert.equal(directoryBefore.body.total, 4, 'the audited directory retains internal registrations')
  assert.deepEqual(directoryBefore.body.consumers.map((row: { id: string }) => row.id).sort(),
    ['customer-1', 'customer-2', 'customer-3', 'customer-4'])

  const registration = await f.request('/auth/register', '', 'POST', {
    email: 'new-customer@example.invalid', password: 'NewCustomerPassword456!', firstName: 'Sam', lastName: 'Erikson',
  })
  assert.equal(registration.status, 200)
  for (const result of await f.overviews()) {
    assert.deepEqual(result.body.customers, { total: 1, active: 1, verified: 0, internalTestAccounts: 4 },
      'a new real customer counts immediately, including before KYC verification')
  }
  f.db.sqlite.exec("UPDATE users SET kyc_status='verified',kyc_tier=1 WHERE email='new-customer@example.invalid'")
  for (const result of await f.overviews()) {
    assert.deepEqual(result.body.customers, { total: 1, active: 1, verified: 1, internalTestAccounts: 4 })
  }
  const directoryAfter = await f.request('/admin/reviewer/consumers', f.sessions.staffCookies.reviewer)
  assert.equal(directoryAfter.body.total, 5)
  assert.equal(f.db.sqlite.prepare('SELECT COUNT(*) AS n FROM user_account_classifications').get()!.n, 4,
    'new registrations are never automatically classified as tests')
})

test('classification does not broaden access to customer statistics or the audited directory', async (t) => {
  const f = await setup(t)
  f.classifyInternalTests()
  for (const cookie of ['', f.sessions.userCookie]) {
    for (const path of ['/admin/overview', '/admin/reviewer/overview', '/admin/reviewer/consumers']) {
      assert.equal((await f.request(path, cookie)).status, 401)
    }
  }
  assert.equal((await f.request('/admin/overview', f.sessions.staffCookies.reviewer)).status, 403)
  for (const role of ['owner', 'compliance', 'agent']) {
    for (const path of ['/admin/reviewer/overview', '/admin/reviewer/consumers']) {
      assert.equal((await f.request(path, f.sessions.staffCookies[role])).status, 403)
    }
  }
  const overview = await f.request('/admin/overview', f.sessions.staffCookies.owner)
  assert.doesNotMatch(JSON.stringify(overview.body), /password_hash|password_salt|token_hash|example\.invalid/)
})

test('empty customer tables return numeric zero counts, including the separate internal-test count', async (t) => {
  const f = await setup(t, { emptyCustomers: true })
  for (const result of await f.overviews()) {
    assert.equal(result.status, 200)
    assert.deepEqual(result.body.customers, { total: 0, active: 0, verified: 0, internalTestAccounts: 0 })
  }
})
