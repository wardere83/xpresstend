import { Hono } from 'hono'
import { newId } from './crypto'
import { audit } from './audit'
import { payoutPostings } from './ledger'
import { DuplicatePostingError, postOnce } from './ledger-db'
import type { Env, Vars } from './env'
import { requireAdmin, requireRole } from './sessions'
import { staff } from './routes-staff'

export const admin = new Hono<{ Bindings: Env; Variables: Vars }>()

admin.use('*', requireAdmin)

// Staff administration. Mounted inside the admin guard, so every route here
// already has a signed-in staff member.
admin.route('/staff', staff)

/** Operations dashboard: volumes, holds and today's activity. */
admin.get('/overview', async (c) => {
  const [counts, volume, holds] = await c.env.DB.batch<Record<string, number>>([
    c.env.DB.prepare(
      `SELECT status, COUNT(*) AS n FROM transfers GROUP BY status`,
    ),
    c.env.DB.prepare(
      `SELECT send_currency AS currency, SUM(send_amount_minor) AS sent, SUM(fee_minor) AS fees
         FROM transfers WHERE status IN ('completed','sending','compliance_hold') GROUP BY send_currency`,
    ),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM transfers WHERE status = 'compliance_hold'`,
    ),
  ])
  return c.json({
    byStatus: counts.results,
    volume: volume.results,
    awaitingReview: holds.results?.[0]?.n ?? 0,
  })
})

/** The compliance queue. Defaults to what needs a human decision. */
admin.get('/transfers', async (c) => {
  const status = c.req.query('status') ?? 'compliance_hold'
  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.reference, t.status, t.send_amount_minor, t.send_currency, t.fee_minor,
            t.receive_amount_minor, t.receive_currency, t.created_at, t.paid_at,
            u.email AS user_email, u.first_name, u.last_name, u.kyc_status,
            r.full_name AS recipient_name, r.country AS recipient_country
       FROM transfers t
       JOIN users u ON u.id = t.user_id
       JOIN recipients r ON r.id = t.recipient_id
      WHERE (? = 'all' OR t.status = ?)
      ORDER BY t.created_at DESC LIMIT 200`,
  ).bind(status, status).all()
  return c.json({ transfers: results })
})

/**
 * Releases a transfer for payout. Compliance or owner only — this is the point
 * at which money actually leaves, so it is deliberately the narrowest role gate
 * in the system and is always attributed to a named person in the audit log.
 */
admin.post('/transfers/:id/approve', requireRole('compliance', 'owner'), async (c) => {
  const staff = c.get('admin')
  const id = c.req.param('id') ?? ''
  const t = await c.env.DB.prepare(`SELECT * FROM transfers WHERE id = ?`)
    .bind(id).first<Record<string, string | number>>()
  if (!t) return c.json({ error: 'not_found' }, 404)
  if (t.status !== 'compliance_hold') return c.json({ error: 'wrong_status', status: t.status }, 409)

  const now = new Date().toISOString()

  // Same conditional claim as payment capture: two reviewers pressing Release
  // at once must not both release the payout.
  const claim = await c.env.DB.prepare(
    `UPDATE transfers SET status = 'completed', completed_at = ?, updated_at = ?
      WHERE id = ? AND status = 'compliance_hold'`,
  ).bind(now, now, id).run()

  if (claim.meta.changes !== 1) {
    return c.json({ error: 'already_decided' }, 409)
  }

  try {
    await postOnce(c.env.DB, id, 'payout', payoutPostings({
      receiveAmountMinor: Number(t.receive_amount_minor),
      receiveCurrency: String(t.receive_currency),
      reference: String(t.reference),
    }))
  } catch (err) {
    if (!(err instanceof DuplicatePostingError)) {
      await c.env.DB.prepare(
        `UPDATE transfers SET status = 'compliance_hold', completed_at = NULL, updated_at = ? WHERE id = ?`,
      ).bind(new Date().toISOString(), id).run()
      throw err
    }
  }

  await c.env.DB.prepare(
    `INSERT INTO transfer_events (id, transfer_id, from_status, to_status, actor_type, actor_id, note, created_at)
     VALUES (?, ?, 'compliance_hold', 'completed', 'admin', ?, ?, ?)`,
  ).bind(newId('tev'), id, staff.id, c.req.query('note') ?? 'Released by compliance', now).run()

  await audit(c.env.DB, {
    actorType: 'admin', actorId: staff.id, action: 'transfer.approved',
    entityType: 'transfer', entityId: id, metadata: { reference: t.reference, role: staff.role },
    ip: c.req.header('cf-connecting-ip'),
  })
  return c.json({ ok: true, status: 'completed' })
})

admin.post('/transfers/:id/reject', requireRole('compliance', 'owner'), async (c) => {
  const staff = c.get('admin')
  const id = c.req.param('id') ?? ''
  const body = ((await c.req.json().catch(() => ({}))) as { reason?: string })
  const reason = body.reason?.trim()
  if (!reason) return c.json({ error: 'reason_required' }, 400)

  const t = await c.env.DB.prepare(`SELECT status FROM transfers WHERE id = ?`).bind(id).first<{ status: string }>()
  if (!t) return c.json({ error: 'not_found' }, 404)
  if (t.status !== 'compliance_hold') return c.json({ error: 'wrong_status', status: t.status }, 409)

  const now = new Date().toISOString()
  const claim = await c.env.DB.prepare(
    `UPDATE transfers SET status = 'failed', failure_reason = ?, updated_at = ?
      WHERE id = ? AND status = 'compliance_hold'`,
  ).bind(reason, now, id).run()
  if (claim.meta.changes !== 1) return c.json({ error: 'already_decided' }, 409)

  await c.env.DB.prepare(
    `INSERT INTO transfer_events (id, transfer_id, from_status, to_status, actor_type, actor_id, note, created_at)
     VALUES (?, ?, 'compliance_hold', 'failed', 'admin', ?, ?, ?)`,
  ).bind(newId('tev'), id, staff.id, reason, now).run()

  await audit(c.env.DB, {
    actorType: 'admin', actorId: staff.id, action: 'transfer.rejected',
    entityType: 'transfer', entityId: id, metadata: { reason }, ip: c.req.header('cf-connecting-ip'),
  })
  return c.json({ ok: true, status: 'failed' })
})

admin.get('/users', async (c) => {
  const q = `%${(c.req.query('q') ?? '').toLowerCase()}%`
  const { results } = await c.env.DB.prepare(
    `SELECT id, email, first_name, last_name, country, status, kyc_status, kyc_tier,
            last_login_at, created_at
       FROM users
      WHERE lower(email) LIKE ? OR lower(first_name || ' ' || last_name) LIKE ?
      ORDER BY created_at DESC LIMIT 200`,
  ).bind(q, q).all()
  return c.json({ users: results })
})

/** Raises or refuses a customer's verification tier. */
admin.post('/users/:id/kyc', requireRole('compliance', 'owner'), async (c) => {
  const staff = c.get('admin')
  const id = c.req.param('id') ?? ''
  const b = ((await c.req.json().catch(() => ({}))) as { decision?: string; tier?: number; note?: string })
  if (b.decision !== 'verified' && b.decision !== 'rejected') {
    return c.json({ error: 'decision_must_be_verified_or_rejected' }, 400)
  }
  const tier = b.decision === 'verified' ? Math.min(Math.max(b.tier ?? 1, 1), 3) : 0
  const now = new Date().toISOString()

  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE users SET kyc_status = ?, kyc_tier = ?, updated_at = ? WHERE id = ?`)
      .bind(b.decision, tier, now, id),
    c.env.DB.prepare(
      `INSERT INTO kyc_checks (id, user_id, provider, status, result_json, reviewed_by, reviewed_at, created_at)
       VALUES (?, ?, 'manual', ?, ?, ?, ?, ?)`,
    ).bind(newId('kyc'), id, b.decision === 'verified' ? 'passed' : 'failed',
           JSON.stringify({ note: b.note ?? null, tier }), staff.id, now, now),
  ])

  await audit(c.env.DB, {
    actorType: 'admin', actorId: staff.id, action: 'user.kyc_decision',
    entityType: 'user', entityId: id, metadata: { decision: b.decision, tier },
    ip: c.req.header('cf-connecting-ip'),
  })
  return c.json({ ok: true, kycStatus: b.decision, kycTier: tier })
})

/**
 * Trial balance. Every currency must net to zero; a non-zero row means the
 * books are broken and is the first thing to check after any incident.
 */
admin.get('/ledger/trial-balance', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT currency, account_code, SUM(amount_minor) AS balance_minor, COUNT(*) AS entries
       FROM ledger_entries GROUP BY currency, account_code ORDER BY currency, account_code`,
  ).all<{ currency: string; balance_minor: number }>()

  const totals = new Map<string, number>()
  for (const r of results ?? []) {
    totals.set(r.currency, (totals.get(r.currency) ?? 0) + Number(r.balance_minor))
  }
  const imbalances = [...totals.entries()].filter(([, v]) => v !== 0).map(([currency, off]) => ({ currency, off }))

  return c.json({ accounts: results, balanced: imbalances.length === 0, imbalances })
})

admin.get('/audit', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, actor_type, actor_id, action, entity_type, entity_id, metadata, ip, created_at
       FROM audit_log ORDER BY created_at DESC LIMIT 250`,
  ).all()
  return c.json({ entries: results })
})
