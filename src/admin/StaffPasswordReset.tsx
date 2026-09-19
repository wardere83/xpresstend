import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { Logo } from '../components/Logo'

/**
 * Where a staff member chooses a new password from a reset link.
 *
 * Deliberately the same shape as InviteAccept: the two are the same act, one
 * for a new account and one for an existing one, and someone who has done one
 * should recognise the other.
 *
 * English-only, like the rest of the console.
 */
interface ResetInfo {
  email: string
  name: string
}

export function StaffPasswordReset() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState<ResetInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api
      .get<ResetInfo>(`/admin/auth/reset/${token}`)
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false))
  }, [token])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    if (password.length < 16) {
      setError('Staff passwords must be at least 16 characters.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.post(`/admin/auth/reset/${token}`, { password })
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message || 'That reset link is no longer valid.'
          : 'Something went wrong.',
      )
    } finally {
      setBusy(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="grid min-h-dvh place-items-center bg-ink-900 px-5 py-10">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-7">
        <Logo height={26} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )

  if (loading) return shell(<p className="text-[13px] text-ink-500">Checking your link…</p>)

  /*
   * One message for every reason a link fails, because the server gives one
   * answer for all of them. Listing the possibilities is more useful than
   * guessing at which applies, and it tells the person what to do next.
   */
  if (!info) {
    return shell(
      <>
        <h1 className="text-[19px] font-semibold tracking-tight">Link not valid</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          Reset links last one hour and work once. This one has expired, been used, or
          was replaced by a newer request.
        </p>
        <button
          onClick={() => navigate('/admin', { replace: true })}
          className="mt-6 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white"
        >
          Start again
        </button>
      </>,
    )
  }

  if (done) {
    return shell(
      <>
        <h1 className="text-[19px] font-semibold tracking-tight">Password changed</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          Sign in with <span className="font-semibold text-ink-700">{info.email}</span> and the
          password you just chose.
        </p>
        {/* Worth saying plainly: a reset ends every session, which is what
            makes it useful after a suspected compromise, and would otherwise
            look like a second fault when another device signs itself out. */}
        <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
          Any other device signed in to this account has been signed out, and the account
          is no longer locked.
        </p>
        <button
          onClick={() => navigate('/admin', { replace: true })}
          className="mt-6 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white"
        >
          Go to sign in
        </button>
      </>,
    )
  }

  const field =
    'w-full rounded-xl bg-canvas px-4 py-3 text-[14px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500'

  return shell(
    <form onSubmit={submit}>
      <h1 className="text-[19px] font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
        For <span className="font-semibold text-ink-700">{info.email}</span>. Staff passwords
        are at least 16 characters.
      </p>
      <div className="mt-5 space-y-3">
        <input
          required
          type="password"
          autoComplete="new-password"
          placeholder="New password, 16+ characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
        <input
          required
          type="password"
          autoComplete="new-password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-[12px] font-medium text-alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>,
  )
}
