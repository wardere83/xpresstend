import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import type { Env, Vars } from './env'
import { adminAuth, auth } from './routes-auth'
import { admin } from './routes-admin'
import { transfers } from './routes-transfers'

const app = new Hono<{ Bindings: Env; Variables: Vars }>()

app.use('*', secureHeaders())

// Credentialed CORS must name a single origin — '*' is rejected by browsers
// when cookies are involved, which is exactly how sessions travel here.
app.use('*', async (c, next) => {
  const allowed = [c.env.APP_ORIGIN, 'https://www.xpresstend.com']
  if (c.env.ENVIRONMENT === 'development') allowed.push('http://localhost:5173')
  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : allowed[0]),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })(c, next)
})

app.get('/health', async (c) => {
  const row = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM corridors WHERE enabled = 1`)
    .first<{ n: number }>()
  return c.json({ ok: true, environment: c.env.ENVIRONMENT, corridors: row?.n ?? 0 })
})

app.route('/auth', auth)
app.route('/admin/auth', adminAuth)
app.route('/admin', admin)
app.route('/', transfers)

app.notFound((c) => c.json({ error: 'not_found' }, 404))

app.onError((err, c) => {
  // Never leak internals to the caller; the detail goes to the Worker log.
  console.error('unhandled', err)
  return c.json({ error: 'internal_error' }, 500)
})

export default app
