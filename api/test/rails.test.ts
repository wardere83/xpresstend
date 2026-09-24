import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Env } from '../src/env.ts'
import { minorToDecimal, mobileMoneyConfig, mobileMoneyRail } from '../src/rails/mobile-money.ts'

/**
 * These exercise the rail against a stubbed transport rather than against the
 * provider. They prove the two things that are ours to get right: that the
 * envelope we put on the wire is the one the published protocol specifies, and
 * that every response class is mapped to the honest outcome — in particular
 * that a PENDING is carried as pending rather than rounded to either neighbour.
 */

const CONFIGURED: Env = {
  PAYMENT_RAIL: 'mobile_money',
  MOBILE_MONEY_MERCHANT_UID: 'M-TEST',
  MOBILE_MONEY_API_USER_ID: 'U-TEST',
  MOBILE_MONEY_API_KEY: 'K-TEST',
  MOBILE_MONEY_ENVIRONMENT: 'STAGE',
  MOBILE_MONEY_STAGE_BASE_URL: 'https://stage.example/endpoint',
} as unknown as Env

const CHARGE = {
  transferId: 'trf_1',
  reference: 'XPT-1111-2222-2026',
  amountMinor: 10_399,
  currency: 'USD',
  description: 'XpressTend transfer XPT-1111-2222-2026',
  payerAccountNo: '252610000000',
  payerAccountPin: '1234',
}

/** Captures the outgoing request and replies with the given JSON. */
function stubFetch(body: unknown): { seen: { url: string; payload: any }[] } {
  const seen: { url: string; payload: any }[] = []
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen.push({ url: String(url), payload: JSON.parse(String(init.body)) })
    return new Response(JSON.stringify(body), { status: 200 })
  }) as unknown as typeof fetch
  return { seen }
}

test('minor units convert to the decimal string the SDKs send, without floating point', () => {
  assert.equal(minorToDecimal(10_399), '103.99')
  assert.equal(minorToDecimal(5), '0.05')
  assert.equal(minorToDecimal(100), '1.00')
  assert.equal(minorToDecimal(0), '0.00')
  // The classic float result here is 70.99999999999999.
  assert.equal(minorToDecimal(7099), '70.99')
})

test('the rail is unconfigured until every credential is present', () => {
  assert.equal(mobileMoneyConfig({} as Env), null)
  assert.equal(
    mobileMoneyConfig({ MOBILE_MONEY_MERCHANT_UID: 'M', MOBILE_MONEY_API_USER_ID: 'U' } as unknown as Env),
    null,
    'a partial credential set must not produce a usable rail',
  )
  assert.notEqual(mobileMoneyConfig(CONFIGURED), null)
})

test('credentials without an endpoint are not a usable rail', () => {
  const { MOBILE_MONEY_STAGE_BASE_URL: _drop, ...noUrl } = CONFIGURED as Record<string, unknown>
  // No endpoint is hardcoded for either environment, so a full credential set
  // with no address configured must still report unconfigured.
  assert.equal(mobileMoneyConfig(noUrl as unknown as Env), null)
})

test('PROD never falls back to the staging endpoint', () => {
  // The staging URL is set on CONFIGURED; switching to PROD must not inherit
  // it. A production credential posting at a sandbox is the failure here.
  const prod = { ...CONFIGURED, MOBILE_MONEY_ENVIRONMENT: 'PROD' } as unknown as Env
  assert.equal(mobileMoneyConfig(prod), null)

  const withUrl = { ...prod, MOBILE_MONEY_PROD_BASE_URL: 'https://live.example' } as unknown as Env
  assert.equal(mobileMoneyConfig(withUrl)?.baseUrl, 'https://live.example')
})

test('authorize builds the envelope the published protocol specifies', async () => {
  const { seen } = stubFetch({
    responseCode: '2001',
    responseMsg: 'RCS_SUCCESS',
    params: { transactionId: 'WP-1', referenceId: CHARGE.reference, state: 'APPROVED' },
  })

  const outcome = await mobileMoneyRail(CONFIGURED).authorize(CHARGE)
  assert.equal(outcome.kind, 'authorized')

  const { payload } = seen[0]
  assert.equal(payload.schemaVersion, '1.0')
  assert.equal(payload.channelName, 'WEB')
  assert.equal(payload.serviceName, 'API_PREAUTHORIZE')
  assert.equal(payload.requestId, 'trf_1')
  assert.equal(payload.serviceParams.merchantUid, 'M-TEST')
  assert.equal(payload.serviceParams.apiUserId, 'U-TEST')
  assert.equal(payload.serviceParams.apiKey, 'K-TEST')
  assert.equal(payload.serviceParams.paymentMethod, 'MWALLET_ACCOUNT')
  assert.equal(payload.serviceParams.payerInfo.accountNo, CHARGE.payerAccountNo)
  assert.equal(payload.serviceParams.payerInfo.accountPwd, '1234')
  assert.equal(payload.serviceParams.transactionInfo.amount, '103.99')
  assert.equal(payload.serviceParams.transactionInfo.currency, 'USD')
  assert.equal(payload.serviceParams.transactionInfo.referenceId, CHARGE.reference)
})

