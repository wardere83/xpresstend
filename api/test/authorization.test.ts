import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PBKDF2_ITERATIONS, hashPassword, timingSafeEqual, verifyPassword } from '../src/crypto.ts'

/**
 * Payment authorisation rests on these, and none of it was covered before.
 */

test('the right password verifies and a wrong one does not', async () => {
  const salt = 'a'.repeat(32)
  const hash = await hashPassword('CorrectHorse99', salt, PBKDF2_ITERATIONS, 'pepper')
  assert.ok(await verifyPassword('CorrectHorse99', salt, PBKDF2_ITERATIONS, hash, 'pepper'))
  assert.equal(await verifyPassword('WrongHorse99!!', salt, PBKDF2_ITERATIONS, hash, 'pepper'), false)
})

test('the pepper is part of the hash, so losing it invalidates every password', async () => {
  const salt = 'b'.repeat(32)
  const withPepper = await hashPassword('CorrectHorse99', salt, PBKDF2_ITERATIONS, 'pepper')
  const without = await hashPassword('CorrectHorse99', salt, PBKDF2_ITERATIONS, '')
  assert.notEqual(withPepper, without)
  // This is why production refuses to start without SESSION_PEPPER: adding it
  // later would silently lock out everyone created before.
  assert.equal(await verifyPassword('CorrectHorse99', salt, PBKDF2_ITERATIONS, withPepper, ''), false)
})

test('the same password under a different salt gives a different hash', async () => {
  const a = await hashPassword('CorrectHorse99', 'salt-one', PBKDF2_ITERATIONS, '')
  const b = await hashPassword('CorrectHorse99', 'salt-two', PBKDF2_ITERATIONS, '')
  assert.notEqual(a, b)
})

test('the work factor survives being split into rounds under the platform cap', async () => {
  // Workers refuse a single PBKDF2 call above 100k, so the work is chained.
  // Different totals must still produce different hashes.
  const salt = 'c'.repeat(32)
  const at200k = await hashPassword('CorrectHorse99', salt, 200_000, '')
  const at100k = await hashPassword('CorrectHorse99', salt, 100_000, '')
  assert.notEqual(at200k, at100k)
  assert.equal(at200k.length, 64, 'still a 256-bit hash')
})

test('comparison is length-safe', () => {
  assert.equal(timingSafeEqual('abc', 'abc'), true)
  assert.equal(timingSafeEqual('abc', 'abd'), false)
  assert.equal(timingSafeEqual('abc', 'abcd'), false)
})
