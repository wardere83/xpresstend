import { Hono } from 'hono'
import type { Env, Vars } from './env'
import { requireRole } from './sessions'
import { hashToken, newId, randomHex } from './crypto'
import { audit } from './audit'
import { getSanctionsStatus } from './sanctions.ts'
import { overLimit } from './ratelimit'
import { providersRequired } from './provider-compliance'
import { screenTransferSubjects, screeningFailure } from './compliance'

export const bankAdmin = new Hono<{ Bindings: Env; Variables: Vars }>()
bankAdmin.use('*', requireRole('owner', 'compliance'))
bankAdmin.get('/overview', async (c) => {
  const [batches, identity, screenings, keys] = await c.env.DB.batch([
    c.env.DB.prepare(
      'SELECT * FROM wire_batches ORDER BY created_at DESC LIMIT 100',
    ),
    c.env.DB.prepare(
      'SELECT status,COUNT(*) AS count FROM identity_sessions GROUP BY status',
    ),
    c.env.DB.prepare(
      'SELECT id,transfer_id,subject_type,subject_name,provider_ref,status,created_at FROM provider_screenings ORDER BY created_at DESC LIMIT 100',
    ),
    c.env.DB.prepare(
      'SELECT id,bank_id,label,expires_at,revoked_at FROM bank_api_keys ORDER BY created_at DESC LIMIT 100',
    ),
  ])
  return c.json({
    testMode: true,
    providers: {
      identity: !!(c.env.PERSONA_API_KEY && c.env.PERSONA_TEMPLATE_ID),
      sanctions: !!c.env.COMPLYADVANTAGE_API_KEY,
    },
    batches: batches.results,
    identity: identity.results,
    screenings: screenings.results,
    keys: keys.results,
  })
})
/** Configuration presence and database readiness, not a provider certification claim. */
bankAdmin.get('/readiness', async (c) => {
  const [ofac, connection] = await Promise.all([
    getSanctionsStatus(c.env),
    c.env.DB.prepare('SELECT COUNT(*) AS n FROM bank_api_keys WHERE revoked_at IS NULL AND expires_at>?')
      .bind(new Date().toISOString()).first<{ n: number }>(),
  ])
  return c.json({
    checkedAt: new Date().toISOString(),
    bankApi: { available: true, activeConnections: connection?.n ?? 0, mode: 'review-only', basePath: '/api/bank/v1' },
    identity: { provider: 'persona', configured: !!(c.env.PERSONA_API_KEY && c.env.PERSONA_TEMPLATE_ID) },
    globalSanctions: { provider: 'complyadvantage', configured: !!c.env.COMPLYADVANTAGE_API_KEY },
    ofac,
  })
})
bankAdmin.post('/keys', requireRole('owner'), async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as {
    bankId?: string
    label?: string
  }
  if (
    typeof b.bankId !== 'string' ||
    !/^[a-z0-9_-]{3,64}$/.test(b.bankId) ||
    typeof b.label !== 'string' ||
    b.label.trim().length < 3 ||
    b.label.length > 100
  )
    return c.json({ error: 'invalid_bank_details' }, 400)
  const id = newId('bak'),
    token = `xpt_bank_${randomHex(32)}`,
    now = new Date().toISOString(),
    expires = new Date(Date.now() + 90 * 86400_000).toISOString()
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO bank_api_keys (id,bank_id,label,token_hash,expires_at,created_by,created_at) VALUES (?,?,?,?,?,?,?)',
    ).bind(
      id,
      b.bankId,
      b.label.trim(),
      await hashToken(token),
      expires,
      c.get('admin').id,
      now,
    ),
    c.env.DB.prepare(
      `INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at) VALUES (?,'admin',?,'bank.key_created','bank_key',?,?,?)`,
    ).bind(
      newId('aud'),
      c.get('admin').id,
      id,
      JSON.stringify({ bankId: b.bankId }),
      now,
    ),
  ])
  return c.json({ id, token, expiresAt: expires }, 201)
})
bankAdmin.post('/keys/:id/revoke', requireRole('owner'), async (c) => {
  await c.env.DB.prepare(
    'UPDATE bank_api_keys SET revoked_at=? WHERE id=? AND revoked_at IS NULL',
  )
    .bind(new Date().toISOString(), c.req.param('id'))
    .run()
  await audit(c.env.DB, {
    actorType: 'admin',
    actorId: c.get('admin').id,
    action: 'bank.key_revoked',
    entityType: 'bank_key',
    entityId: c.req.param('id'),
  })
  return c.json({ ok: true })
})

