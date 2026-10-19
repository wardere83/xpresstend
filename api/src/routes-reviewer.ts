import { Hono } from 'hono'
import { audit } from './audit'
import type { Env, Vars } from './env'
import { requireAdmin, requireRole } from './sessions'

export const reviewer = new Hono<{ Bindings: Env; Variables: Vars }>()

reviewer.use('*', requireAdmin)

const REVIEWER = requireRole('reviewer')

function pageValue(raw: string | undefined, fallback: number, max: number) {
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

reviewer.get('/overview', REVIEWER, async (c) => {
  const [customers, transfers, holds, volume, ledger] = await Promise.all([
    c.env.DB.prepare(
      `SELECT COUNT(CASE WHEN test.user_id IS NULL THEN 1 END) AS total,
              COALESCE(SUM(CASE WHEN test.user_id IS NULL AND u.status = 'active' THEN 1 ELSE 0 END), 0) AS active,
              COALESCE(SUM(CASE WHEN test.user_id IS NULL AND u.kyc_status = 'verified' THEN 1 ELSE 0 END), 0) AS verified,
              COUNT(test.user_id) AS internalTestAccounts
         FROM users u LEFT JOIN user_account_classifications test
           ON test.user_id = u.id AND test.kind = 'internal_test'`,
    ).first<{ total: number; active: number; verified: number; internalTestAccounts: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM transfers`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM transfers WHERE status = 'compliance_hold'`)
      .first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT send_currency AS currency, SUM(send_amount_minor) AS sent_minor,
              SUM(fee_minor) AS fees_minor
         FROM transfers
        WHERE status IN ('paid', 'completed', 'sending', 'compliance_hold')
        GROUP BY send_currency ORDER BY send_currency`,
    ).all<{ currency: string; sent_minor: number; fees_minor: number }>(),
    c.env.DB.prepare(
      `SELECT currency, SUM(amount_minor) AS balance_minor
         FROM ledger_entries GROUP BY currency ORDER BY currency`,
    ).all<{ currency: string; balance_minor: number }>(),
  ])

  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.overview.viewed',
    entityType: 'reviewer_dashboard', ip: c.req.header('cf-connecting-ip'),
    userAgent: c.req.header('user-agent'),
  })
  return c.json({
    customers: customers ?? { total: 0, active: 0, verified: 0, internalTestAccounts: 0 },
    transfers: transfers?.total ?? 0,
    awaitingReview: holds?.total ?? 0,
    volume: volume.results ?? [],
    ledger: ledger.results ?? [],
  })
})

reviewer.get('/consumers', REVIEWER, async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, 100).toLowerCase()
  const status = (c.req.query('kyc') ?? '').trim()
  const allowedKyc = new Set(['unverified', 'pending', 'verified', 'rejected'])
  const kyc = allowedKyc.has(status) ? status : ''
  const limit = pageValue(c.req.query('limit'), 50, 100)
  const offset = (pageValue(c.req.query('page'), 1, 1_000_000) - 1) * limit
  const filter = `(? = '' OR lower(u.email) LIKE '%' || ? || '%'
                  OR lower(u.first_name || ' ' || u.last_name) LIKE '%' || ? || '%')
                  AND (? = '' OR u.kyc_status = ?)`
  const [count, { results }] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM users u WHERE ${filter}`)
      .bind(q, q, q, kyc, kyc).first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.country, u.status,
              u.kyc_status, u.kyc_tier, u.created_at, u.last_login_at,
              COUNT(t.id) AS transfer_count
         FROM users u LEFT JOIN transfers t ON t.user_id = u.id
        WHERE ${filter}
        GROUP BY u.id ORDER BY u.created_at DESC, u.id
        LIMIT ? OFFSET ?`,
    ).bind(q, q, q, kyc, kyc, limit, offset).all(),
  ])
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.consumers.viewed',
    entityType: 'consumer_directory',
    metadata: {
      kyc, page: offset / limit + 1, limit,
      recordIds: (results ?? []).map((row) => String(row.id)),
    },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({ consumers: results ?? [], page: offset / limit + 1, limit, total: count?.total ?? 0 })
})

reviewer.get('/transfers', REVIEWER, async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, 100).toLowerCase()
  const requestedStatus = (c.req.query('status') ?? '').trim()
  const statuses = new Set(['draft', 'awaiting_payment', 'paid', 'compliance_hold', 'sending', 'completed', 'failed', 'cancelled', 'refunded'])
  const status = statuses.has(requestedStatus) ? requestedStatus : ''
  const limit = pageValue(c.req.query('limit'), 50, 100)
  const offset = (pageValue(c.req.query('page'), 1, 1_000_000) - 1) * limit
  const filter = `(? = '' OR t.status = ?)
                  AND (? = '' OR lower(t.reference) LIKE '%' || ? || '%'
                    OR lower(u.email) LIKE '%' || ? || '%'
                    OR lower(u.first_name || ' ' || u.last_name) LIKE '%' || ? || '%')`
  const [count, { results }] = await Promise.all([
    c.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM transfers t JOIN users u ON u.id = t.user_id
        WHERE ${filter}`,
    ).bind(status, status, q, q, q, q).first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT t.id, t.reference, t.status, t.send_amount_minor, t.send_currency,
              t.fee_minor, t.receive_amount_minor, t.receive_currency, t.created_at,
              t.completed_at, u.id AS user_id, u.email AS user_email,
              u.first_name, u.last_name, u.country AS user_country,
              u.kyc_status, u.kyc_tier, r.full_name AS recipient_name,
              r.country AS recipient_country
         FROM transfers t JOIN users u ON u.id = t.user_id
         JOIN recipients r ON r.id = t.recipient_id
        WHERE ${filter}
        ORDER BY t.created_at DESC, t.id LIMIT ? OFFSET ?`,
    ).bind(status, status, q, q, q, q, limit, offset).all(),
  ])
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.transfers.viewed',
    entityType: 'transfer_directory',
    metadata: {
      status, page: offset / limit + 1, limit,
      recordIds: (results ?? []).map((row) => String(row.id)),
    },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({ transfers: results ?? [], page: offset / limit + 1, limit, total: count?.total ?? 0 })
})

reviewer.get('/transfers/:id', REVIEWER, async (c) => {
  const id = c.req.param('id') ?? ''
  const transfer = await c.env.DB.prepare(
    `SELECT t.id, t.reference, t.status, t.send_amount_minor, t.send_currency, t.fee_minor,
            t.receive_amount_minor, t.receive_currency, t.fx_rate_e8, t.created_at,
            t.paid_at, t.completed_at, t.updated_at, u.email AS user_email,
            u.first_name, u.last_name, u.country AS user_country, u.kyc_status, u.kyc_tier,
            r.full_name AS recipient_name, r.country AS recipient_country, r.payout_method
       FROM transfers t JOIN users u ON u.id = t.user_id
       JOIN recipients r ON r.id = t.recipient_id WHERE t.id = ?`,
  ).bind(id).first()
  if (!transfer) return c.json({ error: 'not_found' }, 404)

  const [events, postings] = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, from_status, to_status, actor_type, actor_id, note, created_at
         FROM transfer_events WHERE transfer_id = ? ORDER BY created_at, id`,
    ).bind(id).all(),
    c.env.DB.prepare(
      `SELECT id, entry_group, account_code, currency, amount_minor, description, created_at
         FROM ledger_entries WHERE transfer_id = ? ORDER BY created_at, entry_group, id`,
    ).bind(id).all(),
  ])
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.transfer.viewed',
    entityType: 'transfer', entityId: id,
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({ transfer, events: events.results ?? [], postings: postings.results ?? [] })
})

