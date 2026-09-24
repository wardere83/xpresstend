import type { Env } from '../env'
import type { PaymentRail } from './types'
import { mobileMoneyRail } from './mobile-money'

export type { PaymentRail, RailCharge, RailOutcome, RailReference } from './types'

/**
 * The rail registry.
 *
 * Adding a provider is adding a file that implements PaymentRail and one line
 * here. Nothing in the transfer flow names a provider, so a second rail —
 * another wallet, a card acquirer, a bank — arrives without the send journey
 * being touched.
 */
const BUILDERS: Record<string, (env: Env) => PaymentRail> = {
  mobile_money: mobileMoneyRail,
}

export function railIds(): string[] {
  return Object.keys(BUILDERS)
}

export function getRail(env: Env, id: string): PaymentRail | null {
  const build = BUILDERS[id]
  return build ? build(env) : null
}

/**
 * The rail a transfer should use when the caller does not name one.
 *
 * Deliberately explicit rather than "the first configured one": which rail
 * moves the money is an operator decision, and a silent fallback to a
 * different provider than the operator intended is not a default worth having.
 */
export function defaultRail(env: Env): PaymentRail | null {
  const id = env.PAYMENT_RAIL ?? ''
  if (!id) return null
  return getRail(env, id)
}
