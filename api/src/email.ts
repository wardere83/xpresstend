import type { Env } from './env'

/**
 * Transactional email.
 *
 * The domain has no mail infrastructure yet, so this degrades rather than
 * fails: with no provider configured, `send` reports `configured: false` and
 * the caller falls back to handing the owner a link to pass on themselves.
 * That keeps staff invites working today and starts sending real mail the
 * moment a key exists, with no code change.
 *
 * Resend is the implementation because it needs one API key and one DNS
 * verification. Swapping providers means changing this file alone.
 */
export interface SendResult {
  configured: boolean
  sent: boolean
  error?: string
}

export async function sendEmail(
  env: Env,
  msg: { to: string; subject: string; text: string; html?: string },
): Promise<SendResult> {
  const key = env.RESEND_API_KEY
  const from = env.EMAIL_FROM
  if (!key || !from) return { configured: false, sent: false }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      // Never surface the provider's response to the caller; it can echo the key.
      console.error('email send failed', res.status, detail.slice(0, 300))
      return { configured: true, sent: false, error: `provider_${res.status}` }
    }
    return { configured: true, sent: true }
  } catch (err) {
    console.error('email send threw', err)
    return { configured: true, sent: false, error: 'network' }
  }
}

/** Plain text and HTML for a staff invitation. */
export function staffInviteEmail(args: { name: string; inviterName: string; link: string; hours: number }) {
  const { name, inviterName, link, hours } = args
  return {
    subject: 'Your XpressTend staff account',
    text: [
      `Hi ${name},`,
      '',
      `${inviterName} has given you access to the XpressTend operations console.`,
      '',
      'Set your password here:',
      link,
      '',
      `This link expires in ${hours} hours and can only be used once.`,
      'If you were not expecting this, you can ignore it.',
    ].join('\n'),
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:520px;color:#14121f">
        <p style="font-size:15px">Hi ${escapeHtml(name)},</p>
        <p style="font-size:15px;line-height:1.6">
          ${escapeHtml(inviterName)} has given you access to the XpressTend operations console.
        </p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(link)}"
             style="background:#074FDF;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
            Set your password
          </a>
        </p>
        <p style="font-size:12px;color:#6b6880;line-height:1.6">
          This link expires in ${hours} hours and can only be used once.
          If you were not expecting this, you can ignore it.
        </p>
      </div>`,
  }
}

/** Plain text and HTML for a staff password reset. */
export function passwordResetEmail(args: { name: string; link: string; minutes: number }) {
  const { name, link, minutes } = args
  return {
    subject: 'Reset your XpressTend staff password',
    text: [
      `Hi ${name},`,
      '',
      'Someone asked to reset the password on your XpressTend operations console account.',
      '',
      'Choose a new password here:',
      link,
      '',
      `This link expires in ${minutes} minutes and can only be used once.`,
      '',
      'If you did not ask for this, you can ignore this email. Your password has',
      'not changed and nobody can use this link without opening it themselves.',
    ].join('\n'),
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:520px;color:#18313B">
        <p style="font-size:15px">Hi ${escapeHtml(name)},</p>
        <p style="font-size:15px;line-height:1.6">
          Someone asked to reset the password on your XpressTend operations console account.
        </p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(link)}"
             style="background:#0B252F;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Choose a new password
          </a>
        </p>
        <p style="font-size:12px;color:#627780;line-height:1.6">
          This link expires in ${minutes} minutes and can only be used once.
          If you did not ask for this you can ignore this email: your password has not
          changed, and nobody can use this link without opening it themselves.
        </p>
      </div>`,
  }
}

/**
 * Confirms which address an account is under.
 *
 * Note what this deliberately cannot do: it cannot tell someone an address they
 * do not already have, because it can only be delivered to the address itself.
 * That is the point. An endpoint that reveals account addresses is an account
 * enumeration tool. This exists so that someone who is unsure which of their
 * addresses they registered can try each one and get a reply on the right one.
 */
export function signInEmailReminderEmail(args: { name: string; email: string; link: string }) {
  const { name, email, link } = args
  return {
    subject: 'Your XpressTend staff sign-in address',
    text: [
      `Hi ${name},`,
      '',
      'You asked which address your XpressTend operations console account uses.',
      '',
      `It is: ${email}`,
      '',
      `Sign in here: ${link}`,
      '',
      'If you did not ask for this, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:520px;color:#18313B">
        <p style="font-size:15px">Hi ${escapeHtml(name)},</p>
        <p style="font-size:15px;line-height:1.6">
          You asked which address your XpressTend operations console account uses.
        </p>
        <p style="font-size:17px;font-weight:600;margin:20px 0">${escapeHtml(email)}</p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(link)}"
             style="background:#0B252F;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Sign in
          </a>
        </p>
        <p style="font-size:12px;color:#627780;line-height:1.6">
          If you did not ask for this, you can ignore this email.
        </p>
      </div>`,
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string)
}