// Principal contributions are explicitly separate from fees and destination amounts.
type Item = {
  id: string
  reference: string
  user_id: string
  recipient_id: string
  first_name: string
  last_name: string
  recipient_name: string
  recipient_country: string
  send_amount_minor: number
  send_currency: string
  fee_minor: number
  receive_amount_minor: number
  receive_currency: string
}
const itemSelect = `SELECT t.id,t.reference,t.user_id,t.recipient_id,u.first_name,u.last_name,r.full_name AS recipient_name,r.country AS recipient_country,
 t.send_amount_minor,t.send_currency,t.fee_minor,t.receive_amount_minor,t.receive_currency FROM transfers t JOIN users u ON u.id=t.user_id JOIN recipients r ON r.id=t.recipient_id`
bankAdmin.get('/eligible', async (c) => {
  const { results } = await c.env.DB.prepare(
    `${itemSelect} WHERE t.status='compliance_hold' AND t.paid_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM wire_batch_items i WHERE i.transfer_id=t.id) ORDER BY t.created_at LIMIT 100`,
  ).all()
  return c.json({ transfers: results })
})
bankAdmin.post('/batches', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as {
    bankId?: string
    transferIds?: string[]
  }
  if (
    typeof b.bankId !== 'string' ||
    !/^[a-z0-9_-]{3,64}$/.test(b.bankId) ||
    !Array.isArray(b.transferIds) ||
    !b.transferIds.length ||
    b.transferIds.length > 100 ||
    b.transferIds.some((x) => typeof x !== 'string') ||
    new Set(b.transferIds).size !== b.transferIds.length
  )
    return c.json({ error: 'invalid_batch' }, 400)
  if (
    !(await c.env.DB.prepare(
      'SELECT id FROM bank_api_keys WHERE bank_id=? AND revoked_at IS NULL AND expires_at>?',
    )
      .bind(b.bankId, new Date().toISOString())
      .first())
  )
    return c.json({ error: 'bank_connection_required' }, 409)
  const placeholders = b.transferIds.map(() => '?').join(',')
  const { results } = await c.env.DB.prepare(
    `${itemSelect} WHERE t.id IN (${placeholders}) AND t.status='compliance_hold' AND t.paid_at IS NOT NULL AND EXISTS(SELECT 1 FROM transfer_postings p WHERE p.transfer_id=t.id AND p.kind='funding') AND NOT EXISTS(SELECT 1 FROM wire_batch_items i WHERE i.transfer_id=t.id) ORDER BY t.id`,
  )
    .bind(...b.transferIds)
    .all<Item>()
  const items = results ?? []
  if (
    items.length !== b.transferIds.length ||
    new Set(items.map((x) => x.send_currency)).size !== 1
  )
    return c.json({ error: 'ineligible_or_mixed_currency' }, 409)
  let total = 0
  for (const item of items) {
    total += item.send_amount_minor
    if (!Number.isSafeInteger(total))
      return c.json({ error: 'amount_overflow' }, 400)
    try {
      const result = await screenTransferSubjects(c.env, {
        userId: item.user_id,
        recipientId: item.recipient_id,
        transferId: item.id,
        cachedProviders: true,
      })
      if (result.blocked)
        return c.json({ error: 'sanctions_review_required' }, 403)
    } catch (error) {
      const f = screeningFailure(error)
      if (f) return c.json({ error: f.code }, f.status)
      throw error
    }
  }
  const id = newId('wire'),
    now = new Date().toISOString()
  const manifest = {
    version: 1,
    batchId: id,
    bankId: b.bankId,
    currency: items[0].send_currency,
    totalMinor: total,
    createdAt: now,
    items,
  }
  const hash = await hashToken(JSON.stringify(manifest))
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO wire_batches(id,bank_id,currency,total_minor,item_count,status,manifest_hash,created_by,created_at) VALUES (?,?,?,?,?,'building',?,?,?)`,
      ).bind(
        id,
        b.bankId,
        items[0].send_currency,
        total,
        items.length,
        hash,
        c.get('admin').id,
        now,
      ),
      ...items.map((item) =>
        c.env.DB.prepare(
          `INSERT INTO wire_batch_items(batch_id,transfer_id,amount_minor,currency,snapshot_json)
        SELECT ?,t.id,t.send_amount_minor,t.send_currency,? FROM transfers t JOIN users u ON u.id=t.user_id JOIN recipients r ON r.id=t.recipient_id
        WHERE t.id=? AND t.status='compliance_hold' AND t.paid_at IS NOT NULL AND t.send_amount_minor=? AND t.send_currency=?
        AND t.fee_minor=? AND t.receive_amount_minor=? AND t.receive_currency=? AND t.user_id=? AND t.recipient_id=?
        AND u.status='active' AND u.kyc_status='verified' AND u.first_name=? AND u.last_name=? AND r.full_name=? AND r.country=? AND r.archived_at IS NULL`,
        ).bind(
          id,
          JSON.stringify(item),
          item.id,
          item.send_amount_minor,
          item.send_currency,
          item.fee_minor,
          item.receive_amount_minor,
          item.receive_currency,
          item.user_id,
          item.recipient_id,
          item.first_name,
          item.last_name,
          item.recipient_name,
          item.recipient_country,
        ),
      ),
      c.env.DB.prepare(
        `UPDATE wire_batches SET status='submitted' WHERE id=?`,
      ).bind(id),
      c.env.DB.prepare(
        `INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at) VALUES (?,'admin',?,'bank.batch_submitted','wire_batch',?,?,?)`,
      ).bind(
        newId('aud'),
        c.get('admin').id,
        id,
        JSON.stringify({ hash, totalMinor: total, itemCount: items.length }),
        now,
      ),
    ])
  } catch {
    return c.json(
      {
        error: 'batch_changed',
        message:
          'The batch changed during reconciliation. Refresh and try again.',
      },
      409,
    )
  }
  return c.json({ id, manifestHash: hash, status: 'submitted' }, 201)
})

export function bankReleaseGuard(now: string, env?: Env) {
  return {
    sql: ` ${env && providersRequired(env) ? ' AND EXISTS(SELECT 1 FROM wire_batch_items i WHERE i.transfer_id=transfers.id)' : ''} AND NOT EXISTS (SELECT 1 FROM wire_batch_items i WHERE i.transfer_id=transfers.id AND NOT EXISTS (
    SELECT 1 FROM wire_batches b JOIN bank_decisions d ON d.batch_id=b.id JOIN bank_api_keys k ON k.id=d.key_id
    WHERE b.id=i.batch_id AND b.status='approved' AND d.decision='approved' AND d.manifest_hash=b.manifest_hash
      AND d.rowid=(SELECT MAX(latest.rowid) FROM bank_decisions latest WHERE latest.batch_id=b.id) AND d.expires_at>? AND k.revoked_at IS NULL AND k.expires_at>?
      AND json_extract(i.snapshot_json,'$.first_name')=(SELECT first_name FROM users WHERE id=transfers.user_id)
      AND json_extract(i.snapshot_json,'$.last_name')=(SELECT last_name FROM users WHERE id=transfers.user_id)
      AND json_extract(i.snapshot_json,'$.recipient_name')=(SELECT full_name FROM recipients WHERE id=transfers.recipient_id)
      AND json_extract(i.snapshot_json,'$.recipient_country')=(SELECT country FROM recipients WHERE id=transfers.recipient_id)
      AND i.amount_minor=transfers.send_amount_minor AND i.currency=transfers.send_currency
      AND json_extract(i.snapshot_json,'$.fee_minor')=transfers.fee_minor
      AND json_extract(i.snapshot_json,'$.receive_amount_minor')=transfers.receive_amount_minor
      AND json_extract(i.snapshot_json,'$.receive_currency')=transfers.receive_currency
  ))`,
    values: [now, now],
  }
}
type BankVars = { bank: { id: string; bank_id: string } }
export const bankApi = new Hono<{ Bindings: Env; Variables: BankVars }>()
bankApi.use('*', async (c, next) => {
  const token = c.req
    .header('authorization')
    ?.match(/^Bearer (xpt_bank_[a-f0-9]{64})$/)?.[1]
  if (!token) return c.json({ error: 'unauthorized' }, 401)
  const key = await c.env.DB.prepare(
    'SELECT id,bank_id FROM bank_api_keys WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?',
  )
    .bind(await hashToken(token), new Date().toISOString())
    .first<{ id: string; bank_id: string }>()
  if (!key) return c.json({ error: 'unauthorized' }, 401)
  if (
    await overLimit(
      c.env,
      'bank-api',
      key.id,
      { max: 120, windowSeconds: 60 },
      true,
    )
  )
    return c.json({ error: 'rate_limited' }, 429)
  c.set('bank', key)
  await audit(c.env.DB, {
    actorType: 'system',
    actorId: key.id,
    action: 'bank.api_access',
    metadata: { bankId: key.bank_id, path: c.req.path, method: c.req.method },
  })
  await next()
})
bankApi.get('/batches', async (c) => {
  const after = c.req.query('after') ?? ''
  const { results } = await c.env.DB.prepare(
    `SELECT id,bank_id,currency,total_minor,item_count,status,manifest_hash,created_at FROM wire_batches WHERE bank_id=? AND status<>'building' AND id>? ORDER BY id LIMIT 51`,
  )
    .bind(c.get('bank').bank_id, after)
    .all<{ id: string }>()
  const rows = results ?? []
  return c.json({
    batches: rows.slice(0, 50),
    nextCursor: rows.length > 50 ? rows[49].id : null,
  })
})
bankApi.get('/batches/:id', async (c) => {
  const b = await c.env.DB.prepare(
    `SELECT * FROM wire_batches WHERE id=? AND bank_id=? AND status<>'building'`,
  )
    .bind(c.req.param('id'), c.get('bank').bank_id)
    .first()
  if (!b) return c.json({ error: 'not_found' }, 404)
  const { results } = await c.env.DB.prepare(
    'SELECT snapshot_json FROM wire_batch_items WHERE batch_id=? ORDER BY transfer_id',
  )
    .bind(b.id)
    .all<{ snapshot_json: string }>()
  const { results: ledger } = await c.env.DB.prepare(
    `SELECT l.id,l.transfer_id,l.account_code,l.currency,l.amount_minor,l.entry_group,l.created_at FROM ledger_entries l JOIN wire_batch_items i ON i.transfer_id=l.transfer_id WHERE i.batch_id=? ORDER BY l.created_at,l.id`,
  )
    .bind(b.id)
    .all()
  const { results: screenings } = await c.env.DB.prepare(
    `SELECT s.id,s.transfer_id,s.subject_type,s.subject_name,s.provider,s.provider_ref,s.status,s.created_at FROM provider_screenings s JOIN wire_batch_items i ON i.transfer_id=s.transfer_id WHERE i.batch_id=? ORDER BY s.created_at DESC LIMIT 500`,
  )
    .bind(b.id)
    .all()
  const items = (results ?? []).map((r) => JSON.parse(r.snapshot_json))
  const manifest = {
    version: 1,
    batchId: b.id,
    bankId: b.bank_id,
    currency: b.currency,
    totalMinor: b.total_minor,
    createdAt: b.created_at,
    items,
  }
  return c.json({
    batch: b,
    manifest,
    manifestCanonical: JSON.stringify(manifest),
    ledger,
    screenings,
    testMode: true,
  })
})
bankApi.post('/batches/:id/decision', async (c) => {
  const bank = c.get('bank'),
    b = (await c.req.json().catch(() => ({}))) as {
      decision?: string
      manifestHash?: string
      reference?: string
      reason?: string
    }
  if (typeof b.reference === 'string') b.reference = b.reference.trim()
  if (typeof b.reason === 'string') b.reason = b.reason.trim()
  if (
    !['approved', 'rejected'].includes(b.decision ?? '') ||
    typeof b.manifestHash !== 'string' ||
    typeof b.reference !== 'string' ||
    b.reference.length < 3 ||
    b.reference.length > 200 ||
    typeof b.reason !== 'string' ||
    b.reason.length < 20 ||
    b.reason.length > 2000
  )
    return c.json({ error: 'invalid_decision' }, 400)
  const id = c.req.param('id'),
    now = new Date().toISOString(),
    decisionId = newId('bdc'),
    expires = new Date(Date.now() + 5 * 60_000).toISOString()
  const result = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO bank_decisions(id,batch_id,bank_id,key_id,decision,manifest_hash,reference,reason,created_at,expires_at)
      SELECT ?,id,?,?,?,?,?,?,?,? FROM wire_batches WHERE id=? AND bank_id=? AND status IN ('submitted','approved') AND manifest_hash=?
        AND EXISTS(SELECT 1 FROM bank_api_keys WHERE id=? AND revoked_at IS NULL AND expires_at>?)
      ON CONFLICT(bank_id,reference) DO NOTHING`,
    ).bind(
      decisionId,
      bank.bank_id,
      bank.id,
      b.decision,
      b.manifestHash,
      b.reference,
      b.reason,
      now,
      expires,
      id,
      bank.bank_id,
      b.manifestHash,
      bank.id,
      now,
    ),
    c.env.DB.prepare(
      `UPDATE wire_batches SET status=? WHERE id=? AND EXISTS(SELECT 1 FROM bank_decisions WHERE id=?)`,
    ).bind(b.decision, id, decisionId),
    c.env.DB.prepare(
      `INSERT INTO audit_log(id,actor_type,actor_id,action,entity_type,entity_id,metadata,created_at)
      SELECT ?,'system',?,'bank.decision','wire_batch',?,?,? WHERE EXISTS(SELECT 1 FROM bank_decisions WHERE id=?)`,
    ).bind(
      newId('aud'),
      bank.id,
      id,
      JSON.stringify({
        decision: b.decision,
        reference: b.reference,
        hash: b.manifestHash,
      }),
      now,
      decisionId,
    ),
  ])
  if (result[0].meta.changes !== 1)
    return c.json({ error: 'decision_conflict_or_not_found' }, 409)
  return c.json({
    ok: true,
    decision: b.decision,
    expiresAt: expires,
    testMode: true,
  })
})
