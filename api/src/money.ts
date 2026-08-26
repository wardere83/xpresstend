/**
 * Money arithmetic.
 *
 * Everything is integer minor units and BigInt. No float ever touches an
 * amount: 0.1 + 0.2 problems in a remittance ledger are money that vanishes.
 */

export const RATE_SCALE = 100_000_000n // 1e8, matching fx_rates.rate_e8

export interface Corridor {
  id: string
  send_country: string
  receive_country: string
  send_currency: string
  receive_currency: string
  fee_flat_minor: number
  fee_percent_bps: number
  min_send_minor: number
  max_send_minor: number
  fx_margin_bps: number
  enabled: number
}

export interface Quote {
  sendAmountMinor: number
  feeMinor: number
  totalChargedMinor: number
  receiveAmountMinor: number
  sendCurrency: string
  receiveCurrency: string
  /** The customer-facing rate, after margin — this is what gets locked in. */
  effectiveRateE8: number
  midRateE8: number
  marginBps: number
}

export class QuoteError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

/**
 * Builds a quote. The margin is taken off the mid-market rate rather than
 * added to the fee, which is how the customer-visible rate ends up worse than
 * mid — the same way every remittance business prices.
 */
export function quote(corridor: Corridor, midRateE8: number, sendAmountMinor: number): Quote {
  if (!Number.isInteger(sendAmountMinor)) {
    throw new QuoteError('Amount must be in whole minor units', 'amount_not_integer')
  }
  if (sendAmountMinor < corridor.min_send_minor) {
    throw new QuoteError('Amount is below the corridor minimum', 'below_minimum')
  }
  if (sendAmountMinor > corridor.max_send_minor) {
    throw new QuoteError('Amount is above the corridor maximum', 'above_maximum')
  }
  if (!corridor.enabled) {
    throw new QuoteError('This corridor is not currently available', 'corridor_disabled')
  }

  const send = BigInt(sendAmountMinor)

  // Percentage component rounds up, so rounding never costs the business money.
  const pct = (send * BigInt(corridor.fee_percent_bps) + 9_999n) / 10_000n
  const feeMinor = BigInt(corridor.fee_flat_minor) + pct

  const mid = BigInt(midRateE8)
  const effective = (mid * BigInt(10_000 - corridor.fx_margin_bps)) / 10_000n

  // Recipient amount rounds down: never promise more than the margin funds.
  const receive = (send * effective) / RATE_SCALE
  if (receive <= 0n) {
    throw new QuoteError('Amount is too small to convert', 'below_minimum')
  }

  return {
    sendAmountMinor,
    feeMinor: Number(feeMinor),
    totalChargedMinor: Number(send + feeMinor),
    receiveAmountMinor: Number(receive),
    sendCurrency: corridor.send_currency,
    receiveCurrency: corridor.receive_currency,
    effectiveRateE8: Number(effective),
    midRateE8,
    marginBps: corridor.fx_margin_bps,
  }
}

/** Human-facing formatting; presentation only, never used for arithmetic. */
export function formatMinor(minor: number, currency: string): string {
  const sign = minor < 0 ? '-' : ''
  const abs = Math.abs(minor)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')} ${currency}`
}
