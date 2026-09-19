import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isResetUsable } from '../src/recovery-rules.ts'
import { hashToken } from '../src/crypto.ts'

/**
 * A password reset link is a bearer credential for a staff account, so every
 * branch that decides whether one is still redeemable is a way in if it says
 * yes when it should say no. That decision is isResetUsable, and this is its
 * rejection matrix.
 */

const FUTURE = '2099-01-01T00:00:00.000Z'
const PAST = '2000-01-01T00:00:00.000Z'
const live = { expires_at: FUTURE, status: 'active', used_at: null, revoked_at: null }

test('a live, unused token for an active account is redeemable', () => {
  assert.equal(isResetUsable(live), true)
})

test('a missing token is refused', () => {
  assert.equal(isResetUsable(null), false)
})

test('an expired token is refused', () => {
  assert.equal(isResetUsable({ ...live, expires_at: PAST }), false)
})

test('a token is single use, so a redeemed one is refused', () => {
  // Without this, a link forwarded or left in a mailbox stays a working key to
  // the account for the rest of the hour.
  assert.equal(isResetUsable({ ...live, used_at: '2026-09-19T12:00:00.000Z' }), false)
})

test('a revoked token is refused, which is what makes reissuing safe', () => {
  // Issuing a new link revokes the outstanding ones. If revocation were not
  // honoured here, every link ever sent would stay live until it expired.
  assert.equal(isResetUsable({ ...live, revoked_at: '2026-09-19T12:00:00.000Z' }), false)
})

test('a token for a disabled account is refused even while it is unexpired', () => {
  // The account may have been disabled after the link was sent. Offboarding
  // somebody has to survive a reset link that is still in their inbox.
  assert.equal(isResetUsable({ ...live, status: 'disabled' }), false)
})

test('an invited account may still redeem, which is the fix for a lost invitation', () => {
  // The token went to the address an owner chose, so this is the same trust as
  // the invitation itself and completes the same job.
  assert.equal(isResetUsable({ ...live, status: 'invited' }), true)
})

test('expiry is evaluated against the clock it is given, not only the wall clock', () => {
  const expires = '2026-09-19T12:00:00.000Z'
  assert.equal(isResetUsable({ ...live, expires_at: expires }, new Date('2026-09-19T11:59:59Z')), true)
  assert.equal(isResetUsable({ ...live, expires_at: expires }, new Date('2026-09-19T12:00:01Z')), false)
})

test('a row with no expiry is refused rather than treated as eternal', () => {
  // Defensive: a malformed row must fail closed, not open.
  assert.equal(isResetUsable({ status: 'active', used_at: null, revoked_at: null }), false)
})

test('used and revoked are checked before expiry, so a spent token cannot be revived', () => {
  // A clock skew or a row edited to a future expiry must not resurrect a token
  // that has already been spent.
  assert.equal(isResetUsable({ ...live, used_at: PAST, expires_at: FUTURE }), false)
  assert.equal(isResetUsable({ ...live, revoked_at: PAST, expires_at: FUTURE }), false)
})

test('tokens are stored as hashes, so the database holds nothing usable', async () => {
  // What the table stores must not be what the link contains: a leaked backup
  // should yield no working reset links.
  const token = 'a'.repeat(64)
  const stored = await hashToken(token)
  assert.notEqual(stored, token)
  assert.equal(stored.length, 64, 'SHA-256 hex')
  assert.equal(stored, await hashToken(token), 'deterministic, so lookup works')
  assert.notEqual(stored, await hashToken('b'.repeat(64)), 'distinct tokens do not collide')
})
