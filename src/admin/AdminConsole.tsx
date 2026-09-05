/**
 * Staff console.
 *
 * Deliberately English-only and outside the customer i18n dictionaries: this
 * is internal tooling for the Seattle back office, and translating it five ways
 * would add maintenance cost with no reader.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, API_BASE, money, type AdminUser } from '../lib/api'
import { StaffPanel } from './StaffPanel'

interface TransferRow {
  id: string; reference: string; status: string
  send_amount_minor: number; send_currency: string; fee_minor: number
  receive_amount_minor: number; receive_currency: string
  created_at: string; user_email: string; first_name: string; last_name: string
  kyc_status: string; recipient_name: string; recipient_country: string
}

interface TrialBalance {
  balanced: boolean
  imbalances: { currency: string; off: number }[]
  accounts: { currency: string; account_code: string; balance_minor: number; entries: number }[]
}

const STATUS_TONE: Record<string, string> = {
  compliance_hold: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  awaiting_payment: 'bg-ink-200 text-ink-700',
}

function Pill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONE[status] ?? 'bg-ink-200 text-ink-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function AdminConsole() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const { admin } = await api.get<{ admin: AdminUser }>('/admin/auth/me')
      setAdmin(admin)
      setNeedsSetup(false)
    } catch {
      setAdmin(null)
      // No session. Offer the setup screen only while the backend says the
      // bootstrap is genuinely open.
      try {
        const { available } = await api.get<{ available: boolean }>('/bootstrap/status')
        setNeedsSetup(available)
      } catch {
        setNeedsSetup(false)
      }
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  if (checking) {
    return <div className="grid min-h-dvh place-items-center bg-ink-900 text-[13px] text-white/60">Checking session…</div>
  }
  if (!admin) return needsSetup ? <AdminSetup onCreated={refresh} /> : <AdminLogin onSignedIn={refresh} />
  return <Dashboard admin={admin} onSignedOut={() => setAdmin(null)} />
}

/**
 * First-run screen for creating the owner account.
 *
 * The setup key is required because /admin is a public URL: without it, whoever
 * loaded this page first would take the account. It is shown only while the
 * backend reports the bootstrap open, and stops appearing the moment an admin
 * exists.
 */
