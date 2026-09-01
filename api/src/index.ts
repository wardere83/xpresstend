import { Hono } from 'hono'
import type { Env, Vars } from './env'
import { withSecurityHeaders } from './headers'
import { adminAuth, auth } from './routes-auth'
import { admin } from './routes-admin'
import { transfers } from './routes-transfers'

/**
 * One Worker serves both the site and its API.
 *
 * The frontend used to sit on GitHub Pages, which cannot set response headers,
 * so the sign-in page shipped with no CSP and nothing stopping it being framed.
 * Serving the built assets from here fixes that.
 *
 * Collapsing the two origins into one also removes CORS entirely: the browser
 * now treats the API as same-origin, so the session cookie travels without a
 * cross-site exemption and can be tightened to SameSite=Strict later.
 */
const api = new Hono<{ Bindings: Env; Variables: Vars }>()

api.get('/health', async (c) => {
  const row = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM corridors WHERE enabled = 1`)
    .first<{ n: number }>()
  return c.json({ ok: true, environment: c.env.ENVIRONMENT, corridors: row?.n ?? 0 })
})

api.route('/auth', auth)
api.route('/admin/auth', adminAuth)
api.route('/admin', admin)
api.route('/', transfers)

api.notFound((c) => c.json({ error: 'not_found' }, 404))
api.onError((err, c) => {
  // Never leak internals to the caller; the detail goes to the Worker log.
  console.error('unhandled', err)
  return c.json({ error: 'internal_error' }, 500)
})

const app = new Hono<{ Bindings: Env; Variables: Vars }>()
app.route('/api', api)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return withSecurityHeaders(await app.fetch(request, env, ctx))
    }

    // Everything else is the site. The assets binding falls back to index.html
    // for unknown paths, which is what a client-routed app needs on a cold URL.
    return withSecurityHeaders(await env.ASSETS.fetch(request))
  },
}
