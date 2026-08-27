import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { ApiError } from '../lib/api'
import { Logo } from '../components/Logo'
import { JoinMedia } from './JoinMedia'
import { useAuth } from './AuthContext'

function Shell({
  title,
  subtitle,
  children,
  media,
}: {
  title: string
  subtitle: string
  children: ReactNode
  /** Rendered to the right of the form on wide screens. */
  media?: ReactNode
}) {
  const column = (
    <div className="flex w-full max-w-md flex-col justify-center">
      <Link to="/" className="mb-8 flex items-center self-start" aria-label={brand.name}>
        <Logo height={32} />
      </Link>
      <h1 className="text-balance text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  )

  if (!media) {
    return (
      <div className="min-h-dvh bg-canvas">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">{column}</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex justify-center lg:justify-start">{column}</div>
        <div className="h-full min-h-[34rem] py-4">{media}</div>
      </div>
    </div>
  )
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${props.name}`
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-500">{label}</label>
      <input id={id} {...props}
        className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-[14px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500" />
    </div>
  )
}

/** Maps an API failure onto wording a sender can act on. */
function useApiMessage() {
  const t = useT()
  return (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.code === 'invalid_credentials') return t('auth.errInvalid')
      if (err.code === 'account_locked') return t('auth.errLocked')
      if (err.code === 'weak_password') return err.message || t('auth.errWeak')
      if (err.code === 'network_unavailable') return t('auth.errNetwork')
      if (err.message) return err.message
    }
    return t('auth.errGeneric')
  }
}

export function Login() {
  const t = useT()
  const { signIn, user, loading } = useAuth()
  const navigate = useNavigate()
  const toMessage = useApiMessage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(toMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.email')} name="email" type="email" autoComplete="email" required
               value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={t('auth.password')} name="password" type="password" autoComplete="current-password"
               required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p role="alert" className="text-[13px] font-medium text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-brand-600 py-3 text-[14px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
          {busy ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-ink-500">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-brand-600">{t('auth.createAccount')}</Link>
      </p>
    </Shell>
  )
}

export function Register() {
  const t = useT()
  const { register, user, loading } = useAuth()
  const navigate = useNavigate()
  const toMessage = useApiMessage()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/app" replace />

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(form)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(toMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      media={<JoinMedia />}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('auth.firstName')} name="firstName" autoComplete="given-name" required
                 value={form.firstName} onChange={set('firstName')} />
          <Field label={t('auth.lastName')} name="lastName" autoComplete="family-name" required
                 value={form.lastName} onChange={set('lastName')} />
        </div>
        <Field label={t('auth.email')} name="email" type="email" autoComplete="email" required
               value={form.email} onChange={set('email')} />
        <Field label={t('auth.password')} name="password" type="password" autoComplete="new-password"
               required value={form.password} onChange={set('password')} />
        <p className="text-[11px] leading-snug text-ink-400">{t('auth.passwordHint')}</p>
        {error ? <p role="alert" className="text-[13px] font-medium text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-brand-600 py-3 text-[14px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
          {busy ? t('auth.creating') : t('auth.createAccount')}
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-ink-500">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-600">{t('auth.signIn')}</Link>
      </p>
    </Shell>
  )
}

/** Gate for the product routes. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas text-[13px] text-ink-400">
        {'…'}
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
