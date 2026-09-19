import { Hono } from 'hono'
import { PBKDF2_ITERATIONS, hashPassword, hashToken, newId, randomHex } from './crypto'
import { audit } from './audit'
import { passwordResetEmail, sendEmail, signInEmailReminderEmail } from './email'
import { FORGOT_ACCOUNT_LIMIT, FORGOT_IP_LIMIT, callerKey, overLimit } from './ratelimit'
import { MIN_STAFF_PASSWORD, RESET_MINUTES, isResetUsable } from './recovery-rules'
import type { Env, Vars } from './env'

/**
 * Staff account recovery.
 *
 * Two things a person actually loses: the password, and which address the
 * account is under. Both are handled here, and neither reveals whether an
 * account exists.
 *
 * On the word "retrieve": a password cannot be retrieved. They are stored as
 * PBKDF2-HMAC-SHA256 at 200,000 iterations with a per-account salt and a
 * server-side pepper, so nobody — staff, owner, or whoever holds a copy of the
 * database — can read one back. That is the entire point of storing them that
 * way, and it is what an examiner expects to find. So this resets rather than
 * retrieves.
 *
 * Every route below is public, because someone locked out has no session. They
 * are written on the assumption that the caller is hostile:
 *
 *   - The response to a recovery request is identical whether or not the
 *     address belongs to an account. Anything else turns this into a tool for
 *     discovering who has console access.
 *   - The link is only ever delivered by email. It is never returned in an HTTP
 *     response to an unauthenticated caller, which would let anyone reset any
 *     account. The owner-issued path, which does return a link, lives in
 *     routes-staff.ts behind an authenticated owner session.
 *   - Only the SHA-256 of a token is stored, so a leaked database yields no
 *     usable links.
 *   - Tokens are single use, expire in an hour, and issuing one revokes the
 *     account's outstanding ones.
 *   - Both endpoints are rate limited per address and per caller.
 */
export const recovery = new Hono<{ Bindings: Env; Variables: Vars }>()

/**
 * The reply to any recovery request, whether or not anything happened.
 *
 * Returned for a valid account, an unknown address, a disabled account and a
 * rate-limited caller alike. The wording has to be true in all four cases,
 * which is why it promises nothing about delivery.
 */
const UNIFORM = {
  ok: true,
  message: 'If that address has a staff account, we have sent it an email. Check your inbox and spam folder.',
} as const

interface AdminRow {
  id: string
  email: string
  name: string
  status: string
}

/** Looked up case-insensitively, since the login route lowercases too. */
async function findAdminByEmail(db: D1Database, email: string): Promise<AdminRow | null> {
  return db
    .prepare(`SELECT id, email, name, status FROM admins WHERE lower(email) = ?`)
    .bind(email)
    .first<AdminRow>()
}

// ------------------------------------------------------------------ request

