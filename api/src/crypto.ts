/**
 * Password and token primitives, built on WebCrypto so they run inside a
 * Worker with no Node polyfills.
 */

/** OWASP's 2023 floor for PBKDF2-HMAC-SHA256. Stored per row so it can rise. */
export const PBKDF2_ITERATIONS = 210_000

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
export async function hashPassword(
  password: string,
  salt: string,
  iterations: number,
  pepper = '',
): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password + pepper), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256,
  )
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
