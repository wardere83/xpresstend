import { Hono } from 'hono'
import { PBKDF2_ITERATIONS, hashPassword, newId, randomHex, timingSafeEqual } from './crypto'
import { audit } from './audit'
import type { Env, Vars } from './env'

/**
 * Creates the very first staff account.
 *
 * The password hash mixes in SESSION_PEPPER, which only the Worker holds, so an
 * admin cannot be inserted into the database from outside. This route is the
 * way in, and it is deliberately narrow:
 *
 *   - it does nothing unless ADMIN_BOOTSTRAP_SECRET is set
 *   - it refuses once any admin exists, so it cannot be replayed
 *   - the caller chooses the password, so no credential is ever generated,
 *     logged, or handed through a third party
 *
 * Unset the secret after the first account and the route stops existing.
 */
export const bootstrap = new Hono<{ Bindings: Env; Variables: Vars }>()

/**
 * Whether the setup screen should offer itself. True only when the secret is
 * set and no admin exists, so it stops advertising the moment either changes.
 * It reveals nothing an attacker could not learn by attempting the bootstrap.
 */
bootstrap.get('/status', async (c) => {
  if (!c.env.ADMIN_BOOTSTRAP_SECRET) return c.json({ available: false })
  const row = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM admins`).first<{ n: number }>()
  return c.json({ available: (row?.n ?? 0) === 0 })
})

bootstrap.post('/admin', async (c) => {
  const expected = c.env.ADMIN_BOOTSTRAP_SECRET
  // Absent secret is a 404, not a 403: an attacker learns nothing about whether
  // the route exists on this deployment.
  if (!expected) return c.json({ error: 'not_found' }, 404)

  const provided = c.req.header('x-bootstrap-secret') ?? ''
  if (!timingSafeEqual(provided, expected)) return c.json({ error: 'not_found' }, 404)

  const existing = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM admins`).first<{ n: number }>()
  if ((existing?.n ?? 0) > 0) {
    return c.json({ error: 'already_bootstrapped', message: 'A staff account already exists.' }, 409)
  }

  const b = ((await c.req.json().catch(() => ({}))) as {
    email?: string; name?: string; password?: string
  })
  const email = (b.email ?? '').trim().toLowerCase()
  const name = (b.name ?? '').trim()
  const password = b.password ?? ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'invalid_email' }, 400)
  if (!name) return c.json({ error: 'name_required' }, 400)
  // Staff can release other people's money, so hold them to a longer password
  // than customers.
  if (password.length < 16) {
    return c.json({ error: 'weak_password', message: 'Staff passwords must be at least 16 characters.' }, 400)
  }

  const salt = randomHex(16)
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS, c.env.SESSION_PEPPER ?? '')
  const id = newId('adm')
  const now = new Date().toISOString()

  /*
   * Insert only while the table is still empty. The count above and this insert
   * were separate, so two valid bootstrap requests could both pass the check
   * and create an owner. The SELECT inside the INSERT closes that.
   */
  const created = await c.env.DB.prepare(
    `INSERT INTO admins (id, email, password_hash, password_salt, password_iterations,
                         name, role, status, created_at, updated_at)
     SELECT ?, ?, ?, ?, ?, ?, 'owner', 'active', ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM admins)`,
  ).bind(id, email, hash, salt, PBKDF2_ITERATIONS, name, now, now).run()

  if (created.meta.changes !== 1) {
    return c.json({ error: 'already_bootstrapped', message: 'A staff account already exists.' }, 409)
  }

  await audit(c.env.DB, {
    actorType: 'system', action: 'admin.bootstrapped', entityType: 'admin', entityId: id,
    metadata: { email, role: 'owner' }, ip: c.req.header('cf-connecting-ip'),
  })

  return c.json({
    ok: true,
    role: 'owner',
    next: 'Sign in at /admin, then unset ADMIN_BOOTSTRAP_SECRET to close this route.',
  })
})
