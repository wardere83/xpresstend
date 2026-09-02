import { Hono } from 'hono'
import { PBKDF2_ITERATIONS, hashPassword, newId, randomHex, verifyPassword } from './crypto'
import { audit } from './audit'
import type { Env, SessionAdmin, Vars } from './env'
import { requireRole } from './sessions'

/**
 * Staff administration.
 *
 * Creating and changing staff is restricted to owners, because a staff account
 * can release other people's money. Two rules exist purely to stop the console
 * being bricked from inside it:
 *
 *   - nobody may change their own role or status, so an owner cannot demote
 *     themselves out of the only account that can undo it
 *   - the last active owner cannot be demoted or disabled, so the account that
 *     can create staff always exists
 */
const ROLES: SessionAdmin['role'][] = ['viewer', 'agent', 'compliance', 'owner']

/** Staff hold a higher bar than customers: they can move other people's money. */
const MIN_STAFF_PASSWORD = 16

export const staff = new Hono<{ Bindings: Env; Variables: Vars }>()

/** Any signed-in staff member can see who else has access. */
staff.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, email, name, role, status, last_login_at, created_at
       FROM admins ORDER BY created_at`,
  ).all()
  return c.json({ staff: results })
})

staff.post('/', requireRole('owner'), async (c) => {
  const me = c.get('admin')
  const b = ((await c.req.json().catch(() => ({}))) as {
    email?: string; name?: string; role?: string; password?: string
  })

  const email = (b.email ?? '').trim().toLowerCase()
  const name = (b.name ?? '').trim()
  const role = (b.role ?? 'viewer') as SessionAdmin['role']
  const password = b.password ?? ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'invalid_email' }, 400)
  if (!name) return c.json({ error: 'name_required' }, 400)
  if (!ROLES.includes(role)) return c.json({ error: 'invalid_role' }, 400)
  if (password.length < MIN_STAFF_PASSWORD) {
    return c.json(
      { error: 'weak_password', message: `Staff passwords must be at least ${MIN_STAFF_PASSWORD} characters.` },
      400,
    )
  }

  const clash = await c.env.DB.prepare(`SELECT id FROM admins WHERE lower(email) = ?`).bind(email).first()
  if (clash) return c.json({ error: 'email_taken', message: 'That email already has access.' }, 409)

  const salt = randomHex(16)
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS, c.env.SESSION_PEPPER ?? '')
  const id = newId('adm')
  const now = new Date().toISOString()

  await c.env.DB.prepare(
    `INSERT INTO admins (id, email, password_hash, password_salt, password_iterations,
                         name, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).bind(id, email, hash, salt, PBKDF2_ITERATIONS, name, role, now, now).run()

  await audit(c.env.DB, {
    actorType: 'admin', actorId: me.id, action: 'staff.created',
    entityType: 'admin', entityId: id, metadata: { email, role },
    ip: c.req.header('cf-connecting-ip'),
  })

  return c.json({ ok: true, id, email, name, role, status: 'active' })
})

staff.patch('/:id', requireRole('owner'), async (c) => {
  const me = c.get('admin')
  const id = c.req.param('id') ?? ''
  const b = ((await c.req.json().catch(() => ({}))) as { role?: string; status?: string })

  if (id === me.id) {
    return c.json(
      { error: 'cannot_change_self', message: 'Ask another owner to change your own access.' },
      400,
    )
  }

  const target = await c.env.DB.prepare(`SELECT id, email, role, status FROM admins WHERE id = ?`)
    .bind(id).first<{ id: string; email: string; role: string; status: string }>()
  if (!target) return c.json({ error: 'not_found' }, 404)

  const role = (b.role ?? target.role) as SessionAdmin['role']
  const status = b.status ?? target.status
  if (!ROLES.includes(role)) return c.json({ error: 'invalid_role' }, 400)
  if (status !== 'active' && status !== 'disabled') return c.json({ error: 'invalid_status' }, 400)

  // Never leave the console without an owner who can let people back in.
  const losingOwner = target.role === 'owner' && (role !== 'owner' || status !== 'active')
  if (losingOwner) {
    const row = await c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM admins WHERE role = 'owner' AND status = 'active' AND id <> ?`,
    ).bind(id).first<{ n: number }>()
    if ((row?.n ?? 0) === 0) {
      return c.json(
        { error: 'last_owner', message: 'Promote another owner before changing this one.' },
        409,
      )
    }
  }

  await c.env.DB.prepare(`UPDATE admins SET role = ?, status = ?, updated_at = ? WHERE id = ?`)
    .bind(role, status, new Date().toISOString(), id).run()

  // A disabled account keeps its live sessions without this.
  if (status === 'disabled') {
    await c.env.DB.prepare(
      `UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL`,
    ).bind(new Date().toISOString(), id).run()
  }

  await audit(c.env.DB, {
    actorType: 'admin', actorId: me.id, action: 'staff.updated',
    entityType: 'admin', entityId: id,
    metadata: { email: target.email, from: { role: target.role, status: target.status }, to: { role, status } },
    ip: c.req.header('cf-connecting-ip'),
  })

  return c.json({ ok: true, id, role, status })
})

/** Changing your own password. Requires the current one, so a borrowed session cannot lock the owner out. */
staff.post('/password', async (c) => {
  const me = c.get('admin')
  const b = ((await c.req.json().catch(() => ({}))) as { currentPassword?: string; newPassword?: string })
  const next = b.newPassword ?? ''

  if (next.length < MIN_STAFF_PASSWORD) {
    return c.json(
      { error: 'weak_password', message: `Staff passwords must be at least ${MIN_STAFF_PASSWORD} characters.` },
      400,
    )
  }

  const row = await c.env.DB.prepare(
    `SELECT password_hash, password_salt, password_iterations FROM admins WHERE id = ?`,
  ).bind(me.id).first<Record<string, string | number>>()
  if (!row) return c.json({ error: 'not_found' }, 404)

  const ok = await verifyPassword(
    b.currentPassword ?? '', String(row.password_salt), Number(row.password_iterations),
    String(row.password_hash), c.env.SESSION_PEPPER ?? '',
  )
  if (!ok) return c.json({ error: 'invalid_credentials' }, 401)

  const salt = randomHex(16)
  const hash = await hashPassword(next, salt, PBKDF2_ITERATIONS, c.env.SESSION_PEPPER ?? '')
  const now = new Date().toISOString()

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE admins SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?`,
    ).bind(hash, salt, PBKDF2_ITERATIONS, now, me.id),
    // Every other session for this account dies with the old password.
    c.env.DB.prepare(
      `UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL`,
    ).bind(now, me.id),
  ])

  await audit(c.env.DB, {
    actorType: 'admin', actorId: me.id, action: 'staff.password_changed',
    entityType: 'admin', entityId: me.id, ip: c.req.header('cf-connecting-ip'),
  })

  return c.json({ ok: true, reauthenticate: true })
})
