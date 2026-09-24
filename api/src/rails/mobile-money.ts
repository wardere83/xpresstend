import type { Env } from '../env'
import type { PaymentRail, RailCharge, RailOutcome, RailRaw, RailReference } from './types'

/**
 * The mobile-money rail.
 *
 * Implemented against the wire protocol our mobile-money provider publishes in
 * its client libraries. Every operation posts one JSON envelope to a single
 * endpoint, with the operation selected by `serviceName` and the merchant
 * credentials carried inside `serviceParams`. That is why this file is the
 * only place in the codebase allowed to read those credentials, and why
 * nothing here is reachable from the browser.
 *
 * The provider is not named here, in the environment variables, or anywhere
 * else in this repository. No agreement is in place, and a provider's name
 * sitting in a codebase reads as a relationship that exists. The protocol is
 * what this module implements and the protocol is fully documented below, so
 * nothing about the name is load-bearing: an engineer needs the envelope, and
 * the operator already knows whose credentials they are installing.
 *
 * WHAT THE PUBLISHED PROTOCOL COVERS
 *
 * The complete set of published operations is:
 *
 *   API_PREAUTHORIZE         hold funds on a payer's mobile-money wallet
 *   API_PREAUTHORIZE_COMMIT  capture that hold
 *   API_PREAUTHORIZE_CANCEL  release that hold
 *   API_CANCELPURCHASE       cancel a completed purchase
 *   API_REFUND               refund a captured amount
 *   HPP_*                    the hosted payment page equivalents
 *
 * Every one of these is a COLLECTION operation: it pulls money from a payer
 * towards the merchant. There is no disbursement or payout operation in the
 * published protocol — no service name, no request model, nothing. So this
 * rail FUNDS a transfer from the sender's mobile-money wallet, which is what
 * it can genuinely do. The payout leg to the recipient is marked
 * [NEEDS PROVIDER API] and is not faked; see `status` below for the other gap.
 */

const SERVICE = {
  preauthorize: 'API_PREAUTHORIZE',
  commit: 'API_PREAUTHORIZE_COMMIT',
  cancel: 'API_PREAUTHORIZE_CANCEL',
  refund: 'API_REFUND',
} as const

/** Protocol constants, as published. */
const SCHEMA_VERSION = '1.0'
const CHANNEL_WEB = 'WEB'
const METHOD_MWALLET = 'MWALLET_ACCOUNT'

interface Envelope {
  schemaVersion: string
  timestamp: string
  requestId: string
  channelName: string
  serviceName: string
  serviceParams: Record<string, unknown>
}

/** The published response envelope: a flat head plus a `params` object. */
interface ProviderResponse {
  responseCode?: string
  responseMsg?: string
  errorCode?: string
  params?: {
    transactionId?: string
    referenceId?: string
    state?: string
    description?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

export interface MobileMoneyConfig {
  environment: 'STAGE' | 'PROD'
  merchantUid: string
  apiUserId: string
  apiKey: string
  baseUrl: string
}

/**
 * Reads configuration from the environment. Returns null when the operator has
 * not set it up, so the rail reports itself unconfigured instead of throwing at
 * the first transfer.
 *
 * No endpoint is hardcoded, for either environment. A default would be a host
 * this repository asserts is correct, and the staging and production addresses
 * are the operator's to supply from their own provider documentation. Unset
 * means unconfigured, never "try somewhere and see".
 */
export function mobileMoneyConfig(env: Env): MobileMoneyConfig | null {
  const merchantUid = env.MOBILE_MONEY_MERCHANT_UID
  const apiUserId = env.MOBILE_MONEY_API_USER_ID
  const apiKey = env.MOBILE_MONEY_API_KEY
  if (!merchantUid || !apiUserId || !apiKey) return null

  const environment = env.MOBILE_MONEY_ENVIRONMENT === 'PROD' ? 'PROD' : 'STAGE'
  const baseUrl =
    environment === 'PROD' ? env.MOBILE_MONEY_PROD_BASE_URL ?? '' : env.MOBILE_MONEY_STAGE_BASE_URL ?? ''
  // Separate variables per environment, on purpose: one shared URL is how a
  // production credential ends up posting at a sandbox.
  if (!baseUrl) return null

  return { environment, merchantUid, apiUserId, apiKey, baseUrl }
}

/**
 * Response codes are provider-defined and not enumerated in the published
 * client libraries, so the mapping is driven by the success and pending
 * markers the protocol documents rather than by a table invented here.
 * Anything unrecognised is a failure, which is the safe direction: an unknown
 * code never reads as money received.
 */
const SUCCESS_CODES = new Set(['2001', '0', '200'])
const PENDING_STATES = new Set(['PENDING', 'PENDING_AUTHORIZATION', 'IN_PROGRESS'])
const SUCCESS_STATES = new Set(['APPROVED', 'SUCCESS', 'TXN_SUCCESS', 'COMMITED', 'COMMITTED'])

function classify(
  res: ProviderResponse,
  raw: RailRaw,
  settled: 'authorized' | 'captured' | 'released' | 'refunded',
): RailOutcome {
  const code = String(res.responseCode ?? '')
  const state = String(res.params?.state ?? '').toUpperCase()
  const providerTxnId = String(res.params?.transactionId ?? '')
  const message = String(res.responseMsg ?? '')

  if (PENDING_STATES.has(state)) {
    return { kind: 'pending', providerTxnId: providerTxnId || null, message: message || 'Awaiting payer approval', raw }
  }
  if (SUCCESS_CODES.has(code) && (state === '' || SUCCESS_STATES.has(state))) {
    if (!providerTxnId) {
      // A success with no transaction id cannot be captured, released or
      // refunded later, so it is not something to record as money moved.
      return { kind: 'failed', code: code || 'no_txn_id', message: 'Provider returned success with no transaction id', raw }
    }
    return { kind: settled, providerTxnId, raw }
  }
  return {
    kind: 'failed',
    code: String(res.errorCode ?? code ?? 'unknown'),
    message: message || 'The payment provider declined the request.',
    raw,
  }
}

export function mobileMoneyRail(env: Env): PaymentRail {
  const config = mobileMoneyConfig(env)

  async function call(
    serviceName: string,
    serviceParams: Record<string, unknown>,
    requestId: string,
  ): Promise<{ res: ProviderResponse; raw: RailRaw } | RailOutcome> {
    if (!config) {
      return { kind: 'unsupported', operation: serviceName, detail: 'Mobile money is not configured on this environment.' }
    }
    const envelope: Envelope = {
      schemaVersion: SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      requestId,
      channelName: CHANNEL_WEB,
      serviceName,
      // Credentials are attached here, server-side, and only here.
      serviceParams: {
        merchantUid: config.merchantUid,
        apiUserId: config.apiUserId,
        apiKey: config.apiKey,
        ...serviceParams,
      },
    }

    let response: Response
    try {
      response = await fetch(config.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope),
      })
    } catch (err) {
      // A network failure is genuinely unknown, not a decline: the provider may
      // have processed it. Surfaced as pending so the transfer is reconciled
      // rather than silently retried into a double charge.
      return {
        kind: 'pending',
        providerTxnId: null,
        message: err instanceof Error ? err.message : 'Could not reach the payment provider.',
        raw: {},
      }
    }

    const text = await response.text()
    let parsed: ProviderResponse
    try {
      parsed = JSON.parse(text) as ProviderResponse
    } catch {
      return {
        kind: 'failed',
        code: `http_${response.status}`,
        message: 'Unreadable response from the payment provider.',
        raw: { body: text.slice(0, 500) },
      }
    }
    return { res: parsed, raw: redact(parsed) }
  }

