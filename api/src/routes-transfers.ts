import { Hono } from 'hono'
import { newId, randomHex } from './crypto'
import { audit } from './audit'
import { fundingPostings } from './ledger'
import { post } from './ledger-db'
import { QuoteError, quote, type Corridor } from './money'
import type { Env, Vars } from './env'
import { requireUser } from './sessions'

/**
 * Per-transfer ceilings by verification tier, in minor units.
 * Tier 0 has not passed KYC and cannot send at all.
 */
const TIER_LIMITS: Record<number, number> = { 0: 0, 1: 100_000, 2: 500_000, 3: 2_000_000 }

/** How long a quoted rate is honoured before it must be re-quoted. */
const QUOTE_TTL_MINUTES = 15

function reference(): string {
  const block = () => String(Math.floor(Number(`0x${randomHex(2)}`) / 65536 * 9000) + 1000)
  return `XPT-${block()}-${block()}-${new Date().getUTCFullYear()}`
}

export const transfers = new Hono<{ Bindings: Env; Variables: Vars }>()

transfers.get('/corridors', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, send_country, receive_country, send_currency, receive_currency,
            fee_flat_minor, fee_percent_bps, min_send_minor, max_send_minor, fx_margin_bps
       FROM corridors WHERE enabled = 1 ORDER BY receive_country`,
  ).all()
  return c.json({ corridors: results })
})

/** Prices a transfer without creating one. Safe to call on every keystroke. */
transfers.post('/quote', async (c) => {
  const body = ((await c.req.json().catch(() => ({}))) as { corridorId?: string; sendAmountMinor?: number })
  if (!body.corridorId || typeof body.sendAmountMinor !== 'number') {
    return c.json({ error: 'corridor_and_amount_required' }, 400)
  }

  const corridor = await c.env.DB.prepare(`SELECT * FROM corridors WHERE id = ?`)
    .bind(body.corridorId).first<Corridor>()
  if (!corridor) return c.json({ error: 'unknown_corridor' }, 404)

  const rate = await c.env.DB.prepare(
    `SELECT rate_e8 FROM fx_rates WHERE base = ? AND quote = ? ORDER BY fetched_at DESC LIMIT 1`,
  ).bind(corridor.send_currency, corridor.receive_currency).first<{ rate_e8: number }>()
  if (!rate) return c.json({ error: 'no_rate_available' }, 503)

  try {
    const q = quote(corridor, rate.rate_e8, body.sendAmountMinor)
    return c.json({
      quote: { ...q, corridorId: corridor.id, expiresAt: new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString() },
    })
  } catch (err) {
    if (err instanceof QuoteError) return c.json({ error: err.code, message: err.message }, 400)
    throw err
  }
})

transfers.use('/recipients/*', requireUser)
transfers.use('/transfers/*', requireUser)
transfers.use('/transfers', requireUser)
transfers.use('/recipients', requireUser)

transfers.get('/recipients', async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(
    `SELECT id, full_name, country, payout_method, phone, bank_name, relationship, created_at
       FROM recipients WHERE user_id = ? AND archived_at IS NULL ORDER BY created_at DESC`,
  ).bind(user.id).all()
  return c.json({ recipients: results })
})

transfers.post('/recipients', async (c) => {
  const user = c.get('user')
  const b = ((await c.req.json().catch(() => ({}))) as Record<string, string>)
  if (!b.fullName?.trim() || !b.country || !b.payoutMethod) {
    return c.json({ error: 'missing_fields' }, 400)
  }
  const id = newId('rcp')
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `INSERT INTO recipients (id, user_id, full_name, country, payout_method, phone, account_ref,
                             bank_name, relationship, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, user.id, b.fullName.trim(), b.country, b.payoutMethod, b.phone ?? null,
         b.accountRef ?? null, b.bankName ?? null, b.relationship ?? null, now, now).run()

  await audit(c.env.DB, {
    actorType: 'customer', actorId: user.id, action: 'recipient.created',
    entityType: 'recipient', entityId: id, ip: c.req.header('cf-connecting-ip'),
  })
  return c.json({ ok: true, id })
})

