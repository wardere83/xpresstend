import { Hono } from 'hono'
import type { Env, Vars } from './env'
import { requireUser } from './sessions'
import { newId } from './crypto'
import { overLimit } from './ratelimit'
import {
  personaDecision,
  providerJson,
  ProviderError,
} from './provider-compliance'
import { audit } from './audit'

// A provider result cannot undo the latest staff rejection.
const noManualRejection = `COALESCE((SELECT status FROM kyc_checks WHERE user_id=users.id AND provider='manual' ORDER BY created_at DESC,rowid DESC LIMIT 1),'')<>'failed'`

export const identity = new Hono<{ Bindings: Env; Variables: Vars }>()
identity.use('*', requireUser)
identity.onError((error, c) =>
  c.json(
    {
      error:
        error instanceof ProviderError ? error.code : 'identity_unavailable',
      message:
        'Identity verification is unavailable. Your transfer remains blocked.',
    },
    503,
  ),
)
identity.get('/', async (c) => {
  const session = await c.env.DB.prepare(
    `SELECT id,CASE WHEN status='verified' AND checked_at<strftime('%Y-%m-%dT%H:%M:%fZ','now','-365 days') THEN 'expired' ELSE status END AS status,created_at,checked_at FROM identity_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(c.get('user').id)
    .first()
  return c.json({
    configured: !!(c.env.PERSONA_API_KEY && c.env.PERSONA_TEMPLATE_ID),
    session,
  })
})
identity.post('/start', async (c) => {
  const user = c.get('user')
  if (!c.env.PERSONA_API_KEY || !c.env.PERSONA_TEMPLATE_ID)
    return c.json({ error: 'identity_provider_not_configured' }, 503)
  const body = (await c.req.json().catch(() => ({}))) as { consent?: boolean }
  if (body.consent !== true)
    return c.json({ error: 'identity_consent_required' }, 400)
  if (
    await overLimit(
      c.env,
      'identity-start',
      user.id,
      { max: 3, windowSeconds: 3600 },
      true,
    )
  )
    return c.json({ error: 'rate_limited' }, 429)
  const id = newId('ids')
  const result = await providerJson(
    'https://api.withpersona.com/api/v1/inquiries',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.PERSONA_API_KEY}`,
        'Content-Type': 'application/json',
        'Persona-Version': '2025-10-27',
        'Idempotency-Key': id,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            'inquiry-template-id': c.env.PERSONA_TEMPLATE_ID,
            'reference-id': user.id,
            fields: {
              'name-first': user.firstName,
              'name-last': user.lastName,
            },
          },
        },
      }),
    },
  )
  const data = result.data as { id?: string } | undefined
  if (!data?.id || !/^inq_[a-zA-Z0-9]+$/.test(data.id))
    throw new ProviderError('invalid_identity_response')
  const saved = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO identity_sessions (id,user_id,provider_ref,first_name,last_name,created_at)
      SELECT ?,id,?,?,?,? FROM users WHERE id=? AND status='active' AND first_name=? AND last_name=? AND ${noManualRejection}`,
    ).bind(
      id,
      data.id,
      user.firstName,
      user.lastName,
      new Date().toISOString(),
      user.id,
      user.firstName,
      user.lastName,
    ),
    c.env.DB.prepare(
      `UPDATE users SET kyc_status='pending',kyc_tier=0 WHERE id=? AND status='active' AND ${noManualRejection} AND EXISTS(SELECT 1 FROM identity_sessions WHERE id=? AND user_id=users.id)`,
    ).bind(user.id, id),
  ])
  if (saved[0].meta.changes !== 1 || saved[1].meta.changes !== 1)
    return c.json({ error: 'account_changed_or_review_required' }, 409)
  await audit(c.env.DB, {
    actorType: 'customer',
    actorId: user.id,
    action: 'identity.consent_recorded',
    entityType: 'identity_session',
    entityId: id,
    metadata: { provider: 'persona', consentVersion: '2026-10-14' },
  })
  return c.json({
    id,
    url: `https://withpersona.com/verify?inquiry-id=${encodeURIComponent(data.id)}`,
  })
})
// Server-to-server polling, never a browser callback claiming it passed.
identity.post('/refresh', async (c) => {
  const user = c.get('user')
  if (!c.env.PERSONA_API_KEY || !c.env.PERSONA_TEMPLATE_ID)
    return c.json({ error: 'identity_provider_not_configured' }, 503)
  if (
    await overLimit(
      c.env,
      'identity-refresh',
      user.id,
      { max: 30, windowSeconds: 600 },
      true,
    )
  )
    return c.json({ error: 'rate_limited' }, 429)
  const row = await c.env.DB.prepare(
    `SELECT * FROM identity_sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(user.id)
    .first<{
      id: string
      provider_ref: string
      first_name: string
      last_name: string
    }>()
  if (!row) return c.json({ error: 'identity_session_required' }, 404)
  const payload = await providerJson(
    `https://api.withpersona.com/api/v1/inquiries/${encodeURIComponent(row.provider_ref)}?include=verifications`,
    {
      headers: {
        Authorization: `Bearer ${c.env.PERSONA_API_KEY}`,
        'Persona-Version': '2025-10-27',
      },
    },
  )
  const decision = personaDecision(payload, {
    id: row.provider_ref,
    userId: user.id,
    firstName: row.first_name,
    lastName: row.last_name,
    template: c.env.PERSONA_TEMPLATE_ID,
  })
  const now = new Date().toISOString()
  const result = await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE identity_sessions SET status=?,evidence_json=?,checked_at=? WHERE id=? AND id=(SELECT latest.id FROM identity_sessions latest WHERE latest.user_id=identity_sessions.user_id ORDER BY latest.created_at DESC,latest.rowid DESC LIMIT 1)
      AND EXISTS(SELECT 1 FROM users WHERE id=? AND status='active' AND first_name=? AND last_name=? AND ${noManualRejection})`,
    ).bind(
      decision.status,
      JSON.stringify(decision),
      now,
      row.id,
      user.id,
      row.first_name,
      row.last_name,
    ),
    c.env.DB.prepare(
      `UPDATE users SET kyc_status=?,kyc_tier=?,updated_at=? WHERE id=? AND status='active' AND first_name=? AND last_name=? AND ${noManualRejection}
      AND EXISTS(SELECT 1 FROM identity_sessions WHERE id=? AND checked_at=? AND status=?)`,
    ).bind(
      decision.status,
      decision.status === 'verified' ? 1 : 0,
      now,
      user.id,
      row.first_name,
      row.last_name,
      row.id,
      now,
      decision.status,
    ),
    c.env.DB.prepare(
      `INSERT INTO kyc_checks (id,user_id,provider,provider_ref,status,result_json,created_at)
      SELECT ?,?,'persona',?,?,?,? WHERE EXISTS(SELECT 1 FROM identity_sessions WHERE id=? AND checked_at=?)`,
    ).bind(
      newId('kyc'),
      user.id,
      row.provider_ref,
      decision.status === 'verified'
        ? 'passed'
        : decision.status === 'rejected'
          ? 'failed'
          : 'pending',
      JSON.stringify(decision),
      now,
      row.id,
      now,
    ),
  ])
  if (result[0].meta.changes !== 1 || result[1].meta.changes !== 1)
    return c.json({ error: 'account_changed' }, 409)
  await audit(c.env.DB, {
    actorType: 'system',
    action: 'identity.provider_result',
    entityType: 'identity_session',
    entityId: row.id,
    metadata: decision,
  })
  return c.json(decision)
})
