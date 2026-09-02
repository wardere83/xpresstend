import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertBalanced, fundingPostings, payoutPostings, UnbalancedPostingError } from '../src/ledger.ts'

/**
 * These cover the shapes that a double-post would produce, so a regression in
 * the posting rules is caught here rather than in the trial balance later.
 */

test('funding for a same-currency corridor still balances', () => {
  const p = fundingPostings({
    sendAmountMinor: 20_000, feeMinor: 198, receiveAmountMinor: 20_000,
    sendCurrency: 'USD', receiveCurrency: 'USD', reference: 'XPT-SAME',
  })
  assertBalanced(p)
  assert.equal(p.reduce((s, x) => s + x.amountMinor, 0), 0)
})

test('a posting that omits the fee does not balance', () => {
  assert.throws(
    () =>
      assertBalanced([
        { accountCode: 'customer_cash', currency: 'USD', amountMinor: 20_198, description: '' },
        { accountCode: 'fx_settlement', currency: 'USD', amountMinor: -20_000, description: '' },
      ]),
    UnbalancedPostingError,
  )
})

test('applying funding twice would double every account', () => {
  const args = {
    sendAmountMinor: 50_000, feeMinor: 495, receiveAmountMinor: 6_475_000,
    sendCurrency: 'USD', receiveCurrency: 'KES', reference: 'XPT-DUP',
  }
  const once = fundingPostings(args)
  const twice = [...fundingPostings(args), ...fundingPostings(args)]

  // Both balance, which is exactly why balance alone cannot detect a double
  // post: only the idempotency key on (transfer_id, kind) can.
  assertBalanced(once)
  assertBalanced(twice)

  const cashOnce = once.find((p) => p.accountCode === 'customer_cash')!.amountMinor
  const cashTwice = twice.filter((p) => p.accountCode === 'customer_cash')
    .reduce((s, p) => s + p.amountMinor, 0)
  assert.equal(cashTwice, cashOnce * 2, 'a repeat posting doubles customer cash')
})

test('payout balances and moves the liability out', () => {
  const p = payoutPostings({ receiveAmountMinor: 6_475_000, receiveCurrency: 'KES', reference: 'XPT-P' })
  assertBalanced(p)
  const payable = p.find((x) => x.accountCode === 'payout_payable')!
  assert.ok(payable.amountMinor > 0, 'payout clears the payable rather than adding to it')
})