test('a PENDING response is carried as pending, never as success', async () => {
  stubFetch({
    responseCode: '2001',
    responseMsg: 'Waiting for customer approval',
    params: { transactionId: 'WP-2', state: 'PENDING' },
  })
  const outcome = await mobileMoneyRail(CONFIGURED).authorize(CHARGE)
  assert.equal(outcome.kind, 'pending')
  assert.equal(outcome.kind === 'pending' && outcome.providerTxnId, 'WP-2')
})

test('an unrecognised response code is a failure, never a success', async () => {
  stubFetch({ responseCode: '5309', responseMsg: 'Insufficient balance', errorCode: 'E101', params: {} })
  const outcome = await mobileMoneyRail(CONFIGURED).authorize(CHARGE)
  assert.equal(outcome.kind, 'failed')
  assert.equal(outcome.kind === 'failed' && outcome.code, 'E101')
})

test('a success with no transaction id is not treated as money moved', async () => {
  // Nothing could be captured, released or refunded against it afterwards.
  stubFetch({ responseCode: '2001', responseMsg: 'RCS_SUCCESS', params: { state: 'APPROVED' } })
  const outcome = await mobileMoneyRail(CONFIGURED).authorize(CHARGE)
  assert.equal(outcome.kind, 'failed')
})

test('an unreachable provider is pending, not declined', async () => {
  globalThis.fetch = (async () => {
    throw new Error('connect ECONNREFUSED')
  }) as unknown as typeof fetch
  const outcome = await mobileMoneyRail(CONFIGURED).authorize(CHARGE)
  // The provider may well have processed it; calling that a decline invites a
  // retry that charges the payer twice.
  assert.equal(outcome.kind, 'pending')
})

test('capture, release and refund send the operations the protocol names', async () => {
  const ref = {
    transferId: 'trf_1',
    reference: CHARGE.reference,
    providerTxnId: 'WP-1',
    description: 'XpressTend transfer',
  }
  const rail = mobileMoneyRail(CONFIGURED)

  let stub = stubFetch({ responseCode: '2001', params: { transactionId: 'WP-1', state: 'APPROVED' } })
  await rail.capture(ref)
  assert.equal(stub.seen[0].payload.serviceName, 'API_PREAUTHORIZE_COMMIT')
  assert.equal(stub.seen[0].payload.serviceParams.transactionId, 'WP-1')

  stub = stubFetch({ responseCode: '2001', params: { transactionId: 'WP-1', state: 'APPROVED' } })
  await rail.release(ref)
  assert.equal(stub.seen[0].payload.serviceName, 'API_PREAUTHORIZE_CANCEL')

  stub = stubFetch({ responseCode: '2001', params: { transactionId: 'WP-1', state: 'APPROVED' } })
  await rail.refund({ ...ref, amountMinor: 10_399 })
  assert.equal(stub.seen[0].payload.serviceName, 'API_REFUND')
  assert.equal(stub.seen[0].payload.serviceParams.amount, '103.99')
})

test('status reports that the provider has no such operation rather than inventing one', async () => {
  const outcome = await mobileMoneyRail(CONFIGURED).status({
    transferId: 'trf_1',
    reference: CHARGE.reference,
    providerTxnId: 'WP-1',
    description: 'XpressTend transfer',
  })
  // [NEEDS PROVIDER API]: the published protocol exposes no status service.
  assert.equal(outcome.kind, 'unsupported')
})

test('the payer wallet number never survives into what we would store or log', async () => {
  stubFetch({
    responseCode: '2001',
    params: {
      transactionId: 'WP-1',
      state: 'APPROVED',
      // Providers echo payer details back. None of this may reach our records.
      accountNo: '252610000000',
      accountHolder: 'A Payer',
    },
  })
  const outcome = await mobileMoneyRail(CONFIGURED).authorize(CHARGE)
  assert.equal(outcome.kind, 'authorized')
  const raw = JSON.stringify(outcome.kind === 'authorized' ? outcome.raw : {})
  assert.ok(!raw.includes('252610000000'), 'payer account number must be redacted')
  assert.ok(!raw.includes('A Payer'), 'payer name must be redacted')
})
