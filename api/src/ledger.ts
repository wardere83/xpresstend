/**
 * Double-entry posting.
 *
 * Entries are signed minor units — debit positive, credit negative — and every
 * posting must sum to zero *within each currency*. A cross-currency transfer is
 * therefore two balanced groups joined by the fx_settlement account, which
 * carries the position between them.
 */

export interface Posting {
  accountCode: string
  currency: string
  amountMinor: number
  description: string
}

export class UnbalancedPostingError extends Error {}

/** Throws unless every currency in the posting nets to zero. */
export function assertBalanced(postings: Posting[]): void {
  const byCurrency = new Map<string, number>()
  for (const p of postings) {
    byCurrency.set(p.currency, (byCurrency.get(p.currency) ?? 0) + p.amountMinor)
  }
  for (const [currency, total] of byCurrency) {
    if (total !== 0) {
      throw new UnbalancedPostingError(`${currency} postings net to ${total}, expected 0`)
    }
  }
}

/**
 * The postings made when a customer's payment clears.
 *
 * USD side:  cash in (send + fee), fee recognised, the send amount parked in
 *            the FX settlement account.
 * Payout side: that position converted, and now owed to the recipient.
 */
export function fundingPostings(args: {
  sendAmountMinor: number
  feeMinor: number
  receiveAmountMinor: number
  sendCurrency: string
  receiveCurrency: string
  reference: string
}): Posting[] {
  const { sendAmountMinor, feeMinor, receiveAmountMinor, sendCurrency, receiveCurrency, reference } = args

  const postings: Posting[] = [
    {
      accountCode: 'customer_cash',
      currency: sendCurrency,
      amountMinor: sendAmountMinor + feeMinor,
      description: `Payment received for ${reference}`,
    },
    {
      accountCode: 'fee_revenue',
      currency: sendCurrency,
      amountMinor: -feeMinor,
      description: `Transfer fee for ${reference}`,
    },
    {
      accountCode: 'fx_settlement',
      currency: sendCurrency,
      amountMinor: -sendAmountMinor,
      description: `Funds to convert for ${reference}`,
    },
    {
      accountCode: 'fx_settlement',
      currency: receiveCurrency,
      amountMinor: receiveAmountMinor,
      description: `Converted funds for ${reference}`,
    },
    {
      accountCode: 'payout_payable',
      currency: receiveCurrency,
      amountMinor: -receiveAmountMinor,
      description: `Owed to recipient for ${reference}`,
    },
  ]

  // A zero-fee corridor would otherwise post a 0 row, which the CHECK rejects.
  const nonZero = postings.filter((p) => p.amountMinor !== 0)
  assertBalanced(nonZero)
  return nonZero
}

/** Postings made when the payout is confirmed delivered. */
export function payoutPostings(args: {
  receiveAmountMinor: number
  receiveCurrency: string
  reference: string
}): Posting[] {
  const { receiveAmountMinor, receiveCurrency, reference } = args
  const postings: Posting[] = [
    {
      accountCode: 'payout_payable',
      currency: receiveCurrency,
      amountMinor: receiveAmountMinor,
      description: `Payout delivered for ${reference}`,
    },
    {
      accountCode: 'settlement',
      currency: receiveCurrency,
      amountMinor: -receiveAmountMinor,
      description: `Settled to payout partner for ${reference}`,
    },
  ]
  assertBalanced(postings)
  return postings
}
