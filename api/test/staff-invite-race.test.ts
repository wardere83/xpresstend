import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { after, before, test, type TestContext } from 'node:test'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { hashToken, verifyPassword } from '../src/crypto.ts'

let route: { fetch: Function }
let directory: string
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'xpresstend-invite-race-'))
  const outfile = join(directory, 'invite.mjs')
  await build({
    entryPoints: [new URL('../src/routes-invite.ts', import.meta.url).pathname],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  })
  route = (await import(pathToFileURL(outfile).href)).invite
})
after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true })
})

async function setup(t: TestContext) {
  const sqlite = new DatabaseSync(':memory:')
  t.after(() => sqlite.close())
  for (const file of [
    '0001_init.sql',
    '0002_seed_reference_data.sql',
    '0006_admin_password_reset.sql',
  ])
    sqlite.exec(
      readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'),
    )
  const now = new Date().toISOString()
  for (const [id, status, role] of [
    ['owner', 'active', 'owner'],
    ['invitee', 'invited', 'compliance'],
  ])
    sqlite
      .prepare(
        `INSERT INTO admins(id,email,password_hash,password_salt,password_iterations,name,role,status,created_at,updated_at)
      VALUES (?,?,'unusable-placeholder','placeholder',200000,?,?,?,?,?)`,
      )
      .run(id, `${id}@example.invalid`, id, role, status, now, now)
  const token = 'test-invitation-capability'
  sqlite
    .prepare(
      `INSERT INTO staff_invites(id,admin_id,token_hash,invited_by,expires_at,created_at)
    VALUES ('invitation','invitee',?,'owner',?,?)`,
    )
    .run(
      await hashToken(token),
      new Date(Date.now() + 3600_000).toISOString(),
      now,
    )
  let beforeBatch: (() => void) | undefined
  let reads = 0
  const execute = (sql: string, values: unknown[]) => {
    const count = Number(sqlite.prepare('SELECT total_changes() AS n').get()!.n)
    const results = sqlite.prepare(sql).all(...values)
    return {
      success: true,
      results,
      meta: {
        changes:
          Number(sqlite.prepare('SELECT total_changes() AS n').get()!.n) -
          count,
      },
    }
  }
  const statement = (sql: string, values: unknown[] = []) => ({
    bind: (...parameters: unknown[]) => statement(sql, parameters),
    first: async () => {
      reads++
      return execute(sql, values).results[0] ?? null
    },
    execute: () => execute(sql, values),
  })
  const env = {
    SESSION_PEPPER: 'isolated-invitation-test',
    DB: {
      prepare: statement,
      batch: async (statements: ReturnType<typeof statement>[]) => {
        beforeBatch?.()
        sqlite.exec('BEGIN')
        try {
          const results = statements.map((item) => item.execute())
          sqlite.exec('COMMIT')
          return results
        } catch (error) {
          sqlite.exec('ROLLBACK')
          throw error
        }
      },
    },
  }
  const request = async (
    password = 'TestPrivatePassphrase!23',
    method = 'POST',
  ) => {
    const response = await route.fetch(
      new Request(
        `https://test.invalid/${token}${method === 'POST' ? '/accept' : ''}`,
        {
          method,
          ...(method === 'POST'
            ? {
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ password }),
              }
            : {}),
        },
      ),
      env,
    )
    return {
      status: response.status,
      body: response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text(),
    }
  }
  return {
    sqlite,
    request,
    onBatch: (callback: () => void) => {
      beforeBatch = callback
    },
    reads: () => reads,
  }
}

test('disabled staff invitations cannot be inspected or used to reactivate staff', async (t) => {
  const { sqlite, request } = await setup(t)
  sqlite.exec("UPDATE admins SET status='disabled' WHERE id='invitee'")
  for (const method of ['GET', 'POST']) {
    const result = await request(undefined, method)
    assert.equal(result.status, 404)
    assert.deepEqual(result.body, { error: 'invalid_invite' })
  }
  assert.equal(
    sqlite.prepare("SELECT password_hash FROM admins WHERE id='invitee'").get()!
      .password_hash,
    'unusable-placeholder',
  )
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS n FROM audit_log').get()!.n,
    0,
  )
})

