import { Hono } from 'hono'
import { PBKDF2_ITERATIONS, hashPassword, hashToken, randomHex } from './crypto'
import { audit } from './audit'
import type { Env, Vars } from './env'

/**
 * Accepting a staff invitation.
 *
 * Public by necessity, since the invitee has no session yet, so it is written
 * to give nothing away: the lookup is by token hash only, and an invalid,
 * expired, used or revoked token all return the same response. The invited
 * account holds an unusable placeholder hash until this succeeds.
 */
export const invite = new Hono<{ Bindings: Env; Variables: Vars }>()

const MIN_STAFF_PASSWORD = 16

async function findInvite(db: D1Database, token: string) {
  return db
    .prepare(
      `SELECT i.id, i.admin_id, i.expires_at, i.accepted_at, i.revoked_at,
              a.email, a.name, a.role, a.status
         FROM staff_invites i JOIN admins a ON a.id = i.admin_id
        WHERE i.token_hash = ?`,
    )
    .bind(await hashToken(token))
    .first<Record<string, string>>()
}

function usable(row: Record<string, string> | null): boolean {
  if (!row) return false
  if (row.accepted_at || row.revoked_at) return false
  return row.expires_at > new Date().toISOString()
}

/** Lets the accept screen show who the invitation is for before asking for a password. */
invite.get('/:token', async (c) => {
  const row = await findInvite(c.env.DB, c.req.param('token') ?? '')
  if (!usable(row)) return c.json({ error: 'invalid_invite' }, 404)
  return c.json({ ok: true, email: row!.email, name: row!.name, role: row!.role })
})

invite.post('/:token/accept', async (c) => {
  const token = c.req.param('token') ?? ''
  const b = ((await c.req.json().catch(() => ({}))) as { password?: string })
  const password = b.password ?? ''

  if (password.length < MIN_STAFF_PASSWORD) {
    return c.json(
      { error: 'weak_password', message: `Staff passwords must be at least ${MIN_STAFF_PASSWORD} characters.` },
      400,
    )
  }

  const row = await findInvite(c.env.DB, token)
  if (!usable(row)) return c.json({ error: 'invalid_invite' }, 404)

  const salt = randomHex(16)
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS, c.env.SESSION_PEPPER ?? '')
  const now = new Date().toISOString()

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE admins SET password_hash = ?, password_salt = ?, password_iterations = ?,
                         status = 'active', updated_at = ? WHERE id = ?`,
    ).bind(hash, salt, PBKDF2_ITERATIONS, now, row!.admin_id),
    // Single use: burn it here rather than relying on the expiry.
    c.env.DB.prepare(`UPDATE staff_invites SET accepted_at = ? WHERE id = ?`).bind(now, row!.id),
  ])

  await audit(c.env.DB, {
    actorType: 'admin', actorId: row!.admin_id, action: 'staff.invite_accepted',
    entityType: 'admin', entityId: row!.admin_id, metadata: { email: row!.email },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })

  return c.json({ ok: true, email: row!.email })
})
