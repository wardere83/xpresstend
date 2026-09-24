/**
 * The payment rail interface.
 *
 * A rail is one provider's implementation of the money-movement lifecycle a
 * transfer needs. The transfer flow talks to this interface and never to a
 * provider directly, so adding a second provider is writing one file and
 * registering it — not editing the send journey.
 *
 * The lifecycle is deliberately the one real mobile-money providers expose
 * rather than a simplified "charge()": an authorisation that may not resolve
 * synchronously, an explicit capture, a release for the authorisation that is
 * never captured, and a refund after the fact. A provider that cannot do one
 * of these says so (`unsupported`) rather than having the shape faked for it.
 */

/** Minor units. Never a float; amounts are integers everywhere in this system. */
export type Minor = number

export interface RailCharge {
  /** Our transfer id. Becomes the provider's reference, so the two reconcile. */
  transferId: string
  /** Human reference printed on the receipt, e.g. XPT-1234-5678-9012. */
  reference: string
  amountMinor: Minor
  currency: string
  description: string
  /**
   * The payer's mobile-money account, as the customer typed it. Collected by
   * the client, carried through our API, and never stored: it is the payer's
   * wallet identifier, not ours.
   */
  payerAccountNo: string
  /**
   * One-time authorisation the payer's provider may require (a wallet PIN or
   * an OTP). Where the provider instead pushes a prompt to the handset this is
   * empty and the authorisation resolves asynchronously.
   */
  payerAccountPin?: string
}

/**
 * What a rail call resolved to.
 *
 * `pending` is a first-class outcome, not an error and not a success. Mobile
 * money routinely returns it: the payer has been sent a prompt and has not
 * answered yet. Collapsing it into either neighbour is how a remittance
 * product ends up telling someone their money is on its way when it is not.
 */
export type RailOutcome =
  | { kind: 'authorized'; providerTxnId: string; raw: RailRaw }
  | { kind: 'captured'; providerTxnId: string; raw: RailRaw }
  | { kind: 'pending'; providerTxnId: string | null; message: string; raw: RailRaw }
  | { kind: 'released'; providerTxnId: string; raw: RailRaw }
  | { kind: 'refunded'; providerTxnId: string; raw: RailRaw }
  | { kind: 'failed'; code: string; message: string; raw: RailRaw }
  /**
   * The provider has no public operation for this step. Distinct from `failed`:
   * nothing was attempted and nothing is wrong with the request. The caller
   * must not treat it as either a success or a decline.
   */
  | { kind: 'unsupported'; operation: string; detail: string }

/** Whatever the provider returned, kept verbatim for the audit trail. */
export type RailRaw = Record<string, unknown>

export interface PaymentRail {
  /** Stable identifier stored on the transfer as `payment_provider`. */
  readonly id: string
  /** False when the operator has not configured this rail's credentials. */
  readonly configured: boolean

  /** Places a hold on the payer's account. May resolve to `pending`. */
  authorize(charge: RailCharge): Promise<RailOutcome>
  /** Captures a hold previously placed by `authorize`. */
  capture(input: RailReference): Promise<RailOutcome>
  /** Releases a hold that will not be captured. */
  release(input: RailReference): Promise<RailOutcome>
  /** Returns captured funds to the payer. */
  refund(input: RailReference & { amountMinor: Minor }): Promise<RailOutcome>
  /** Re-reads the authoritative state of a transaction from the provider. */
  status(input: RailReference): Promise<RailOutcome>
}

export interface RailReference {
  transferId: string
  reference: string
  providerTxnId: string
  description: string
}
