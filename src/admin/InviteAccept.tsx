import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { Logo } from '../components/Logo'

/**
 * Where an invited staff member sets their password.
 *
 * English-only, like the rest of the console. The account cannot be signed into
 * until this succeeds: it holds an unusable placeholder hash until then.
 */
interface InviteInfo {
  email: string
  name: string
  role: string
}

export function InviteAccept() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api
      .get<InviteInfo>(`/invite/${token}`)
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
    setBusy(true); setError(null)
    try {
      await api.post(`/invite/${token}/accept`, { password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? (err.message || 'That invitation is no longer valid.')
                                       : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="grid min-h-dvh place-items-center bg-ink-900 px-5 py-10">
      <div className="w-full max-w-sm rounded-[22px] bg-white p-7">
        <Logo height={26} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )

  if (loading) return shell(<p className="text-[13px] text-ink-400">Checking your invitation…</p>)

  if (!info) {
    return shell(
      <>
        <h1 className="text-[19px] font-extrabold tracking-tight">Invitation not valid</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          This link has expired, been used already, or was withdrawn. Ask whoever
          invited you to send a new one.
        </p>
      </>,
    )
  }

  if (done) {
    return shell(
      <>
        <h1 className="text-[19px] font-extrabold tracking-tight">You are set up</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          Sign in with <span className="font-semibold text-ink-700">{info.email}</span> and the
          password you just chose.
        </p>
        <button onClick={() => navigate('/admin', { replace: true })}
          className="mt-6 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white">
          Go to sign in
        </button>
      </>,
    )
  }

  const field = 'w-full rounded-2xl bg-canvas px-4 py-3 text-[14px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500'

  return shell(
    <form onSubmit={submit}>
      <h1 className="text-[19px] font-extrabold tracking-tight">Welcome, {info.name}</h1>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
        You have been given <span className="font-semibold text-ink-700">{info.role}</span> access
        as <span className="font-semibold text-ink-700">{info.email}</span>. Choose a password to
        finish.
      </p>
      <div className="mt-5 space-y-3">
        <input required type="password" autoComplete="new-password" placeholder="Password, 16+ characters"
               value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        <input required type="password" autoComplete="new-password" placeholder="Repeat password"
               value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
      </div>
      {error ? <p role="alert" className="mt-3 text-[12px] font-medium text-red-600">{error}</p> : null}
      <button type="submit" disabled={busy}
        className="mt-5 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white disabled:opacity-60">
        {busy ? 'Setting up…' : 'Set password'}
      </button>
    </form>,
  )
}