reviewer.get('/ledger/trial-balance', REVIEWER, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT currency, account_code, SUM(amount_minor) AS balance_minor, COUNT(*) AS entries
       FROM ledger_entries GROUP BY currency, account_code ORDER BY currency, account_code`,
  ).all<{ currency: string; balance_minor: number }>()
  const totals = new Map<string, number>()
  for (const row of results ?? []) {
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + Number(row.balance_minor))
  }
  const imbalances = [...totals.entries()].filter(([, total]) => total !== 0)
    .map(([currency, off]) => ({ currency, off }))
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.ledger.trial_balance.viewed',
    entityType: 'ledger', metadata: { balanced: imbalances.length === 0 },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({ accounts: results ?? [], balanced: imbalances.length === 0, imbalances })
})

reviewer.get('/ledger/reconciliation', REVIEWER, async (c) => {
  const [groups, missing, completedMissingPayout] = await Promise.all([
    c.env.DB.prepare(
      `SELECT entry_group, currency, SUM(amount_minor) AS net_minor, COUNT(*) AS entries
         FROM ledger_entries GROUP BY entry_group, currency
        HAVING SUM(amount_minor) <> 0 ORDER BY entry_group, currency LIMIT 100`,
    ).all(),
    c.env.DB.prepare(
      `SELECT t.id, t.reference, t.status, t.created_at
         FROM transfers t LEFT JOIN ledger_entries e ON e.transfer_id = t.id
        WHERE t.paid_at IS NOT NULL AND e.id IS NULL
        ORDER BY t.created_at DESC LIMIT 100`,
    ).all(),
    c.env.DB.prepare(
      `SELECT t.id, t.reference, t.created_at
         FROM transfers t
        WHERE t.status = 'completed'
          AND NOT EXISTS (
            SELECT 1 FROM ledger_entries e
             WHERE e.transfer_id = t.id AND e.account_code = 'settlement'
          )
        ORDER BY t.completed_at DESC LIMIT 100`,
    ).all(),
  ])
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.ledger.reconciliation.viewed',
    entityType: 'ledger',
    metadata: {
      unbalancedGroups: groups.results?.length ?? 0,
      transfersWithoutEntries: missing.results?.length ?? 0,
      completedWithoutPayout: completedMissingPayout.results?.length ?? 0,
      exceptionTransferIds: [
        ...(missing.results ?? []).map((row) => String(row.id)),
        ...(completedMissingPayout.results ?? []).map((row) => String(row.id)),
      ],
    },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({
    unbalancedGroups: groups.results ?? [],
    transfersWithoutEntries: missing.results ?? [],
    completedWithoutPayout: completedMissingPayout.results ?? [],
  })
})

reviewer.get('/ledger/entries', REVIEWER, async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, 100).toLowerCase()
  const currency = (c.req.query('currency') ?? '').trim().slice(0, 3).toUpperCase()
  const limit = pageValue(c.req.query('limit'), 50, 100)
  const offset = (pageValue(c.req.query('page'), 1, 1_000_000) - 1) * limit
  const filter = `(? = '' OR e.currency = ?) AND
                  (? = '' OR lower(e.entry_group) LIKE '%' || ? || '%'
                    OR lower(COALESCE(t.reference, '')) LIKE '%' || ? || '%'
                    OR lower(e.account_code) LIKE '%' || ? || '%')`
  const [count, { results }] = await Promise.all([
    c.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM ledger_entries e LEFT JOIN transfers t ON t.id = e.transfer_id
        WHERE ${filter}`,
    ).bind(currency, currency, q, q, q, q).first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT e.id, e.transfer_id, e.entry_group, e.account_code, e.currency,
              e.amount_minor, e.description, e.created_at, t.reference,
              u.email AS user_email, u.first_name, u.last_name
         FROM ledger_entries e LEFT JOIN transfers t ON t.id = e.transfer_id
         LEFT JOIN users u ON u.id = t.user_id
        WHERE ${filter}
        ORDER BY e.created_at DESC, e.id LIMIT ? OFFSET ?`,
    ).bind(currency, currency, q, q, q, q, limit, offset).all(),
  ])
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.ledger.entries.viewed',
    entityType: 'ledger',
    metadata: {
      currency, page: offset / limit + 1, limit,
      entryIds: (results ?? []).map((row) => String(row.id)),
    },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({ entries: results ?? [], page: offset / limit + 1, limit, total: count?.total ?? 0 })
})

reviewer.get('/audit', REVIEWER, async (c) => {
  const action = (c.req.query('action') ?? '').trim().slice(0, 80)
  const limit = pageValue(c.req.query('limit'), 50, 100)
  const offset = (pageValue(c.req.query('page'), 1, 1_000_000) - 1) * limit
  const [count, { results }] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM audit_log WHERE (? = '' OR action = ?)`)
      .bind(action, action).first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT id, actor_type, actor_id, action, entity_type, entity_id, metadata, ip, created_at
         FROM audit_log WHERE (? = '' OR action = ?)
        ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    ).bind(action, action, limit, offset).all(),
  ])
  await audit(c.env.DB, {
    actorType: 'admin', actorId: c.get('admin').id, action: 'reviewer.audit.viewed',
    entityType: 'audit_log',
    metadata: {
      action, page: offset / limit + 1, limit,
      recordIds: (results ?? []).map((row) => String(row.id)),
    },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })
  return c.json({ entries: results ?? [], page: offset / limit + 1, limit, total: count?.total ?? 0 })
})