recovery.post('/forgot-password', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  const ip = c.req.header('cf-connecting-ip')

  /*
   * Rate limited before the lookup and, on the way through, per address as
   * well as per caller. Without the per-address limit, a botnet spread across
   * many IPs could still flood one person's inbox with reset mail, which is
   * both harassment and a way to bury a real security notice.
   *
   * A limited caller gets the same reply as everyone else. Saying "too many
   * requests" here would tell an attacker their guesses are landing.
   */
  if (
    !email ||
    (await overLimit(c.env, 'forgot_pw_ip', callerKey(c.req.raw), FORGOT_IP_LIMIT)) ||
    (await overLimit(c.env, 'forgot_pw_email', email, FORGOT_ACCOUNT_LIMIT))
  ) {
    return c.json(UNIFORM)
  }

  const admin = await findAdminByEmail(c.env.DB, email)

  /*
   * No account, or a disabled one, ends here with the same reply. A disabled
   * account deliberately cannot be recovered by its holder: re-enabling
   * somebody is an owner's decision, and letting a reset do it silently would
   * undo an offboarding.
   *
   * An invited-but-never-accepted account IS allowed through. The token goes to
   * the address the owner chose, which is the same trust as the invitation
   * itself, and it is the fix for an invite email that never arrived.
   */
  if (!admin || admin.status === 'disabled') {
    if (admin) {
      await audit(c.env.DB, {
        actorType: 'admin', actorId: admin.id, action: 'staff.reset_refused_disabled',
        entityType: 'admin', entityId: admin.id, ip,
      })
    }
    return c.json(UNIFORM)
  }

  const token = await issueResetToken(c.env, { adminId: admin.id, issuedBy: null, ip })
  const link = `${c.env.APP_ORIGIN}/#/staff/reset/${token}`
  const mail = passwordResetEmail({ name: admin.name, link, minutes: RESET_MINUTES })
  const delivery = await sendEmail(c.env, { to: admin.email, ...mail })

  await audit(c.env.DB, {
    actorType: 'admin', actorId: admin.id, action: 'staff.reset_requested',
    entityType: 'admin', entityId: admin.id,
    // Whether the mail actually left is the first thing to check when someone
    // says the email never came, so it is recorded rather than discarded.
    metadata: { emailConfigured: delivery.configured, emailSent: delivery.sent, error: delivery.error },
    ip, userAgent: c.req.header('user-agent'),
  })

  /*
   * Note what is NOT here: the link. Returning it would mean anyone who can
   * post an email address can seize that account. When no mail provider is
   * configured the request still succeeds and simply delivers nothing, and an
   * owner hands over a link from the staff panel instead.
   */
  return c.json(UNIFORM)
})

recovery.post('/forgot-email', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  const ip = c.req.header('cf-connecting-ip')

  if (
    !email ||
    (await overLimit(c.env, 'forgot_email_ip', callerKey(c.req.raw), FORGOT_IP_LIMIT)) ||
    (await overLimit(c.env, 'forgot_email_addr', email, FORGOT_ACCOUNT_LIMIT))
  ) {
    return c.json(UNIFORM)
  }

  const admin = await findAdminByEmail(c.env.DB, email)
  if (admin && admin.status !== 'disabled') {
    const mail = signInEmailReminderEmail({
      name: admin.name,
      email: admin.email,
      link: `${c.env.APP_ORIGIN}/#/admin`,
    })
    const delivery = await sendEmail(c.env, { to: admin.email, ...mail })
    await audit(c.env.DB, {
      actorType: 'admin', actorId: admin.id, action: 'staff.signin_address_reminded',
      entityType: 'admin', entityId: admin.id,
      metadata: { emailConfigured: delivery.configured, emailSent: delivery.sent },
      ip, userAgent: c.req.header('user-agent'),
    })
  }

  return c.json(UNIFORM)
})

// ------------------------------------------------------------------ redeem

async function findReset(db: D1Database, token: string) {
  return db
    .prepare(
      `SELECT r.id, r.admin_id, r.expires_at, r.used_at, r.revoked_at,
              a.email, a.name, a.status
         FROM admin_password_resets r JOIN admins a ON a.id = r.admin_id
        WHERE r.token_hash = ?`,
    )
    .bind(await hashToken(token))
    .first<Record<string, string>>()
}

/** Redeemability is policy, so it lives in recovery-rules.ts and is tested there. */
const usable = isResetUsable

/** Lets the reset screen name the account before asking for a new password. */
recovery.get('/reset/:token', async (c) => {
  const row = await findReset(c.env.DB, c.req.param('token') ?? '')
  if (!usable(row)) return c.json({ error: 'invalid_token' }, 404)
  return c.json({ ok: true, email: row!.email, name: row!.name })
})

