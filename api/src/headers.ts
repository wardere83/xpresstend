/** Security headers for the customer application and its API. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "connect-src 'self'",
  'frame-src https://xpresstend-market.shrill-king-ef4e.workers.dev',
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

// This policy belongs only to the separate, assets-only market Worker. It is
// never selected by a URL or flag on the application Worker.
// Keep this explicit: production, the configured Worker preview, Vite's local
// dev/build preview, and the local browser-test server. See docs/dollar-index-ticker.md.
const MARKET_ANCESTORS = [
  'https://xpresstend.com',
  'https://www.xpresstend.com',
  'https://xpresstend.shrill-king-ef4e.workers.dev',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5179',
]

const MARKET_DOCUMENT_CSP = [
  "default-src 'self'",
  "script-src 'self' https://widgets.tradingview-widget.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https://*.tradingview.com https://*.tradingview-widget.com",
  "img-src 'self' data: blob: https://*.tradingview.com https://*.tradingview-widget.com",
  "connect-src 'self' https://*.tradingview.com https://*.tradingview-widget.com wss://*.tradingview.com",
  'frame-src https://widgets.tradingview-widget.com',
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  `frame-ancestors ${MARKET_ANCESTORS.join(' ')}`,
  'upgrade-insecure-requests',
].join('; ')

const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy': CSP,
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // Microphone stays available to the customer application's voice assistant.
  'permissions-policy':
    'camera=(), microphone=(self), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
}

/** The main Worker always receives the same first-party-only script policy. */
export function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [name, value] of Object.entries(SECURITY_HEADERS))
    headers.set(name, value)
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

/** Only the dedicated quote Worker imports this provider-capable policy. */
export function withMarketDocumentHeaders(res: Response): Response {
  const secured = withSecurityHeaders(res)
  const headers = new Headers(secured.headers)
  headers.set('content-security-policy', MARKET_DOCUMENT_CSP)
  headers.set(
    'permissions-policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  )
  headers.set('referrer-policy', 'no-referrer')
  headers.set('cache-control', 'no-store')
  headers.delete('x-frame-options')
  return new Response(secured.body, {
    status: secured.status,
    statusText: secured.statusText,
    headers,
  })
}
