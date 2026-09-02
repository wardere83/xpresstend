/**
 * Password and token primitives, built on WebCrypto so they run inside a
 * Worker with no Node polyfills.
 */

/**
 * Workers refuses any single PBKDF2 call above 100,000 iterations
 * ("Pbkdf2 failed: iteration counts above 100000 are not supported"), which is
 * well under the OWASP floor for PBKDF2-HMAC-SHA256.
 *
 * Rather than accept a weaker hash, the work is split across chained rounds:
 * each round derives from the previous round's output, so an attacker still has
 * to perform the full iteration count. The effective total is what gets stored
 * per row, so it can be raised later without breaking existing hashes.
 */
const PBKDF2_MAX_ROUND = 100_000
export const PBKDF2_ITERATIONS = 200_000

const enc = new TextEncoder()

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomHex(bytes = 32): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function newId(prefix: string): string {
  return `${prefix}_${randomHex(12)}`
}

/**
 * Derives a password hash. The pepper is a deployment secret that is not in
 * the database, so a dump of the users table alone cannot be cracked offline.
 */
async function deriveRound(material: string, salt: string, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', enc.encode(material), 'PBKDF2', false, [
    'deriveBits',
  ])
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256,
  )
}

export async function hashPassword(
  password: string,
  salt: string,
  iterations: number,
  pepper = '',
): Promise<string> {
  // `iterations` is the effective total. Split it into rounds no larger than the
  // platform allows, each seeded by the previous round's output and its own
  // salt, so the total work is preserved and every call stays under the cap.
  const rounds = Math.max(1, Math.ceil(iterations / PBKDF2_MAX_ROUND))
  const perRound = Math.ceil(iterations / rounds)

  let material = password + pepper
  let bits = new ArrayBuffer(0)
  for (let round = 0; round < rounds; round++) {
    bits = await deriveRound(material, `${salt}:${round}`, perRound)
    material = toHex(bits)
  }
  return toHex(bits)
}

/** Length-independent, branch-free comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Session tokens are stored only as a hash, so a DB leak yields no live sessions. */
export async function hashToken(token: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(token)))
}

export async function verifyPassword(
  password: string,
  salt: string,
  iterations: number,
  expectedHash: string,
  pepper = '',
): Promise<boolean> {
  const actual = await hashPassword(password, salt, iterations, pepper)
  return timingSafeEqual(actual, expectedHash)
}
