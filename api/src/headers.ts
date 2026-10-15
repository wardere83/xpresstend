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
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

// Only the sandboxed public quote frame can load the provider's widget code.
// The website, all sign-ins and staff pages keep the strict first-party policy.
const MARKET_WIDGET_CSP = CSP.replace(
  "script-src 'self'",
  "script-src 'self' https://widgets.tradingview-widget.com",
)
  .replace(
    "connect-src 'self'",
    "connect-src 'self' https://*.tradingview.com https://*.tradingview-widget.com wss://*.tradingview.com",
  )
  .replace(
    "img-src 'self' data: blob:",
    "img-src 'self' data: blob: https://*.tradingview.com https://*.tradingview-widget.com",
  )
  .replace(
    "font-src 'self' data:",
    "font-src 'self' data: https://*.tradingview.com https://*.tradingview-widget.com",
  )
  .replace(
    "frame-ancestors 'none'",
    "frame-src https://widgets.tradingview-widget.com; frame-ancestors 'self'",
  )

const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy': CSP,
  // Belt and braces alongside frame-ancestors, for engines predating CSP 2.
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // Microphone stays available to us: the product has a voice assistant.
  'permissions-policy':
    'camera=(), microphone=(self), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
}

/** Returns a copy of the response carrying the security headers. */
export function withSecurityHeaders(
  res: Response,
  marketWidget = false,
): Response {
  const headers = new Headers(res.headers)
  for (const [name, value] of Object.entries(SECURITY_HEADERS))
    headers.set(name, value)
  if (marketWidget) {
    headers.set('content-security-policy', MARKET_WIDGET_CSP)
    headers.set('x-frame-options', 'SAMEORIGIN')
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}