test('offboarding after invite lookup but before the credential batch prevents reactivation', async (t) => {
  const { sqlite, request, onBatch } = await setup(t)
  onBatch(() =>
    sqlite.exec(`UPDATE admins SET status='disabled' WHERE id='invitee';
    UPDATE staff_invites SET revoked_at='2026-01-01' WHERE admin_id='invitee';`),
  )
  const result = await request()
  assert.equal(result.status, 404)
  assert.deepEqual(result.body, { error: 'invalid_invite' })
  const account = sqlite
    .prepare("SELECT status,password_hash FROM admins WHERE id='invitee'")
    .get()!
  assert.equal(account.status, 'disabled')
  assert.equal(account.password_hash, 'unusable-placeholder')
  assert.equal(
    sqlite
      .prepare("SELECT accepted_at FROM staff_invites WHERE id='invitation'")
      .get()!.accepted_at,
    null,
  )
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS n FROM audit_log').get()!.n,
    0,
  )
})

test('concurrent acceptance of the same invitation allows exactly one credential and audit write', async (t) => {
  const { sqlite, request, reads } = await setup(t)
  const passwords = ['FirstPrivatePassphrase!23', 'SecondPrivatePassphrase!23']
  const results = await Promise.all(
    passwords.map((password) => request(password)),
  )
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 404])
  assert.equal(
    reads(),
    2,
    'both requests looked up the invitation before claiming it',
  )
  const winner = results.findIndex((result) => result.status === 200)
  const account = sqlite
    .prepare(
      "SELECT status,password_hash,password_salt,password_iterations FROM admins WHERE id='invitee'",
    )
    .get()!
  assert.equal(account.status, 'active')
  assert.equal(
    await verifyPassword(
      passwords[winner],
      String(account.password_salt),
      Number(account.password_iterations),
      String(account.password_hash),
      'isolated-invitation-test',
    ),
    true,
  )
  assert.equal(
    await verifyPassword(
      passwords[1 - winner],
      String(account.password_salt),
      Number(account.password_iterations),
      String(account.password_hash),
      'isolated-invitation-test',
    ),
    false,
  )
  assert.ok(
    sqlite
      .prepare("SELECT accepted_at FROM staff_invites WHERE id='invitation'")
      .get()!.accepted_at,
  )
  assert.equal(
    sqlite
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_log WHERE action='staff.invite_accepted'",
      )
      .get()!.n,
    1,
  )
  assert.equal(
    (await request()).status,
    404,
    'a consumed token remains unusable',
  )
})

test('expiry and token revocation after lookup are revalidated before changing credentials', async (t) => {
  for (const mutation of [
    "UPDATE staff_invites SET expires_at='2000-01-01' WHERE id='invitation'",
    "UPDATE staff_invites SET revoked_at='2026-01-01' WHERE id='invitation'",
  ]) {
    const { sqlite, request, onBatch } = await setup(t)
    onBatch(() => sqlite.exec(mutation))
    assert.equal((await request()).status, 404)
    assert.equal(
      sqlite
        .prepare("SELECT password_hash FROM admins WHERE id='invitee'")
        .get()!.password_hash,
      'unusable-placeholder',
    )
    assert.equal(
      sqlite
        .prepare("SELECT accepted_at FROM staff_invites WHERE id='invitation'")
        .get()!.accepted_at,
      null,
    )
    assert.equal(
      sqlite.prepare('SELECT COUNT(*) AS n FROM audit_log').get()!.n,
      0,
    )
  }
})

test('audit failure rolls back invitation consumption and credential activation together', async (t) => {
  const { sqlite, request } = await setup(t)
  sqlite.exec(
    "CREATE TRIGGER reject_accept_audit BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT,'isolated-audit-failure'); END;",
  )
  const originalError = console.error
  console.error = () => {}
  try {
    assert.equal((await request()).status, 500)
  } finally {
    console.error = originalError
  }
  const account = sqlite
    .prepare("SELECT status,password_hash FROM admins WHERE id='invitee'")
    .get()!
  assert.equal(account.status, 'invited')
  assert.equal(account.password_hash, 'unusable-placeholder')
  assert.equal(
    sqlite
      .prepare("SELECT accepted_at FROM staff_invites WHERE id='invitation'")
      .get()!.accepted_at,
    null,
  )
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS n FROM audit_log').get()!.n,
    0,
  )
})
