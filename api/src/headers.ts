/**
 * Response headers applied to everything this Worker serves.
 *
 * GitHub Pages cannot set headers on a static site, which left the sign-in page
 * framable and with no CSP at all. Serving the frontend from the Worker is what
 * makes these possible, so they are attached centrally rather than per route.
 */

/**
 * Style needs 'unsafe-inline': React writes inline style attributes and the
 * Google Fonts stylesheet arrives as a <link>. Script does not, because the
 * build emits a single external module and index.html carries no inline script,
 * so the strict value applies where it actually counts.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy': CSP,
  // Belt and braces alongside frame-ancestors, for engines predating CSP 2.
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // Microphone stays available to us: the product has a voice assistant.
  'permissions-policy': 'camera=(), microphone=(self), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
}

/** Returns a copy of the response carrying the security headers. */
export function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value)
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}
