import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { after, before, test } from 'node:test'
import { build } from 'esbuild'
import { Hono } from 'hono'
import {
  fixtureEnv,
  seedDataset,
  seedParties,
  seedTransfer,
  SqliteD1,
} from './sanctions-fixture.ts'
let app: Hono, lib: Record<string, Function>, dir: string
before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'xpt-bank-'))
  const modules = await Promise.all(
    [
      'routes-transfers',
      'routes-admin',
      'routes-bank',
      'provider-compliance',
      'routes-identity',
    ].map(async (name) => {
      const outfile = join(dir, `${name}.mjs`)
      await build({
        entryPoints: [new URL(`../src/${name}.ts`, import.meta.url).pathname],
        outfile,
        bundle: true,
        platform: 'node',
        format: 'esm',
        logLevel: 'silent',
      })
      return import(pathToFileURL(outfile).href)
    }),
  )
  app = new Hono()
  app.route('/', modules[0].transfers)
  app.route('/admin', modules[1].admin)
  app.route('/bank', modules[2].bankApi)
  app.route('/identity', modules[4].identity)
  app.onError((_e, c) => c.json({ error: 'internal_error' }, 500))
  lib = modules[3]
})
after(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})
async function setup(t: { after: (fn: () => void) => void }) {
  const db = new SqliteD1()
  t.after(() => db.close())
  seedDataset(db)
  const sessions = await seedParties(db)
  const env = fixtureEnv(db)
  async function req(
    path: string,
    body?: unknown,
    token?: string,
    cookie = sessions.staffCookies.owner,
  ) {
    const r = await app.request(
      path,
      {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          cookie,
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
      env,
    )
    return { status: r.status, body: await r.json() }
  }
  async function funded(id = 'transfer-1') {
    seedTransfer(db, id, 'awaiting_payment')
    assert.equal(
      (
        await req(
          `/transfers/${id}/pay`,
          { password: sessions.password },
          undefined,
          sessions.userCookie,
        )
      ).status,
      200,
    )
    return id
  }
  const key = async (bankId = 'bank-one') =>
    (await req('/admin/compliance/keys', { bankId, label: 'Bank integration' }))
      .body
  return { db, env, sessions, req, funded, key }
}
test('bank routes reject anonymous callers and customer sessions', async (t) => {
  const f = await setup(t)
  assert.equal((await f.req('/bank/batches')).status, 401)
  assert.equal(
    (
      await f.req(
        '/admin/compliance/overview',
        undefined,
        undefined,
        f.sessions.userCookie,
      )
    ).status,
    401,
  )
  assert.equal(
    (
      await f.req(
        '/admin/compliance/overview',
        undefined,
        undefined,
        f.sessions.staffCookies.agent,
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await f.req(
        '/admin/compliance/keys',
        { bankId: 'bank-one', label: 'Bank' },
        undefined,
        f.sessions.staffCookies.compliance,
      )
    ).status,
    403,
  )
})
test('bank manifests reconcile exactly, preserve names and isolate banks; approval gates release', async (t) => {
  const f = await setup(t),
    id = await f.funded(),
    key = await f.key(),
    other = await f.key('bank-two')
  const batch = await f.req('/admin/compliance/batches', {
    bankId: 'bank-one',
    transferIds: [id],
  })
  assert.equal(batch.status, 201)
  assert.equal(
    (await f.req('/bank/batches', undefined, other.token)).body.batches.length,
    0,
  )
  assert.equal(
    (await f.req(`/bank/batches/${batch.body.id}`, undefined, other.token))
      .status,
    404,
  )
  const detail = await f.req(
    `/bank/batches/${batch.body.id}`,
    undefined,
    key.token,
  )
  assert.equal(detail.status, 200)
  assert.equal(detail.body.manifest.totalMinor, 10000)
  assert.equal(detail.body.manifest.items[0].fee_minor, 99)
  assert.equal(detail.body.manifest.items[0].first_name, 'Zelda')
  assert.ok(detail.body.ledger.length > 1)
  const { createHash } = await import('node:crypto')
  assert.equal(
    createHash('sha256').update(detail.body.manifestCanonical).digest('hex'),
    batch.body.manifestHash,
  )
  assert.equal((await f.req(`/admin/transfers/${id}/approve`, {})).status, 409)
  const body = {
    decision: 'approved',
    manifestHash: batch.body.manifestHash,
    reference: 'bank-ref-1',
    reason: 'All individual names screened by bank compliance.',
  }
  assert.equal(
    (await f.req(`/bank/batches/${batch.body.id}/decision`, body, other.token))
      .status,
    409,
  )
  assert.equal(
    (
      await f.req(
        `/bank/batches/${batch.body.id}/decision`,
        { ...body, manifestHash: 'wrong' },
        key.token,
      )
    ).status,
    409,
  )
  assert.equal(
    (await f.req(`/bank/batches/${batch.body.id}/decision`, body, key.token))
      .status,
    200,
  )
  assert.equal(
    (await f.req(`/bank/batches/${batch.body.id}/decision`, body, key.token))
      .status,
    409,
  )
  assert.equal((await f.req(`/admin/transfers/${id}/approve`, {})).status, 200)
})
test('revoked bank keys cannot read or authorize release', async (t) => {
  const f = await setup(t),
    id = await f.funded(),
    key = await f.key()
  const batch = (
    await f.req('/admin/compliance/batches', {
      bankId: 'bank-one',
      transferIds: [id],
    })
  ).body
  assert.equal(
    (
      await f.req(
        `/bank/batches/${batch.id}/decision`,
        {
          decision: 'approved',
          manifestHash: batch.manifestHash,
          reference: 'ref-one',
          reason: 'Completed screening of each individual.',
        },
        key.token,
      )
    ).status,
    200,
  )
  await f.req(`/admin/compliance/keys/${key.id}/revoke`, {})
  assert.equal((await f.req('/bank/batches', undefined, key.token)).status, 401)
  assert.equal((await f.req(`/admin/transfers/${id}/approve`, {})).status, 409)
})
test('name changes after bank approval invalidate release', async (t) => {
  const f = await setup(t),
    id = await f.funded(),
    key = await f.key()
  const batch = (
    await f.req('/admin/compliance/batches', {
      bankId: 'bank-one',
      transferIds: [id],
    })
  ).body
  await f.req(
    `/bank/batches/${batch.id}/decision`,
    {
      decision: 'approved',
      manifestHash: batch.manifestHash,
      reference: 'ref-one',
      reason: 'Completed screening of each individual.',
    },
    key.token,
  )
  f.db.sqlite.exec("UPDATE recipients SET full_name='New Recipient Name'")
  assert.equal((await f.req(`/admin/transfers/${id}/approve`, {})).status, 409)
})
test('duplicate allocations and empty batches are rejected; audit and ledger are immutable', async (t) => {
  const f = await setup(t),
    id = await f.funded()
  await f.key()
  assert.equal(
    (
      await f.req('/admin/compliance/batches', {
        bankId: 'bank-one',
        transferIds: [],
      })
    ).status,
    400,
  )
  const payload = { bankId: 'bank-one', transferIds: [id] }
  assert.equal((await f.req('/admin/compliance/batches', payload)).status, 201)
  assert.equal((await f.req('/admin/compliance/batches', payload)).status, 409)
  assert.throws(
    () => f.db.sqlite.exec('DELETE FROM wire_batch_items'),
    /immutable/,
  )
  assert.throws(
    () => f.db.sqlite.exec('UPDATE ledger_entries SET amount_minor=1'),
    /append_only/,
  )
  assert.throws(() => f.db.sqlite.exec('DELETE FROM audit_log'), /append_only/)
})
test('batch creation rolls back fully when a contribution changes during the transaction', async (t) => {
  const f = await setup(t),
    id = await f.funded()
  await f.key()
  let changed = false
  f.db.beforeExecute = (sql) => {
    if (!changed && sql.includes('INSERT INTO wire_batch_items')) {
      changed = true
      f.db.sqlite.exec(
        "UPDATE recipients SET full_name='Changed Before Commit'",
      )
    }
  }
  assert.equal(
    (
      await f.req('/admin/compliance/batches', {
        bankId: 'bank-one',
        transferIds: [id],
      })
    ).status,
    409,
  )
  assert.equal(
    f.db.sqlite.prepare('SELECT COUNT(*) AS n FROM wire_batches').get()!.n,
    0,
  )
})
function inquiry() {
  return {
    data: {
      id: 'inq_1',
      type: 'inquiry',
      attributes: { status: 'approved', 'reference-id': 'customer-1' },
      relationships: {
        'inquiry-template': { data: { id: 'itmpl_1' } },
        verifications: { data: [{ id: 'id_1' }, { id: 'selfie_1' }] },
      },
    },
    included: [
      {
        id: 'id_1',
        type: 'verification/government-id',
        attributes: {
          status: 'passed',
          'name-first': 'Zelda',
          'name-last': 'Evergreen Merritt',
        },
      },
      {
        id: 'selfie_1',
        type: 'verification/selfie',
        attributes: {
          status: 'passed',
          checks: [
            { name: 'selfie_liveness_detection', status: 'passed' },
            { name: 'selfie_id_comparison', status: 'passed' },
          ],
        },
      },
    ],
  }
}
const expected = {
  id: 'inq_1',
  userId: 'customer-1',
  firstName: 'Zelda',
  lastName: 'Evergreen Merritt',
  template: 'itmpl_1',
}
test('Persona requires linked ID, correct names, live selfie, and approval', () => {
  assert.equal(lib.personaDecision(inquiry(), expected).status, 'verified')
  const missing = inquiry()
  missing.included.pop()
  assert.equal(lib.personaDecision(missing, expected).status, 'pending')
  const bad = inquiry()
  bad.included[1].attributes.checks![0].status = 'failed'
  assert.equal(lib.personaDecision(bad, expected).status, 'pending')
  assert.equal(
    lib.personaDecision(inquiry(), { ...expected, lastName: 'Different' })
      .status,
    'pending',
  )
  assert.throws(
    () => lib.personaDecision(inquiry(), { ...expected, userId: 'other' }),
    /mismatch/,
  )
  assert.throws(
    () => lib.personaDecision(inquiry(), { ...expected, template: 'other' }),
    /mismatch/,
  )
})
test('malformed screening and provider false-positive labels never auto-clear', () => {
  assert.throws(() => lib.sanctionsDecision({}), /invalid_screening/)
  const make = (hits: number, status: string) => ({
    status: 'success',
    content: {
      data: { id: 123, total_hits: hits, hits: [], match_status: status },
    },
  })
  assert.equal(lib.sanctionsDecision(make(0, 'no_match')).status, 'clear')
  assert.equal(
    lib.sanctionsDecision(make(1, 'false_positive')).status,
    'review_required',
  )
  assert.equal(
    lib.sanctionsDecision(make(0, 'unknown')).status,
    'review_required',
  )
})
test('production cannot use manual KYC or release without provider evidence', async (t) => {
  const f = await setup(t)
  f.env.ENVIRONMENT = 'production'
  assert.equal(
    (
      await f.req('/admin/users/customer-1/kyc', {
        decision: 'verified',
        tier: 1,
      })
    ).status,
    403,
  )
  const pre = await f.req(
    '/transfers/preflight',
    { recipientId: 'recipient-1' },
    undefined,
    f.sessions.userCookie,
  )
  assert.equal(pre.status, 403)
  assert.equal(pre.body.error, 'identity_verification_required')
})
test('global provider timeout fails closed and records unavailable evidence', async (t) => {
  const f = await setup(t)
  const env = {
    ...f.env,
    COMPLIANCE_PROVIDERS_REQUIRED: 'true',
    COMPLYADVANTAGE_API_KEY: 'test-only',
  }
  const original = globalThis.fetch
  t.after(() => {
    globalThis.fetch = original
  })
  globalThis.fetch = async () => {
    throw new Error('timeout')
  }
  await assert.rejects(
    () =>
      lib.screenGlobal(env, 'pre-1', [
        {
          subjectId: 'recipient-1',
          subjectType: 'recipient',
          name: 'Test Name',
        },
      ]),
    /unavailable/,
  )
  assert.equal(
    f.db.sqlite.prepare('SELECT status FROM provider_screenings').get()!.status,
    'unavailable',
  )
})
test('provider-verified customers still cannot send when global screening is unconfigured', async (t) => {
  const f = await setup(t)
  f.env.ENVIRONMENT = 'production'
  const now = new Date().toISOString()
  f.db.sqlite
    .prepare(
      `INSERT INTO identity_sessions(id,user_id,provider_ref,first_name,last_name,status,created_at,checked_at) VALUES ('ids','customer-1','inq_test','Zelda','Evergreen Merritt','verified',?,?)`,
    )
    .run(now, now)
  const response = await f.req(
    '/transfers/preflight',
    { recipientId: 'recipient-1' },
    undefined,
    f.sessions.userCookie,
  )
  assert.equal(response.status, 503)
  assert.equal(response.body.error, 'sanctions_provider_not_configured')
})
test('new declined identity evidence supersedes prior verification', async (t) => {
  const f = await setup(t)
  f.env.ENVIRONMENT = 'production'
  const now = new Date().toISOString()
  f.db.sqlite
    .prepare(
      `INSERT INTO identity_sessions(id,user_id,provider_ref,first_name,last_name,status,created_at,checked_at) VALUES ('old','customer-1','inq_old','Zelda','Evergreen Merritt','verified',?,?)`,
    )
    .run('2026-01-01T00:00:00.000Z', now)
  f.db.sqlite
    .prepare(
      `INSERT INTO identity_sessions(id,user_id,provider_ref,first_name,last_name,status,created_at,checked_at) VALUES ('new','customer-1','inq_new','Zelda','Evergreen Merritt','rejected',?,?)`,
    )
    .run(now, now)
  const r = await f.req(
    '/transfers/preflight',
    { recipientId: 'recipient-1' },
    undefined,
    f.sessions.userCookie,
  )
  assert.equal(r.status, 403)
})

test('staff rejection cannot be reset by starting a provider inquiry', async (t) => {
  const f = await setup(t)
  f.env.PERSONA_API_KEY = 'test-key'
  f.env.PERSONA_TEMPLATE_ID = 'itmpl_test'
  f.db.sqlite.exec(`INSERT INTO kyc_checks(id,user_id,provider,status,created_at) VALUES ('manual-reject','customer-1','manual','failed','2026-10-15T00:00:00Z'); UPDATE users SET kyc_status='rejected' WHERE id='customer-1'`)
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async () => Response.json({data:{id:'inq_newtest'}})
  const result = await f.req('/identity/start',{consent:true},undefined,f.sessions.userCookie)
  assert.equal(result.status,409)
  assert.equal(f.db.sqlite.prepare(`SELECT kyc_status FROM users WHERE id='customer-1'`).get().kyc_status,'rejected')
  assert.equal(f.db.sqlite.prepare('SELECT count(*) AS n FROM identity_sessions').get().n,0)
})

test('expired identity evidence exposes a re-verification state', async (t) => {
  const f = await setup(t)
  f.db.sqlite.exec(`INSERT INTO identity_sessions(id,user_id,provider_ref,first_name,last_name,status,created_at,checked_at) VALUES ('expired','customer-1','inq_expired','Zelda','Evergreen Merritt','verified','2020-01-01','2020-01-01')`)
  const result = await f.req('/identity',undefined,undefined,f.sessions.userCookie)
  assert.equal(result.body.session.status,'expired')
})

test('bank decisions reject whitespace-only audit fields', async (t) => {
  const f = await setup(t)
  const key = await f.key()
  const result = await f.req('/bank/batches/absent/decision',{decision:'approved',manifestHash:'hash',reference:'   ',reason:' '.repeat(30)},key.token)
  assert.equal(result.status,400)
})