  return {
    id: 'mobile_money',
    configured: config !== null,

    async authorize(charge: RailCharge): Promise<RailOutcome> {
      const out = await call(
        SERVICE.preauthorize,
        {
          paymentMethod: METHOD_MWALLET,
          payerInfo: {
            accountNo: charge.payerAccountNo,
            // The protocol names this accountPwd. Passed straight through and
            // never written anywhere: not to the database, not to the audit log.
            accountPwd: charge.payerAccountPin ?? '',
          },
          transactionInfo: {
            referenceId: charge.reference,
            invoiceId: charge.transferId,
            // The protocol sends a decimal string, not minor units.
            amount: minorToDecimal(charge.amountMinor),
            currency: charge.currency,
            description: charge.description,
          },
        },
        charge.transferId,
      )
      if ('kind' in out) return out
      return classify(out.res, out.raw, 'authorized')
    },

    async capture(input: RailReference): Promise<RailOutcome> {
      const out = await call(
        SERVICE.commit,
        { transactionId: input.providerTxnId, description: input.description, referenceId: input.reference },
        input.transferId,
      )
      if ('kind' in out) return out
      return classify(out.res, out.raw, 'captured')
    },

    async release(input: RailReference): Promise<RailOutcome> {
      const out = await call(
        SERVICE.cancel,
        { transactionId: input.providerTxnId, description: input.description, referenceId: input.reference },
        input.transferId,
      )
      if ('kind' in out) return out
      return classify(out.res, out.raw, 'released')
    },

    async refund(input: RailReference & { amountMinor: number }): Promise<RailOutcome> {
      const out = await call(
        SERVICE.refund,
        {
          transactionId: input.providerTxnId,
          description: input.description,
          referenceId: input.reference,
          amount: minorToDecimal(input.amountMinor),
        },
        input.transferId,
      )
      if ('kind' in out) return out
      return classify(out.res, out.raw, 'refunded')
    },

    /**
     * [NEEDS PROVIDER API] — no published status operation exists.
     *
     * The provider's client libraries ship payment-status model classes, but no
     * service method uses them and no serviceName covers a status query. Those
     * models' fields do not match the serviceParams shape every other operation
     * uses, so the correct call cannot be derived from the published code.
     *
     * Guessing one would produce a transfer whose displayed state came from a
     * request the provider never answered. So this returns `unsupported`, the
     * transfer stays in the state our own ledger records, and the UI says it is
     * awaiting confirmation rather than claiming an outcome. Fill this in once
     * the status service name and parameters are documented.
     */
    async status(input: RailReference): Promise<RailOutcome> {
      return {
        kind: 'unsupported',
        operation: 'status',
        detail:
          'The provider publishes no transaction-status operation. ' +
          `Transfer ${input.transferId} keeps the state recorded by our own ledger until one exists.`,
      }
    },
  }
}

/** Minor units to the decimal string the protocol sends, without floating point. */
export function minorToDecimal(minor: number): string {
  const sign = minor < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(minor))
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

/**
 * Strips anything that identifies the payer's wallet before a response is
 * stored or logged. The audit trail needs the provider's decision, not the
 * customer's account number.
 */
function redact(res: ProviderResponse): RailRaw {
  const { params, ...head } = res
  const safeParams = params
    ? {
        transactionId: params.transactionId,
        referenceId: params.referenceId,
        state: params.state,
        description: params.description,
      }
    : undefined
  return { ...head, params: safeParams }
}