transfers.get('/transfers', async (c) => {
  const user = c.get('user')
  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.reference, t.send_amount_minor, t.send_currency, t.fee_minor,
            t.receive_amount_minor, t.receive_currency, t.status, t.created_at, t.completed_at,
            r.full_name AS recipient_name, r.country AS recipient_country
       FROM transfers t JOIN recipients r ON r.id = t.recipient_id
      WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 100`,
  ).bind(user.id).all()
  return c.json({ transfers: results })
})

/**
 * Creates a transfer from a fresh server-side quote.
 *
 * The client's numbers are never trusted: the amount is re-priced here, so a
 * tampered payload cannot buy a better rate than the corridor allows.
 */
transfers.post('/transfers', async (c) => {
  const user = c.get('user')
  const b = ((await c.req.json().catch(() => ({}))) as { corridorId?: string; recipientId?: string; sendAmountMinor?: number })

  if (!b.corridorId || !b.recipientId || typeof b.sendAmountMinor !== 'number') {
    return c.json({ error: 'missing_fields' }, 400)
  }

  const limit = TIER_LIMITS[user.kycTier] ?? 0
  if (limit === 0) {
    return c.json({ error: 'kyc_required', message: 'Verify your identity before sending.' }, 403)
  }
  if (b.sendAmountMinor > limit) {
    return c.json({ error: 'over_tier_limit', limitMinor: limit }, 403)
  }

  const recipient = await c.env.DB.prepare(
    `SELECT id FROM recipients WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
  ).bind(b.recipientId, user.id).first()
  if (!recipient) return c.json({ error: 'unknown_recipient' }, 404)

  const corridor = await c.env.DB.prepare(`SELECT * FROM corridors WHERE id = ?`)
    .bind(b.corridorId).first<Corridor>()
  if (!corridor) return c.json({ error: 'unknown_corridor' }, 404)

  const rate = await c.env.DB.prepare(
    `SELECT rate_e8 FROM fx_rates WHERE base = ? AND quote = ? ORDER BY fetched_at DESC LIMIT 1`,
  ).bind(corridor.send_currency, corridor.receive_currency).first<{ rate_e8: number }>()
  if (!rate) return c.json({ error: 'no_rate_available' }, 503)

  let q
  try {
    q = quote(corridor, rate.rate_e8, b.sendAmountMinor)
  } catch (err) {
    if (err instanceof QuoteError) return c.json({ error: err.code, message: err.message }, 400)
    throw err
  }

  const id = newId('trf')
  const ref = reference()
  const now = new Date().toISOString()

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO transfers (id, reference, user_id, recipient_id, corridor_id,
         send_amount_minor, send_currency, fee_minor, receive_amount_minor, receive_currency,
         fx_rate_e8, status, quote_expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', ?, ?, ?)`,
    ).bind(id, ref, user.id, b.recipientId, corridor.id, q.sendAmountMinor, q.sendCurrency,
           q.feeMinor, q.receiveAmountMinor, q.receiveCurrency, q.effectiveRateE8,
           new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString(), now, now),
    c.env.DB.prepare(
      `INSERT INTO transfer_events (id, transfer_id, from_status, to_status, actor_type, actor_id, created_at)
       VALUES (?, ?, NULL, 'awaiting_payment', 'customer', ?, ?)`,
    ).bind(newId('tev'), id, user.id, now),
  ])

  await audit(c.env.DB, {
    actorType: 'customer', actorId: user.id, action: 'transfer.created',
    entityType: 'transfer', entityId: id,
    metadata: { reference: ref, sendAmountMinor: q.sendAmountMinor, corridor: corridor.id },
    ip: c.req.header('cf-connecting-ip'),
  })

  return c.json({ ok: true, transfer: { id, reference: ref, ...q, status: 'awaiting_payment' } })
})

transfers.get('/transfers/:id', async (c) => {
  const user = c.get('user')
  const t = await c.env.DB.prepare(
    `SELECT t.*, r.full_name AS recipient_name, r.country AS recipient_country
       FROM transfers t JOIN recipients r ON r.id = t.recipient_id
      WHERE t.id = ? AND t.user_id = ?`,
  ).bind(c.req.param('id'), user.id).first()
  if (!t) return c.json({ error: 'not_found' }, 404)

  const { results: events } = await c.env.DB.prepare(
    `SELECT to_status, actor_type, note, created_at FROM transfer_events
      WHERE transfer_id = ? ORDER BY created_at`,
  ).bind(c.req.param('id')).all()

  return c.json({ transfer: t, events })
})

/**
 * Marks a transfer paid and posts the funding entries.
 *
 * Until the money transmitter licence and a payment partner are in place this
 * confirms a *test* payment: it moves the transfer into compliance review and
 * writes the ledger, but no real card is charged and no payout is released.
 * Swapping in Stripe means replacing this one handler.
 */
transfers.post('/transfers/:id/pay', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id') ?? ''

  const t = await c.env.DB.prepare(`SELECT * FROM transfers WHERE id = ? AND user_id = ?`)
    .bind(id, user.id).first<Record<string, string | number>>()
  if (!t) return c.json({ error: 'not_found' }, 404)
  if (t.status !== 'awaiting_payment') return c.json({ error: 'wrong_status', status: t.status }, 409)
  if (t.quote_expires_at && String(t.quote_expires_at) < new Date().toISOString()) {
    return c.json({ error: 'quote_expired' }, 409)
  }

  const now = new Date().toISOString()
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE transfers SET status = 'compliance_hold', paid_at = ?, updated_at = ?,
              payment_provider = 'test', payment_intent_id = ? WHERE id = ?`,
    ).bind(now, now, `test_${randomHex(8)}`, id),
    c.env.DB.prepare(
      `INSERT INTO transfer_events (id, transfer_id, from_status, to_status, actor_type, actor_id, note, created_at)
       VALUES (?, ?, 'awaiting_payment', 'compliance_hold', 'system', NULL, 'Test payment captured', ?)`,
    ).bind(newId('tev'), id, now),
  ])

  await post(c.env.DB, id, fundingPostings({
    sendAmountMinor: Number(t.send_amount_minor),
    feeMinor: Number(t.fee_minor),
    receiveAmountMinor: Number(t.receive_amount_minor),
    sendCurrency: String(t.send_currency),
    receiveCurrency: String(t.receive_currency),
    reference: String(t.reference),
  }))

  await audit(c.env.DB, {
    actorType: 'customer', actorId: user.id, action: 'transfer.paid',
    entityType: 'transfer', entityId: id, metadata: { provider: 'test' },
    ip: c.req.header('cf-connecting-ip'),
  })

  return c.json({ ok: true, status: 'compliance_hold', testMode: true })
})