recovery.post('/reset/:token', async (c) => {
  const token = c.req.param('token') ?? ''
  const body = (await c.req.json().catch(() => ({}))) as { password?: string }
  const password = body.password ?? ''

  if (password.length < MIN_STAFF_PASSWORD) {
    return c.json(
      {
        error: 'weak_password',
        message: `Staff passwords must be at least ${MIN_STAFF_PASSWORD} characters.`,
      },
      400,
    )
  }

  const row = await findReset(c.env.DB, token)
  if (!usable(row)) return c.json({ error: 'invalid_token' }, 404)

  const salt = randomHex(16)
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS, c.env.SESSION_PEPPER ?? '')
  const now = new Date().toISOString()

  /*
   * One batch, so the account cannot end up with a new password while the token
   * stays live, or the reverse.
   *
   * Three things happen besides setting the hash:
   *
   *   1. failed_login_count and locked_until are cleared. Someone resetting a
   *      password has almost always just locked themselves out guessing, and
   *      leaving the lock in place means a correct new password still fails for
   *      thirty minutes, which reads as the reset having silently failed.
   *
   *   2. An invited account becomes active. A reset completes the same job the
   *      invitation would have, and the token went to the address the owner
   *      chose, so this is the documented fix for an invite that never arrived.
   *      A disabled account never reaches here, guarded by usable() above.
   *
   *   3. Every existing session for the account is revoked. If the reset was
   *      prompted by a suspected compromise, leaving the intruder's session
   *      alive would defeat the point. It also means finishing a reset signs
   *      the person out everywhere, which is the behaviour people expect.
   */
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE admins
          SET password_hash = ?, password_salt = ?, password_iterations = ?,
              failed_login_count = 0, locked_until = NULL,
              status = CASE WHEN status = 'invited' THEN 'active' ELSE status END,
              updated_at = ?
        WHERE id = ?`,
    ).bind(hash, salt, PBKDF2_ITERATIONS, now, row!.admin_id),
    c.env.DB.prepare(`UPDATE admin_password_resets SET used_at = ? WHERE id = ?`).bind(now, row!.id),
    // Any other outstanding token for this account dies with it.
    c.env.DB.prepare(
      `UPDATE admin_password_resets SET revoked_at = ?
        WHERE admin_id = ? AND id != ? AND used_at IS NULL AND revoked_at IS NULL`,
    ).bind(now, row!.admin_id, row!.id),
    c.env.DB.prepare(
      `UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL`,
    ).bind(now, row!.admin_id),
  ])

  await audit(c.env.DB, {
    actorType: 'admin', actorId: row!.admin_id, action: 'staff.password_reset',
    entityType: 'admin', entityId: row!.admin_id, metadata: { email: row!.email },
    ip: c.req.header('cf-connecting-ip'), userAgent: c.req.header('user-agent'),
  })

  return c.json({ ok: true, email: row!.email })
})

// ------------------------------------------------------------------ shared

/**
 * Mints a reset token and returns the plaintext, which is the only moment it
 * exists in readable form. Callers either email it or hand it to an
 * authenticated owner; nothing stores it.
 *
 * Issuing revokes the account's other outstanding tokens, so a second request
 * invalidates the first link rather than leaving several live at once.
 */
export async function issueResetToken(
  env: Env,
  args: { adminId: string; issuedBy: string | null; ip?: string },
): Promise<string> {
  const token = randomHex(32)
  const now = new Date()
  const expires = new Date(now.getTime() + RESET_MINUTES * 60_000).toISOString()

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE admin_password_resets SET revoked_at = ?
        WHERE admin_id = ? AND used_at IS NULL AND revoked_at IS NULL`,
    ).bind(now.toISOString(), args.adminId),
    env.DB.prepare(
      `INSERT INTO admin_password_resets
         (id, admin_id, token_hash, expires_at, issued_by, requested_ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      newId('apr'),
      args.adminId,
      await hashToken(token),
      expires,
      args.issuedBy,
      args.ip ?? null,
      now.toISOString(),
    ),
  ])

  return token
}
