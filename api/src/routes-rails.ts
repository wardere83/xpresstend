import { Hono, type Context } from 'hono'
import { newId, verifyPassword } from './crypto'
import { audit } from './audit'
import { fundingPostings } from './ledger'
import { DuplicatePostingError, postOnce } from './ledger-db'
import type { Env, Vars } from './env'
import { requireUser } from './sessions'
import { defaultRail, type PaymentRail, type RailOutcome } from './rails'

/**
 * Funding a transfer through a payment rail.
 *
 * The provider lifecycle is exposed as it really is — authorize, then capture,
 * with a status route for the states in between — rather than as one "pay"
 * call that hides an asynchronous authorisation behind a spinner. Mobile money
 * routinely pushes a prompt to the payer's handset and answers PENDING; a
 * flow that cannot represent that state has to either lie or block.
 *
 * Everything requiring merchant credentials happens here. The client sends the
 * payer's own wallet number and one-time authorisation and nothing else: it
 * never holds, sees or transmits a merchant secret.
 */
export const rails = new Hono<{ Bindings: Env; Variables: Vars }>()

rails.use('/transfers/:id/rail/*', requireUser)

type TransferRow = Record<string, string | number | null>

async function loadTransfer(
  c: { env: Env },
  id: string,
  userId: string,
): Promise<TransferRow | null> {
  return await c.env.DB.prepare(`SELECT * FROM transfers WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<TransferRow>()
}

/**
 * Re-authenticates before money moves.
 *
 * A valid session is not sufficient to spend from an account: the account
 * password is required at the moment of payment, and it is checked here rather
 * than anywhere the client could skip.
 */
type Ctx = Context<{ Bindings: Env; Variables: Vars }>

async function authorized(c: Ctx, password: string): Promise<boolean> {
  const user = c.get('user')
  const creds = await c.env.DB.prepare(
    `SELECT password_hash, password_salt, password_iterations FROM users WHERE id = ?`,
  ).bind(user.id).first<Record<string, string | number>>()
  if (!creds) return false
  return await verifyPassword(
    password,
    String(creds.password_salt),
    Number(creds.password_iterations),
    String(creds.password_hash),
    c.env.SESSION_PEPPER ?? '',
  )
}

/** Shapes a rail outcome for the client, with no provider internals attached. */
function present(outcome: RailOutcome, rail: PaymentRail) {
  switch (outcome.kind) {
    case 'authorized':
    case 'captured':
    case 'released':
    case 'refunded':
      return { state: outcome.kind, provider: rail.id }
    case 'pending':
      return { state: 'pending' as const, provider: rail.id, message: outcome.message }
    case 'failed':
      return { state: 'failed' as const, provider: rail.id, message: outcome.message }
    case 'unsupported':
      return { state: 'unsupported' as const, provider: rail.id, message: outcome.detail }
  }
}

/**
 * Step one: place a hold on the payer's mobile-money account.
 *
 * The transfer stays in awaiting_payment throughout. An authorisation is not
 * money received, and a transfer is not advanced on the strength of one.
 */
rails.post('/transfers/:id/rail/authorize', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id') ?? ''
  const body = (await c.req.json().catch(() => ({}))) as {
    password?: string
    payerAccountNo?: string
    payerAccountPin?: string
  }

  if (!(await authorized(c, body.password ?? ''))) {
    await audit(c.env.DB, {
      actorType: 'customer', actorId: user.id, action: 'transfer.authorization_failed',
      entityType: 'transfer', entityId: id, ip: c.req.header('cf-connecting-ip'),
    })
    return c.json({ error: 'authorization_failed', message: 'That password was not accepted.' }, 401)
  }

  const payerAccountNo = (body.payerAccountNo ?? '').trim()
  if (!payerAccountNo) return c.json({ error: 'missing_account', message: 'Enter the mobile money number to pay from.' }, 400)

  const rail = defaultRail(c.env)
  if (!rail || !rail.configured) {
    return c.json({ error: 'rail_unavailable', message: 'No payment rail is configured on this environment.' }, 503)
  }

  const t = await loadTransfer(c, id, user.id)
  if (!t) return c.json({ error: 'not_found' }, 404)
  if (t.status !== 'awaiting_payment') return c.json({ error: 'wrong_status', status: t.status }, 409)
  if (t.quote_expires_at && String(t.quote_expires_at) < new Date().toISOString()) {
    return c.json({ error: 'quote_expired' }, 409)
  }
  // An authorisation already in flight must not be replaced by a second one:
  // that is two holds on the payer's wallet for one transfer.
  if (t.payment_intent_id) {
    return c.json({ error: 'already_authorized', message: 'This transfer already has a payment in progress.' }, 409)
  }

  const outcome = await rail.authorize({
    transferId: id,
    reference: String(t.reference),
    amountMinor: Number(t.send_amount_minor) + Number(t.fee_minor),
    currency: String(t.send_currency),
    description: `XpressTend transfer ${t.reference}`,
    payerAccountNo,
    payerAccountPin: body.payerAccountPin,
  })

  const now = new Date().toISOString()
  const providerTxnId =
    outcome.kind === 'authorized' || outcome.kind === 'captured'
      ? outcome.providerTxnId
      : outcome.kind === 'pending'
        ? outcome.providerTxnId
        : null

  if (providerTxnId) {
    await c.env.DB.prepare(
      `UPDATE transfers SET payment_provider = ?, payment_intent_id = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND payment_intent_id IS NULL`,
    ).bind(rail.id, providerTxnId, now, id, user.id).run()
  }

  await audit(c.env.DB, {
    actorType: 'customer', actorId: user.id, action: 'transfer.rail_authorize',
    entityType: 'transfer', entityId: id,
    // The payer's wallet number is not recorded: the audit trail needs the
    // provider's decision, not the customer's account.
    metadata: { provider: rail.id, outcome: outcome.kind },
    ip: c.req.header('cf-connecting-ip'),
  })

  if (outcome.kind === 'failed') return c.json(present(outcome, rail), 402)
  if (outcome.kind === 'unsupported') return c.json(present(outcome, rail), 503)
  return c.json(present(outcome, rail))
})

/**
 * Step two: capture the hold, and only then book the money.
 *
 * The ledger is written inside the same claim-then-post sequence the test-mode
 * path uses, so a capture that succeeds at the provider and fails here leaves
 * the transfer retryable rather than paid with no accounting behind it.
 */
rails.post('/transfers/:id/rail/capture', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id') ?? ''
  const body = (await c.req.json().catch(() => ({}))) as { password?: string }

  if (!(await authorized(c, body.password ?? ''))) {
    return c.json({ error: 'authorization_failed', message: 'That password was not accepted.' }, 401)
  }

  const rail = defaultRail(c.env)
  if (!rail || !rail.configured) {
    return c.json({ error: 'rail_unavailable', message: 'No payment rail is configured on this environment.' }, 503)
  }

  const t = await loadTransfer(c, id, user.id)
  if (!t) return c.json({ error: 'not_found' }, 404)
  if (t.status !== 'awaiting_payment') return c.json({ error: 'wrong_status', status: t.status }, 409)
  if (!t.payment_intent_id) {
    return c.json({ error: 'not_authorized_yet', message: 'This transfer has no payment to capture.' }, 409)
  }

  const outcome = await rail.capture({
    transferId: id,
    reference: String(t.reference),
    providerTxnId: String(t.payment_intent_id),
    description: `XpressTend transfer ${t.reference}`,
  })

  await audit(c.env.DB, {
    actorType: 'customer', actorId: user.id, action: 'transfer.rail_capture',
    entityType: 'transfer', entityId: id,
    metadata: { provider: rail.id, outcome: outcome.kind },
    ip: c.req.header('cf-connecting-ip'),
  })

  if (outcome.kind === 'pending') return c.json(present(outcome, rail))
  if (outcome.kind === 'failed') return c.json(present(outcome, rail), 402)
  if (outcome.kind === 'unsupported') return c.json(present(outcome, rail), 503)

  const now = new Date().toISOString()

  /*
   * Claim the transfer with a conditional update rather than trusting the read
   * above. Two simultaneous captures both pass that check; only one can change
   * a row still sitting in awaiting_payment, and only that one books the money.
   */
  const claim = await c.env.DB.prepare(
    `UPDATE transfers SET status = 'compliance_hold', paid_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND status = 'awaiting_payment'`,
  ).bind(now, now, id, user.id).run()

  if (claim.meta.changes !== 1) return c.json({ error: 'already_paid' }, 409)

  try {
    await postOnce(c.env.DB, id, 'funding', fundingPostings({
      sendAmountMinor: Number(t.send_amount_minor),
      feeMinor: Number(t.fee_minor),
      receiveAmountMinor: Number(t.receive_amount_minor),
      sendCurrency: String(t.send_currency),
      receiveCurrency: String(t.receive_currency),
      reference: String(t.reference),
    }))
  } catch (err) {
    if (!(err instanceof DuplicatePostingError)) {
      await c.env.DB.prepare(
        `UPDATE transfers SET status = 'awaiting_payment', paid_at = NULL, updated_at = ? WHERE id = ?`,
      ).bind(new Date().toISOString(), id).run()
      throw err
    }
  }

  await c.env.DB.prepare(
    `INSERT INTO transfer_events (id, transfer_id, from_status, to_status, actor_type, actor_id, note, created_at)
     VALUES (?, ?, 'awaiting_payment', 'compliance_hold', 'system', NULL, ?, ?)`,
  ).bind(newId('tev'), id, `Payment captured via ${rail.id}`, now).run()

  return c.json({ ...present(outcome, rail), status: 'compliance_hold' })
})

/**
 * Where the transfer actually stands.
 *
 * Answers from our own record first, because that is the state we can stand
 * behind. `providerState` reports what the rail could tell us, and says
 * plainly when the rail cannot tell us anything — which is the honest answer
 * today, and better than a confident one that was never asked for.
 */
rails.get('/transfers/:id/rail/status', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id') ?? ''
  const t = await loadTransfer(c, id, user.id)
  if (!t) return c.json({ error: 'not_found' }, 404)

  const rail = defaultRail(c.env)
  let providerState: ReturnType<typeof present> | null = null
  if (rail && rail.configured && t.payment_intent_id) {
    const outcome = await rail.status({
      transferId: id,
      reference: String(t.reference),
      providerTxnId: String(t.payment_intent_id),
      description: `XpressTend transfer ${t.reference}`,
    })
    providerState = present(outcome, rail)
  }

  return c.json({
    status: String(t.status),
    reference: String(t.reference),
    /** True while the payer still has to act, or we are waiting on the rail. */
    awaitingPayer: String(t.status) === 'awaiting_payment' && Boolean(t.payment_intent_id),
    provider: t.payment_provider ? String(t.payment_provider) : null,
    providerState,
  })
})

/**
 * Returns captured funds to the payer.
 *
 * Customer-initiated and deliberately narrow: it refunds this customer's own
 * transfer and only while it is still held for compliance, before a payout has
 * been released. Anything past that point is an operations decision with a
 * named person behind it, not a button.
 */
rails.post('/transfers/:id/rail/refund', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id') ?? ''
  const body = (await c.req.json().catch(() => ({}))) as { password?: string }

  if (!(await authorized(c, body.password ?? ''))) {
    return c.json({ error: 'authorization_failed', message: 'That password was not accepted.' }, 401)
  }

  const rail = defaultRail(c.env)
  if (!rail || !rail.configured) return c.json({ error: 'rail_unavailable' }, 503)

  const t = await loadTransfer(c, id, user.id)
  if (!t) return c.json({ error: 'not_found' }, 404)
  if (!t.payment_intent_id) return c.json({ error: 'nothing_to_refund' }, 409)
  if (t.status !== 'compliance_hold') {
    return c.json({ error: 'wrong_status', status: t.status, message: 'This transfer can no longer be refunded from here.' }, 409)
  }

  const outcome = await rail.refund({
    transferId: id,
    reference: String(t.reference),
    providerTxnId: String(t.payment_intent_id),
    description: `Refund of XpressTend transfer ${t.reference}`,
    amountMinor: Number(t.send_amount_minor) + Number(t.fee_minor),
  })

  await audit(c.env.DB, {
    actorType: 'customer', actorId: user.id, action: 'transfer.rail_refund',
    entityType: 'transfer', entityId: id,
    metadata: { provider: rail.id, outcome: outcome.kind },
    ip: c.req.header('cf-connecting-ip'),
  })

  if (outcome.kind === 'failed') return c.json(present(outcome, rail), 402)
  if (outcome.kind === 'unsupported') return c.json(present(outcome, rail), 503)

  /*
   * The refund is recorded as an event and left for operations to reverse in
   * the ledger. Writing a reversing entry from here would be a second money
   * movement decided by a customer action, and reversal postings are an
   * accounting operation with its own controls.
   */
  await c.env.DB.prepare(
    `INSERT INTO transfer_events (id, transfer_id, from_status, to_status, actor_type, actor_id, note, created_at)
     VALUES (?, ?, ?, ?, 'customer', ?, ?, ?)`,
  ).bind(
    newId('tev'), id, String(t.status), String(t.status), user.id,
    `Refund ${outcome.kind} via ${rail.id}; ledger reversal pending operations`,
    new Date().toISOString(),
  ).run()

  return c.json(present(outcome, rail))
})
