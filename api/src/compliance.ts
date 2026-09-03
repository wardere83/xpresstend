import { newId } from './crypto'
import type { Env } from './env'

/**
 * The compliance controls a state examiner asks about.
 *
 * A money transmitter application is judged far more on these than on the
 * payment rail: who you screened, what you refused, what you recorded, and
 * whether the limits you published are actually enforced. Everything here runs
 * on every transfer and writes a record, so the answer to "show me" is a query
 * rather than a description.
 *
 * The screening provider is a local demonstration list. It is deliberately not
 * dressed up as a real sanctions feed: an examiner should see exactly where a
 * licensed provider plugs in, not a stub pretending to be one.
 */

/** Aggregate ceilings by verification tier, in minor units. */
export interface TierLimits {
  perTransfer: number
  daily: number
  monthly: number
  /** Transfers permitted in a rolling 24 hours, regardless of value. */
  dailyCount: number
}

export const TIER_LIMITS: Record<number, TierLimits> = {
  0: { perTransfer: 0, daily: 0, monthly: 0, dailyCount: 0 },
  1: { perTransfer: 100_000, daily: 200_000, monthly: 1_000_000, dailyCount: 5 },
  2: { perTransfer: 500_000, daily: 1_000_000, monthly: 5_000_000, dailyCount: 10 },
  3: { perTransfer: 2_000_000, daily: 5_000_000, monthly: 20_000_000, dailyCount: 20 },
}

/**
 * Bank Secrecy Act thresholds, in minor units.
 *
 * 3,000 USD is where a money transmitter must record and retain sender and
 * recipient details for a transfer. 10,000 USD is where a Currency Transaction
 * Report becomes due. Both are flagged so the obligation is visible at the
 * moment it arises rather than reconstructed later.
 */
export const RECORDKEEPING_THRESHOLD_MINOR = 300_000
export const CTR_THRESHOLD_MINOR = 1_000_000

export interface LimitDecision {
  allowed: boolean
  reason?: 'kyc_required' | 'over_per_transfer' | 'over_daily' | 'over_monthly' | 'over_daily_count'
  limitMinor?: number
  usedMinor?: number
}

/**
 * Checks a proposed transfer against every ceiling, not just the per-transfer
 * one. Per-transfer alone is trivially evaded by sending repeatedly, which is
 * exactly the structuring pattern the aggregate limits exist to catch.
 */
export async function checkLimits(
  env: Env,
  userId: string,
  tier: number,
  amountMinor: number,
): Promise<LimitDecision> {
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS[0]
  if (limits.perTransfer === 0) return { allowed: false, reason: 'kyc_required' }
  if (amountMinor > limits.perTransfer) {
    return { allowed: false, reason: 'over_per_transfer', limitMinor: limits.perTransfer }
  }

  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()

  // Cancelled and failed transfers do not consume an allowance.
  const counted = `status NOT IN ('failed', 'cancelled', 'draft')`

  const day = await env.DB.prepare(
    `SELECT COALESCE(SUM(send_amount_minor), 0) AS total, COUNT(*) AS n
       FROM transfers WHERE user_id = ? AND created_at > ? AND ${counted}`,
  ).bind(userId, dayAgo).first<{ total: number; n: number }>()

  const month = await env.DB.prepare(
    `SELECT COALESCE(SUM(send_amount_minor), 0) AS total
       FROM transfers WHERE user_id = ? AND created_at > ? AND ${counted}`,
  ).bind(userId, monthAgo).first<{ total: number }>()

  const dayTotal = Number(day?.total ?? 0)
  const dayCount = Number(day?.n ?? 0)
  const monthTotal = Number(month?.total ?? 0)

  if (dayCount >= limits.dailyCount) {
    return { allowed: false, reason: 'over_daily_count', limitMinor: limits.dailyCount, usedMinor: dayCount }
  }
  if (dayTotal + amountMinor > limits.daily) {
    return { allowed: false, reason: 'over_daily', limitMinor: limits.daily, usedMinor: dayTotal }
  }
  if (monthTotal + amountMinor > limits.monthly) {
    return { allowed: false, reason: 'over_monthly', limitMinor: limits.monthly, usedMinor: monthTotal }
  }
  return { allowed: true }
}

/**
 * Demonstration watchlist.
 *
 * Real screening matches against OFAC SDN, consolidated EU and UN lists, and
 * PEP data, with fuzzy matching and ongoing rescreening. That is a licensed
 * data feed. These entries exist so an examiner can watch a match being raised,
 * held, and resolved by a named person.
 */
const DEMO_WATCHLIST = [
  'ivan petrov',
  'omar al-baghdadi',
  'test sanctioned person',
]

export type ScreeningStatus = 'clear' | 'potential_match' | 'confirmed_match'

export interface ScreeningResult {
  status: ScreeningStatus
  matched?: string
  score?: number
}

/** Case- and punctuation-insensitive containment, plus a crude token overlap. */
export function screenName(name: string): ScreeningResult {
  const normalised = name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
  for (const entry of DEMO_WATCHLIST) {
    if (normalised === entry) return { status: 'confirmed_match', matched: entry, score: 100 }
    const tokens = new Set(normalised.split(' '))
    const entryTokens = entry.split(' ')
    const overlap = entryTokens.filter((t) => tokens.has(t)).length
    if (overlap >= 2) return { status: 'potential_match', matched: entry, score: 70 }
  }
  return { status: 'clear' }
}

/** Screens a subject and records the result, whatever the outcome. */
export async function screenAndRecord(
  env: Env,
  args: { subjectType: 'user' | 'recipient'; subjectId: string; name: string; transferId?: string },
): Promise<ScreeningResult> {
  const result = screenName(args.name)
  await env.DB.prepare(
    `INSERT INTO sanctions_screenings
       (id, subject_type, subject_id, transfer_id, provider, status, match_json, created_at)
     VALUES (?, ?, ?, ?, 'demo-list', ?, ?, ?)`,
  )
    .bind(
      newId('scr'),
      args.subjectType,
      args.subjectId,
      args.transferId ?? null,
      result.status,
      JSON.stringify({ name: args.name, matched: result.matched ?? null, score: result.score ?? null }),
      new Date().toISOString(),
    )
    .run()
  return result
}

/** Reporting obligations triggered by an amount. */
export function reportingFlags(amountMinor: number): string[] {
  const flags: string[] = []
  if (amountMinor >= RECORDKEEPING_THRESHOLD_MINOR) flags.push('bsa_recordkeeping')
  if (amountMinor >= CTR_THRESHOLD_MINOR) flags.push('ctr_review')
  return flags
}
