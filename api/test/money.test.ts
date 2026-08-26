import assert from 'node:assert/strict'
import { test } from 'node:test'
import { quote, QuoteError, type Corridor } from '../src/money.ts'
import { assertBalanced, fundingPostings, payoutPostings, UnbalancedPostingError } from '../src/ledger.ts'

const KE: Corridor = {
  id: 'cor_us_ke', send_country: 'US', receive_country: 'KE',
  send_currency: 'USD', receive_currency: 'KES',
  fee_flat_minor: 399, fee_percent_bps: 0,
  min_send_minor: 500, max_send_minor: 500_000,
  fx_margin_bps: 75, enabled: 1,
}
const MID_KES = 12_950_000_000 // 129.50 KES per USD, scaled 1e8

test('quote applies the flat fee and the FX margin', () => {
  const q = quote(KE, MID_KES, 10_000) // $100.00
  assert.equal(q.feeMinor, 399)
  assert.equal(q.totalChargedMinor, 10_399)
  // Margin makes the customer rate worse than mid, never better.
  assert.ok(q.effectiveRateE8 < MID_KES, 'effective rate must be below mid')
  assert.equal(q.effectiveRateE8, Math.floor((MID_KES * 9925) / 10_000))
  // 100 USD at ~128.53 KES => ~12,853 KES => 1,285,285 minor units.
  assert.equal(q.receiveAmountMinor, Math.floor((10_000 * q.effectiveRateE8) / 1e8))
})

test('percentage fees round up, never in the customer\'s favour', () => {
  const pctCorridor: Corridor = { ...KE, fee_flat_minor: 0, fee_percent_bps: 150 } // 1.5%
  const q = quote(pctCorridor, MID_KES, 3_333) // 1.5% = 49.995 minor
  assert.equal(q.feeMinor, 50, 'fee must round up from 49.995')
})

test('receive amount rounds down, so the margin always covers it', () => {
  // A rate and amount chosen to land mid-unit, where naive rounding would
  // hand the recipient a fraction of a cent the business never bought.
  const tiny = { ...KE, min_send_minor: 1 }
  const q = quote(tiny, 100_000_007, 501)
  const exact = (501 * q.effectiveRateE8) / 1e8
  assert.equal(q.receiveAmountMinor, Math.floor(exact))
  assert.ok(q.receiveAmountMinor <= exact, 'never rounds up')
})

test('corridor bounds are enforced', () => {
  assert.throws(() => quote(KE, MID_KES, 100), (e: unknown) =>
    e instanceof QuoteError && e.code === 'below_minimum')
  assert.throws(() => quote(KE, MID_KES, 900_000), (e: unknown) =>
    e instanceof QuoteError && e.code === 'above_maximum')
  assert.throws(() => quote({ ...KE, enabled: 0 }, MID_KES, 10_000), (e: unknown) =>
    e instanceof QuoteError && e.code === 'corridor_disabled')
  assert.throws(() => quote(KE, MID_KES, 10_000.5), (e: unknown) =>
    e instanceof QuoteError && e.code === 'amount_not_integer')
})

test('funding postings balance within every currency', () => {
  const q = quote(KE, MID_KES, 25_000)
  const postings = fundingPostings({
    sendAmountMinor: q.sendAmountMinor, feeMinor: q.feeMinor,
    receiveAmountMinor: q.receiveAmountMinor,
    sendCurrency: 'USD', receiveCurrency: 'KES', reference: 'XPT-TEST',
  })
  const usd = postings.filter((p) => p.currency === 'USD').reduce((s, p) => s + p.amountMinor, 0)
  const kes = postings.filter((p) => p.currency === 'KES').reduce((s, p) => s + p.amountMinor, 0)
  assert.equal(usd, 0, 'USD side must net to zero')
  assert.equal(kes, 0, 'KES side must net to zero')
  assert.ok(postings.every((p) => p.amountMinor !== 0), 'no zero-value rows (DB CHECK rejects them)')
})

test('a zero-fee corridor still balances and emits no zero rows', () => {
  const free: Corridor = { ...KE, fee_flat_minor: 0, fee_percent_bps: 0 }
  const q = quote(free, MID_KES, 10_000)
  assert.equal(q.feeMinor, 0)
  const postings = fundingPostings({
    sendAmountMinor: q.sendAmountMinor, feeMinor: 0,
    receiveAmountMinor: q.receiveAmountMinor,
    sendCurrency: 'USD', receiveCurrency: 'KES', reference: 'XPT-FREE',
  })
  assert.ok(postings.every((p) => p.amountMinor !== 0))
  assertBalanced(postings)
})

test('payout postings balance', () => {
  assertBalanced(payoutPostings({
    receiveAmountMinor: 1_285_285, receiveCurrency: 'KES', reference: 'XPT-TEST',
  }))
})

test('an unbalanced posting is rejected', () => {
  assert.throws(() => assertBalanced([
    { accountCode: 'customer_cash', currency: 'USD', amountMinor: 100, description: 'x' },
    { accountCode: 'fee_revenue', currency: 'USD', amountMinor: -99, description: 'y' },
  ]), UnbalancedPostingError)
})

test('same-currency corridor (US to Somalia, USD to USD) works', () => {
  const so: Corridor = {
    ...KE, id: 'cor_us_so', receive_country: 'SO', receive_currency: 'USD',
    fee_flat_minor: 299, fx_margin_bps: 0,
  }
  const q = quote(so, 100_000_000, 20_000)
  assert.equal(q.receiveAmountMinor, 20_000, 'no margin, no conversion loss')
  assert.equal(q.totalChargedMinor, 20_299)
  assertBalanced(fundingPostings({
    sendAmountMinor: 20_000, feeMinor: 299, receiveAmountMinor: 20_000,
    sendCurrency: 'USD', receiveCurrency: 'USD', reference: 'XPT-SO',
  }))
})