function AdminSetup({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', password: '', secret: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.password.length < 16) {
      setError('Staff passwords must be at least 16 characters.')
      return
    }
    setBusy(true); setError(null)
    try {
      await fetch(`${API_BASE}/bootstrap/admin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-bootstrap-secret': form.secret },
        body: JSON.stringify({ email: form.email, name: form.name, password: form.password }),
      }).then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
          throw new Error(
            body.error === 'not_found'
              ? 'That setup key was not accepted.'
              : body.message ?? body.error ?? 'Could not create the account.',
          )
        }
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-900 px-5">
        <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-7 text-center">
          <h1 className="text-[19px] font-semibold tracking-tight">Account created</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            Sign in with the email and password you just chose. Then remove the
            <code className="mx-1 rounded bg-canvas px-1.5 py-0.5 text-[12px]">ADMIN_BOOTSTRAP_SECRET</code>
            so this screen can never appear again.
          </p>
          <button onClick={onCreated}
            className="mt-6 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white">
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  const field = 'w-full rounded-xl bg-canvas px-4 py-3 text-[14px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500'

  return (
    <div className="grid min-h-dvh place-items-center bg-ink-900 px-5 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-7">
        <h1 className="text-[19px] font-semibold tracking-tight">Create the owner account</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
          This runs once. Nobody else can create it after you.
        </p>
        <div className="mt-6 space-y-3">
          <input required type="email" placeholder="you@xpresstend.com" autoComplete="username"
            value={form.email} onChange={set('email')} className={field} />
          <input required placeholder="Your full name" autoComplete="name"
            value={form.name} onChange={set('name')} className={field} />
          <input required type="password" placeholder="Password, 16+ characters"
            autoComplete="new-password" value={form.password} onChange={set('password')} className={field} />
          <input required type="password" placeholder="Setup key"
            value={form.secret} onChange={set('secret')} className={field} />
          <p className="text-[11px] leading-snug text-ink-500">
            The setup key is the ADMIN_BOOTSTRAP_SECRET set on the Worker. It stops a
            stranger claiming this account before you do.
          </p>
        </div>
        {error ? <p role="alert" className="mt-3 text-[12px] font-medium text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy}
          className="mt-5 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white disabled:opacity-60">
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

function AdminLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await api.post('/admin/auth/login', { email, password })
      onSignedIn()
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'account_locked'
          ? 'Too many attempts. This account is locked for 30 minutes.'
          : 'Those credentials were not accepted.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-ink-900 px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-7">
        <h1 className="text-[19px] font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-1.5 text-[12px] text-ink-500">Authorised personnel only. Sessions last 8 hours.</p>
        <div className="mt-6 space-y-3">
          <input type="email" required placeholder="you@xpresstend.com" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-canvas px-4 py-3 text-[14px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500" />
          <input type="password" required placeholder="Password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-canvas px-4 py-3 text-[14px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500" />
        </div>
        {error ? <p role="alert" className="mt-3 text-[12px] font-medium text-red-600">{error}</p> : null}
        <button type="submit" disabled={busy}
          className="mt-5 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function Dashboard({ admin, onSignedOut }: { admin: AdminUser; onSignedOut: () => void }) {
  const [tab, setTab] = useState<'queue' | 'staff'>('queue')
  const [rows, setRows] = useState<TransferRow[]>([])
  const [filter, setFilter] = useState('compliance_hold')
  const [balance, setBalance] = useState<TrialBalance | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const canDecide = admin.role === 'compliance' || admin.role === 'owner'

  const load = useCallback(async () => {
    const [t, b] = await Promise.all([
      api.get<{ transfers: TransferRow[] }>(`/admin/transfers?status=${encodeURIComponent(filter)}`),
      api.get<TrialBalance>('/admin/ledger/trial-balance'),
    ])
    setRows(t.transfers)
    setBalance(b)
  }, [filter])

  useEffect(() => { void load().catch(() => setNote('Could not load the queue.')) }, [load])

  async function decide(id: string, action: 'approve' | 'reject') {
    const reason = action === 'reject' ? window.prompt('Reason for rejecting this transfer:')?.trim() : undefined
    if (action === 'reject' && !reason) return
    setBusyId(id); setNote(null)
    try {
      await api.post(`/admin/transfers/${id}/${action}`, action === 'reject' ? { reason } : undefined)
      await load()
    } catch (err) {
      setNote(err instanceof ApiError ? `Could not ${action}: ${err.code}` : `Could not ${action}.`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-ink-200/70 bg-ink-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <span className="text-[15px] font-semibold tracking-tight">XpressTend Operations</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
            {admin.role}
          </span>
          <div className="ml-auto flex items-center gap-3 text-[12px]">
            <span className="text-white/60">{admin.email}</span>
            <button onClick={() => api.post('/admin/auth/logout').then(onSignedOut)}
              className="rounded-full bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex gap-2 border-b border-ink-200/70">
          {([['queue', 'Transfers'], ['staff', 'Staff']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-semibold transition ${
                tab === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'staff' ? <StaffPanel me={admin} /> : null}

        {tab === 'queue' ? (
        <>
        {balance ? (
          <div className={`mb-6 rounded-xl px-4 py-3 text-[13px] font-semibold ${
            balance.balanced ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {balance.balanced
              ? 'Ledger balanced — every currency nets to zero.'
              : `LEDGER OUT OF BALANCE: ${balance.imbalances.map((i) => `${i.currency} off by ${i.off}`).join(', ')}`}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {['compliance_hold', 'awaiting_payment', 'completed', 'failed', 'all'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                filter === s ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {note ? <p role="alert" className="mb-4 text-[13px] font-medium text-red-600">{note}</p> : null}

        <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white ring-1 ring-ink-200/70">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="border-b border-ink-200/70 text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3 text-right">Sends</th>
                <th className="px-4 py-3 text-right">Receives</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-500">Nothing in this queue.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b border-ink-200/50 last:border-0">
                  <td className="px-4 py-3 font-semibold tabular-nums">{r.reference}</td>
                  <td className="px-4 py-3">
                    <div>{r.first_name} {r.last_name}</div>
                    <div className="text-[11px] text-ink-500">{r.user_email} · KYC {r.kyc_status}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.recipient_name}</div>
                    <div className="text-[11px] text-ink-500">{r.recipient_country}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(r.send_amount_minor, r.send_currency)}
                    <div className="text-[11px] text-ink-500">+{money(r.fee_minor, r.send_currency)} fee</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {money(r.receive_amount_minor, r.receive_currency)}
                  </td>
                  <td className="px-4 py-3"><Pill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'compliance_hold' && canDecide ? (
                      <div className="flex justify-end gap-2">
                        <button disabled={busyId === r.id} onClick={() => decide(r.id, 'approve')}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50">
                          Release
                        </button>
                        <button disabled={busyId === r.id} onClick={() => decide(r.id, 'reject')}
                          className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-red-600 ring-1 ring-red-200 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    ) : r.status === 'compliance_hold' ? (
                      <span className="text-[11px] text-ink-500">Compliance role required</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        ) : null}
      </main>
    </div>
  )
}
