import { withMarketDocumentHeaders, withSecurityHeaders } from './headers.ts'

/** A separate origin with static assets only: no database, secrets or app API. */
interface MarketEnv {
  ASSETS: Fetcher
}

const DOCUMENTS = new Set(['/dollar-index', '/dollar-index.html'])
const STATIC_ASSETS = new Set(['/dollar-index.js', '/dollar-index.css'])

export default {
  async fetch(request: Request, env: MarketEnv): Promise<Response> {
    const url = new URL(request.url)
    const document = DOCUMENTS.has(url.pathname)
    if (!document && !STATIC_ASSETS.has(url.pathname)) {
      return withSecurityHeaders(new Response('Not found', { status: 404 }))
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withSecurityHeaders(
        new Response('Method not allowed', {
          status: 405,
          headers: { allow: 'GET, HEAD' },
        }),
      )
    }

    // Both public document spellings resolve to one literal file. Wrangler
    // disables automatic HTML canonicalization, so neither response redirects
    // around this Worker's document-specific security policy.
    if (document) url.pathname = '/dollar-index.html'
    const headers = new Headers()
    for (const name of [
      'if-none-match',
      'if-modified-since',
      'range',
      'if-range',
    ]) {
      const value = request.headers.get(name)
      if (value !== null) headers.set(name, value)
    }
    // Do not pass Cookie, Authorization or other visitor identity to assets.
    const asset = await env.ASSETS.fetch(
      new Request(url, { method: request.method, headers }),
    )
    const responseHeaders = new Headers(asset.headers)
    responseHeaders.delete('set-cookie')
    responseHeaders.delete('set-cookie2')
    const response = new Response(
      request.method === 'HEAD' ? null : asset.body,
      {
        status: asset.status,
        statusText: asset.statusText,
        headers: responseHeaders,
      },
    )
    return document
      ? withMarketDocumentHeaders(response)
      : withSecurityHeaders(response)
  },
}
