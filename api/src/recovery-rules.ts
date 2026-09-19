/**
 * Rules for staff account recovery, kept apart from the routes that apply them.
 *
 * No imports, by design. The test runner strips types at runtime and cannot
 * follow extensionless imports through a route module, so policy that deserves
 * a test lives in a leaf like this one rather than beside the I/O. It is also
 * simply easier to reason about: everything here is a pure function of its
 * arguments, including the clock.
 */

/**
 * How long a reset link stays redeemable.
 *
 * An hour. Long enough to survive a slow mail queue and someone finishing what
 * they were doing, short enough that a link sitting in an inbox is not a
 * standing key to a console that can release other people's money.
 */
export const RESET_MINUTES = 60

/** Staff hold a higher bar than customers: they can move other people's money. */
export const MIN_STAFF_PASSWORD = 16

export interface ResetRow {
  used_at?: string | null
  revoked_at?: string | null
  status?: string
  expires_at?: string
}

/**
 * Whether a reset token may be redeemed right now.
 *
 * Absent, expired, already used, revoked, and belonging to an account disabled
 * since the token was issued all collapse to one answer, so a caller holding a
 * token learns only whether it works.
 *
 * Order matters. Used and revoked are checked before expiry so that a clock
 * skew, or a row whose expiry has been edited forward, cannot revive a token
 * that has already been spent. Every branch is a way into a staff account if it
 * returns true when it should not, which is why the clock is a parameter and
 * the whole thing is tested directly.
 */
export function isResetUsable(row: ResetRow | null, now: Date = new Date()): boolean {
  if (!row) return false
  if (row.used_at || row.revoked_at) return false
  if (row.status === 'disabled') return false
  if (!row.expires_at) return false
  return row.expires_at > now.toISOString()
}
