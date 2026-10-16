import { Hono } from 'hono'
import {
  PBKDF2_ITERATIONS,
  hashPassword,
  hashToken,
  newId,
  randomHex,
} from './crypto'
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
  if (row.status !== 'active' && row.status !== 'invited') return false
  if (row.accepted_at || row.revoked_at) return false
  return row.expires_at > new Date().toISOString()
}

/** Lets the accept screen show who the invitation is for before asking for a password. */
invite.get('/:token', async (c) => {
  const row = await findInvite(c.env.DB, c.req.param('token') ?? '')
  if (!usable(row)) return c.json({ error: 'invalid_invite' }, 404)
  return c.json({
    ok: true,
    email: row!.email,
    name: row!.name,
    role: row!.role,
  })
})

invite.post('/:token/accept', async (c) => {
  const token = c.req.param('token') ?? ''
  const b = (await c.req.json().catch(() => ({}))) as { password?: string }
  const password = b.password ?? ''

  if (password.length < MIN_STAFF_PASSWORD) {
    return c.json(
      {
        error: 'weak_password',
        message: `Staff passwords must be at least ${MIN_STAFF_PASSWORD} characters.`,
      },
      400,
    )
  }

  const row = await findInvite(c.env.DB, token)
  if (!usable(row)) return c.json({ error: 'invalid_invite' }, 404)

  const salt = randomHex(16)
  const hash = await hashPassword(
    password,
    salt,
    PBKDF2_ITERATIONS,
    c.env.SESSION_PEPPER ?? '',
  )
  const now = new Date().toISOString()
  const tokenHash = await hashToken(token)

  const results = await c.env.DB.batch([
    // Revalidate after password hashing, inside the same transaction that
    // consumes the invitation. Offboarding, revocation, expiry and another
    // acceptance may all have occurred since findInvite().
    c.env.DB.prepare(
      `UPDATE admins SET password_hash = ?, password_salt = ?, password_iterations = ?,
                         status = 'active', updated_at = ?
        WHERE id = ? AND status IN ('active','invited')
          AND EXISTS (SELECT 1 FROM staff_invites i WHERE i.id = ? AND i.admin_id = admins.id
            AND i.token_hash = ? AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > ?)`,
    ).bind(
      hash,
      salt,
      PBKDF2_ITERATIONS,
      now,
      row!.admin_id,
      row!.id,
      tokenHash,
      now,
    ),
    // The fresh random salt and resulting hash identify this transaction's
    // successful credential write, without a reusable claim or new schema.
    c.env.DB.prepare(
      `UPDATE staff_invites SET accepted_at = ?
        WHERE id = ? AND admin_id = ? AND token_hash = ?
          AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?
          AND EXISTS (SELECT 1 FROM admins a WHERE a.id = staff_invites.admin_id
            AND a.status = 'active' AND a.password_salt = ? AND a.password_hash = ?)`,
    ).bind(now, row!.id, row!.admin_id, tokenHash, now, salt, hash),
    c.env.DB.prepare(
      `INSERT INTO audit_log (id,actor_type,actor_id,action,entity_type,entity_id,metadata,ip,user_agent,created_at)
       SELECT ?,'admin',?,'staff.invite_accepted','admin',?,?,?,?,?
        WHERE EXISTS (SELECT 1 FROM staff_invites i JOIN admins a ON a.id = i.admin_id
          WHERE i.id = ? AND i.admin_id = ? AND i.token_hash = ? AND i.accepted_at = ?
            AND i.revoked_at IS NULL AND a.status = 'active'
            AND a.password_salt = ? AND a.password_hash = ?)`,
    ).bind(
      newId('aud'),
      row!.admin_id,
      row!.admin_id,
      JSON.stringify({ email: row!.email }),
      c.req.header('cf-connecting-ip') ?? null,
      c.req.header('user-agent') ?? null,
      now,
      row!.id,
      row!.admin_id,
      tokenHash,
      now,
      salt,
      hash,
    ),
  ])
  if (
    results[0]?.meta.changes !== 1 ||
    results[1]?.meta.changes !== 1 ||
    results[2]?.meta.changes !== 1
  )
    return c.json({ error: 'invalid_invite' }, 404)

  return c.json({ ok: true, email: row!.email })
})
