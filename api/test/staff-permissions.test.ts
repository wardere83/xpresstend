import assert from 'node:assert/strict'
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
  directory = await mkdtemp(join(tmpdir(), 'xpresstend-permissions-'))
  const outfile = join(directory, 'worker.mjs')
  await build({ entryPoints: [new URL('../src/index.ts', import.meta.url).pathname], outfile,
    bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' })
  worker = (await import(pathToFileURL(outfile).href)).default
})
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

async function setup(t: TestContext) {
  const db = new SqliteD1()
  t.after(() => db.close())
  const sessions = await seedParties(db)
  for (const role of ['reviewer', 'viewer']) {
    db.sqlite.prepare(`INSERT INTO admins
      (id,email,password_hash,password_salt,password_iterations,name,role,status,created_at,updated_at)
      SELECT ?,?,password_hash,password_salt,password_iterations,?,?,'active',created_at,updated_at
      FROM admins WHERE id='staff-agent'`).run(`staff-${role}`, `${role}@example.invalid`, role, role)
    const token = `fixture-${role}-session`
    db.sqlite.prepare(`INSERT INTO admin_sessions(id,admin_id,token_hash,expires_at,created_at)
      SELECT ?,?,?,expires_at,created_at FROM admin_sessions WHERE id='session-agent'`)
      .run(`session-${role}`, `staff-${role}`, await hashToken(token))
    sessions.staffCookies[role] = `xt_admin=${token}`
  }
  seedTransfer(db)
  const request = async (path: string, cookie = '', method = 'GET', body?: unknown) => {
    const response = await worker.fetch(new Request(`https://test.invalid/api${path}`, {
      method, headers: { cookie, origin: 'https://test.invalid', 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), fixtureEnv(db), { waitUntil() {} })
    return { status: response.status, body: await response.json() }
  }
  return { db, sessions, request }
}

test('reviewer reads are authenticated, audited and isolated from operational staff', async (t) => {
  const { db, sessions, request } = await setup(t)
  for (const cookie of ['', sessions.userCookie]) {
    assert.equal((await request('/admin/reviewer/overview', cookie)).status, 401)
  }
  for (const role of ['owner', 'compliance', 'agent', 'viewer']) {
    assert.equal((await request('/admin/reviewer/overview', sessions.staffCookies[role])).status, 403)
  }
  const cookie = sessions.staffCookies.reviewer
  for (const path of ['overview', 'consumers', 'transfers', 'transfers/transfer-fixture',
    'ledger/trial-balance', 'ledger/reconciliation', 'ledger/entries', 'audit']) {
    const result = await request(`/admin/reviewer/${path}`, cookie)
    assert.equal(result.status, 200, path)
    assert.doesNotMatch(JSON.stringify(result.body), /password_hash|password_salt|token_hash|fixture-.*-session/)
  }
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE actor_id='staff-reviewer'").get()!.n, 8)
})

test('reviewers cannot operate staff, compliance or customer transfer routes', async (t) => {
  const { db, sessions, request } = await setup(t)
  const cookie = sessions.staffCookies.reviewer
  for (const [method, path, body] of [
    ['GET', '/admin/overview'], ['GET', '/admin/staff'], ['GET', '/admin/compliance/keys'],
    ['POST', '/admin/staff/invite', { email: 'new@example.invalid', name: 'New', role: 'owner', deliverEmail: false }],
    ['PATCH', '/admin/staff/staff-agent', { role: 'owner' }],
    ['POST', '/admin/transfers/transfer-fixture/approve', {}],
    ['POST', '/admin/users/customer-1/kyc', { decision: 'verified', tier: 3 }],
  ] as const) {
    assert.equal((await request(path, cookie, method, body)).status, 403, `${method} ${path}`)
  }
  assert.equal((await request('/transfers', cookie, 'POST', {})).status, 401)
  assert.equal(db.sqlite.prepare("SELECT status FROM transfers WHERE id='transfer-fixture'").get()!.status, 'compliance_hold')
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM staff_invites').get()!.n, 0)
})

test('only owners issue invitations and invited reviewers cannot sign in before activation', async (t) => {
  const { db, sessions, request } = await setup(t)
  const body = { email: 'invited@example.invalid', name: 'Invited Reviewer', role: 'reviewer', deliverEmail: false }
  for (const role of ['reviewer', 'compliance', 'agent', 'viewer']) {
    assert.equal((await request('/admin/staff/invite', sessions.staffCookies[role], 'POST', body)).status, 403)
  }
  assert.equal((await request('/admin/staff/invite', sessions.staffCookies.owner, 'POST', body)).status, 200)
  const invited = db.sqlite.prepare('SELECT status,role FROM admins WHERE email=?').get(body.email)!
  assert.equal(invited.status, 'invited')
  assert.equal(invited.role, 'reviewer')
  assert.equal((await request('/admin/auth/login', '', 'POST', { email: body.email, password: sessions.password })).status, 401)
})
