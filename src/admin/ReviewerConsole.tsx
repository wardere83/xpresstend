import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { SignInFrame } from '../auth/SignInFrame'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, api, money, type AdminUser } from '../lib/api'

type Section = 'consumers' | 'transfers' | 'ledger' | 'audit'

interface ReviewerOverview {
  customers: {
    total: number
    active: number
    verified: number
    internalTestAccounts?: number
  }
  transfers: number
  awaitingReview: number
  volume: { currency: string; sent_minor: number; fees_minor: number }[]
  ledger: { currency: string; balance_minor: number }[]
}

interface ConsumerRow {
  id: string
  email: string
  first_name: string
  last_name: string
  country: string
  status: string
  kyc_status: string
  kyc_tier: number
  created_at: string
  last_login_at: string | null
  transfer_count: number
}

interface TransferRow {
  id: string
  reference: string
  status: string
  send_amount_minor: number
  send_currency: string
  fee_minor: number
  receive_amount_minor: number
  receive_currency: string
  created_at: string
  user_email: string
  first_name: string
  last_name: string
  user_country: string
  kyc_status: string
  recipient_name: string
  recipient_country: string
}

interface LedgerEntry {
  id: string
  transfer_id: string | null
  entry_group: string
  account_code: string
  currency: string
  amount_minor: number
  description: string | null
  created_at: string
  reference: string | null
  user_email: string | null
  first_name: string | null
  last_name: string | null
}

interface AuditEntry {
  id: string
  actor_type: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: string | null
  ip: string | null
  created_at: string
}

interface PageResult {
  page: number
  limit: number
  total: number
}

interface LedgerOverview {
  accounts: { currency: string; account_code: string; balance_minor: number; entries: number }[]
  balanced: boolean
  imbalances: { currency: string; off: number }[]
}

interface Reconciliation {
  unbalancedGroups: { entry_group: string; currency: string; net_minor: number; entries: number }[]
  transfersWithoutEntries: { id: string; reference: string; status: string; created_at: string }[]
  completedWithoutPayout: { id: string; reference: string; created_at: string }[]
}

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'consumers', label: 'Consumers' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'ledger', label: 'Sub-ledger audit' },
  { key: 'audit', label: 'Audit trail' },
]

const inputClass =
  'rounded-xl bg-white px-3.5 py-2.5 text-[13px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500'

function dateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—'
}

function amount(value: number, currency: string) {
  return money(Number(value ?? 0), currency)
}

export function ReviewerConsole() {
  const [reviewer, setReviewer] = useState<AdminUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const { admin } = await api.get<{ admin: AdminUser }>('/admin/auth/reviewer/me')
      setReviewer(admin)
    } catch (err) {
      setReviewer(null)
      if (!(err instanceof ApiError) || (err.status !== 401 && err.status !== 403)) {
        setError('Could not verify your reviewer session. Please retry.')
      }
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (checking) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-900 text-[13px] text-white/60">
        Checking reviewer session…
      </div>
    )
  }
  if (!reviewer) return <ReviewerLogin onSignedIn={refresh} error={error} />
  return <ReviewerDashboard reviewer={reviewer} onSignedOut={() => setReviewer(null)} />
}

function ReviewerLogin({
  onSignedIn,
  error: sessionError,
}: {
  onSignedIn: () => void
  error: string | null
}) {
  const p = useInterfaceCopy()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(sessionError)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post('/admin/auth/reviewer/login', { email, password })
      onSignedIn()
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'account_locked'
          ? 'Too many attempts. This account is locked for 30 minutes.'
          : err instanceof ApiError && err.code === 'network_unavailable'
            ? 'Could not reach the sign-in service. Check your connection and try again.'
            : 'Those reviewer credentials were not accepted.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <SignInFrame>
      <form onSubmit={submit} className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">
          {p('XpressTend \u00b7 independent access')}
        </p>
        <h1 className="mt-2 text-[20px] font-semibold tracking-tight">
          {p('Institutional reviewer sign in')}
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
          {p(
            'Read-only access to consumer, transaction, sub-ledger and audit records. Every review session and data access is logged.',
          )}
        </p>
        <div className="mt-6 space-y-3">
          <label htmlFor="reviewer-login-email">{p('Email')}</label>
          <input
            id="reviewer-login-email"
            type="email"
            required
            placeholder="Reviewer email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass + ' w-full'}
          />
          <label htmlFor="reviewer-login-password">{p('Password')}</label>
          <input
            id="reviewer-login-password"
            type="password"
            required
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass + ' w-full'}
          />
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-[12px] font-medium text-alert">
            {p(error)}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-ink-900 py-3 text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {p(busy ? 'Signing in…' : 'Sign in')}
        </button>
      </form>
    </SignInFrame>
  )
}

function ReviewerDashboard({ reviewer, onSignedOut }: { reviewer: AdminUser; onSignedOut: () => void }) {
  const [section, setSection] = useState<Section>('consumers')
  const [overview, setOverview] = useState<ReviewerOverview | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [consumers, setConsumers] = useState<ConsumerRow[]>([])
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [ledger, setLedger] = useState<LedgerOverview | null>(null)
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null)
  const [selected, setSelected] = useState<{
    transfer: Record<string, unknown>
    events: Record<string, unknown>[]
    postings: Record<string, unknown>[]
  } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<ReviewerOverview>('/admin/reviewer/overview')
      .then(setOverview)
      .catch(() => setError('Could not load the reviewer overview.'))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (section === 'consumers') {
        const params = new URLSearchParams({ page: String(page), q: search, kyc: filter })
        const result = await api.get<{ consumers: ConsumerRow[] } & PageResult>(
          `/admin/reviewer/consumers?${params}`,
        )
        setConsumers(result.consumers)
        setTotal(result.total)
      } else if (section === 'transfers') {
        const params = new URLSearchParams({ page: String(page), q: search, status: filter })
        const result = await api.get<{ transfers: TransferRow[] } & PageResult>(
          `/admin/reviewer/transfers?${params}`,
        )
        setTransfers(result.transfers)
        setTotal(result.total)
      } else if (section === 'ledger') {
        const params = new URLSearchParams({ page: String(page), q: search })
        const [balance, reconcile, result] = await Promise.all([
          api.get<LedgerOverview>('/admin/reviewer/ledger/trial-balance'),
          api.get<Reconciliation>('/admin/reviewer/ledger/reconciliation'),
          api.get<{ entries: LedgerEntry[] } & PageResult>(`/admin/reviewer/ledger/entries?${params}`),
        ])
        setLedger(balance)
        setReconciliation(reconcile)
        setEntries(result.entries)
        setTotal(result.total)
      } else {
        const params = new URLSearchParams({ page: String(page), action: search })
        const result = await api.get<{ entries: AuditEntry[] } & PageResult>(
          `/admin/reviewer/audit?${params}`,
        )
        setAuditEntries(result.entries)
        setTotal(result.total)
      }
    } catch {
      setError('Could not load these records. Please retry.')
    } finally {
      setLoading(false)
    }
  }, [filter, page, search, section])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    api
      .get<{
        transfer: Record<string, unknown>
        events: Record<string, unknown>[]
        postings: Record<string, unknown>[]
      }>(`/admin/reviewer/transfers/${encodeURIComponent(selectedId)}`)
      .then(setSelected)
      .catch(() => setError('Could not load this transfer record.'))
  }, [selectedId])

  function changeSection(next: Section) {
    setSection(next)
    setPage(1)
    setTotal(0)
    setSelectedId(null)
    setSearch('')
    setQuery('')
    setFilter('')
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearch(query.trim())
  }

  const pageCount = Math.max(1, Math.ceil(total / 50))

  async function signOut() {
    try {
      await api.post('/admin/auth/logout')
      onSignedOut()
    } catch {
      setError('Could not sign out. Please retry before leaving this device.')
    }
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-ink-200/70 bg-ink-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold tracking-tight">XpressTend Institutional Review</p>
            <p className="mt-0.5 text-[11px] text-white/60">Read-only access · all queries are audited</p>
          </div>
          <span className="ml-auto text-[12px] text-white/70">
            {reviewer.name} · {reviewer.email}
          </span>
          <button
            onClick={() => void signOut()}
            className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/20"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        {overview ? (
          <section aria-label="Reviewer summary" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                'Consumers',
                overview.customers.total.toLocaleString(),
                `${overview.customers.active.toLocaleString()} active`,
              ],
              ['KYC verified', overview.customers.verified.toLocaleString(), 'Customer records'],
              [
                'Transfers',
                overview.transfers.toLocaleString(),
                `${overview.awaitingReview.toLocaleString()} held for review`,
              ],
              [
                'Ledger currencies',
                overview.ledger.map((row) => row.currency).join(', ') || 'No entries',
                'Current ledger balances',
              ],
            ].map(([label, value, detail]) => (
              <article key={label} className="rounded-xl bg-white p-4 ring-1 ring-ink-200/70">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                <p className="mt-2 truncate text-[22px] font-semibold tabular-nums">{value}</p>
                <p className="mt-1 truncate text-[11px] text-ink-500">{detail}</p>
              </article>
            ))}
            {(overview.customers.internalTestAccounts ?? 0) > 0 ? (
              <p className="col-span-full min-w-0 rounded-xl border border-ink-200 bg-white px-4 py-3 text-[12px] leading-relaxed text-ink-600">
                {(overview.customers.internalTestAccounts ?? 0).toLocaleString()} internal test accounts are excluded from customer totals. The consumer directory retains these records for audit.
              </p>
            ) : null}
          </section>
        ) : null}

        <nav aria-label="Reviewer sections" className="mb-5 flex flex-wrap gap-2 border-b border-ink-200/70">
          {SECTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => changeSection(key)}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold ${
                section === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={section === 'audit' ? 'Filter by exact action' : 'Search records'}
            className={inputClass + ' min-w-48 flex-1'}
          />
          {section === 'consumers' ? (
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
              className={inputClass}
            >
              <option value="">All KYC statuses</option>
              {['unverified', 'pending', 'verified', 'rejected'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ) : null}
          {section === 'transfers' ? (
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
              className={inputClass}
            >
              <option value="">All transfer statuses</option>
              {[
                'draft',
                'awaiting_payment',
                'paid',
                'compliance_hold',
                'sending',
                'completed',
                'failed',
                'cancelled',
                'refunded',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            Search
          </button>
        </form>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-alert-soft px-4 py-3 text-[13px] font-medium text-alert"
          >
            {error}
          </p>
        ) : null}
        {loading ? <p className="mb-3 text-[12px] text-ink-500">Loading audited records…</p> : null}

        {section === 'consumers' ? (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-ink-200/70">
            <table className="w-full min-w-[850px] text-left text-[12px]">
              <thead className="border-b border-ink-200/70 text-[10px] uppercase tracking-wide text-ink-500">
                <tr>
                  {['Consumer', 'Country', 'Status / KYC', 'Transfers', 'Created', 'Last active'].map(
                    (label) => (
                      <th key={label} className="px-4 py-3">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {consumers.map((row) => (
                  <tr key={row.id} className="border-b border-ink-200/50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        {row.first_name} {row.last_name}
                      </div>
                      <div className="text-ink-500">{row.email}</div>
                    </td>
                    <td className="px-4 py-3">{row.country}</td>
                    <td className="px-4 py-3">
                      {row.status}
                      <div className="text-ink-500">
                        {row.kyc_status} · tier {row.kyc_tier}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.transfer_count}</td>
                    <td className="px-4 py-3">{dateTime(row.created_at)}</td>
                    <td className="px-4 py-3">{dateTime(row.last_login_at)}</td>
                  </tr>
                ))}
                {!consumers.length && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                      No consumer records match.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        {section === 'transfers' ? (
          <>
            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-ink-200/70">
              <table className="w-full min-w-[900px] text-left text-[12px]">
                <thead className="border-b border-ink-200/70 text-[10px] uppercase tracking-wide text-ink-500">
                  <tr>
                    {['Reference / sender', 'Recipient', 'Send', 'Receive', 'Status', 'Created'].map(
                      (label) => (
                        <th key={label} className="px-4 py-3">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((row) => (
                    <tr key={row.id} className="border-b border-ink-200/50 last:border-0">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedId(row.id)}
                          className="font-semibold text-brand-700 underline"
                        >
                          {row.reference}
                        </button>
                        <div>
                          {row.first_name} {row.last_name} · {row.user_email}
                        </div>
                        <div className="text-ink-500">KYC {row.kyc_status}</div>
                      </td>
                      <td className="px-4 py-3">
                        {row.recipient_name}
                        <div className="text-ink-500">{row.recipient_country}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {amount(row.send_amount_minor, row.send_currency)}
                        <div className="text-ink-500">Fee {amount(row.fee_minor, row.send_currency)}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {amount(row.receive_amount_minor, row.receive_currency)}
                      </td>
                      <td className="px-4 py-3">{row.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">{dateTime(row.created_at)}</td>
                    </tr>
                  ))}
                  {!transfers.length && !loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                        No transfers match.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {selected ? (
              <section className="mt-4 rounded-xl bg-white p-5 ring-1 ring-ink-200/70">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[14px] font-bold">
                    Transfer {String(selected.transfer.reference ?? selectedId)}
                  </h2>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-[12px] font-semibold text-ink-500"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-ink-500">
                  {String(selected.transfer.status)} · {String(selected.transfer.user_email)}
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <RecordList title="State history" rows={selected.events} />
                  <RecordList title="Ledger postings" rows={selected.postings} />
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {section === 'ledger' ? (
          <>
            {ledger ? (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-[13px] font-semibold ${ledger.balanced ? 'bg-ok-soft text-brand-700' : 'bg-alert-soft text-alert'}`}
              >
                {ledger.balanced
                  ? 'Trial balance: balanced across all currencies.'
                  : `Trial balance exceptions: ${ledger.imbalances.map(({ currency, off }) => `${currency} off by ${off}`).join(', ')}`}
              </div>
            ) : null}
            {reconciliation ? (
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Unbalanced posting groups', reconciliation.unbalancedGroups.length],
                  ['Paid transfers without ledger entries', reconciliation.transfersWithoutEntries.length],
                  [
                    'Completed transfers without payout posting',
                    reconciliation.completedWithoutPayout.length,
                  ],
                ].map(([label, count]) => (
                  <article key={label} className="rounded-xl bg-white p-4 ring-1 ring-ink-200/70">
                    <p className="text-[11px] text-ink-500">{label}</p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">{count}</p>
                  </article>
                ))}
              </div>
            ) : null}
            <div className="mb-5 overflow-x-auto rounded-xl bg-white ring-1 ring-ink-200/70">
              <table className="w-full min-w-[500px] text-left text-[12px]">
                <thead className="border-b border-ink-200/70 text-[10px] uppercase tracking-wide text-ink-500">
                  <tr>
                    {['Currency', 'Account', 'Net balance', 'Entries'].map((label) => (
                      <th key={label} className="px-4 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger?.accounts.map((row) => (
                    <tr
                      key={`${row.currency}-${row.account_code}`}
                      className="border-b border-ink-200/50 last:border-0"
                    >
                      <td className="px-4 py-3">{row.currency}</td>
                      <td className="px-4 py-3">{row.account_code}</td>
                      <td className="px-4 py-3 tabular-nums">{amount(row.balance_minor, row.currency)}</td>
                      <td className="px-4 py-3 tabular-nums">{row.entries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reconciliation &&
            (reconciliation.unbalancedGroups.length ||
              reconciliation.transfersWithoutEntries.length ||
              reconciliation.completedWithoutPayout.length) ? (
              <div className="mb-5 rounded-xl bg-white p-4 ring-1 ring-ink-200/70">
                <h2 className="text-[13px] font-bold">Reconciliation exceptions</h2>
                <RecordList title="Unbalanced groups" rows={reconciliation.unbalancedGroups} />
                <RecordList
                  title="Paid transfers without postings"
                  rows={reconciliation.transfersWithoutEntries}
                />
                <RecordList
                  title="Completed without payout postings"
                  rows={reconciliation.completedWithoutPayout}
                />
              </div>
            ) : null}
            <h2 className="mb-2 text-[13px] font-bold">Ledger entries</h2>
            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-ink-200/70">
              <table className="w-full min-w-[850px] text-left text-[12px]">
                <thead className="border-b border-ink-200/70 text-[10px] uppercase tracking-wide text-ink-500">
                  <tr>
                    {['Date', 'Group / reference', 'Account', 'Currency', 'Signed amount', 'Description'].map(
                      (label) => (
                        <th key={label} className="px-4 py-3">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <tr key={row.id} className="border-b border-ink-200/50 last:border-0">
                      <td className="px-4 py-3">{dateTime(row.created_at)}</td>
                      <td className="px-4 py-3">{row.reference ?? row.entry_group}</td>
                      <td className="px-4 py-3">{row.account_code}</td>
                      <td className="px-4 py-3">{row.currency}</td>
                      <td className="px-4 py-3 tabular-nums">{amount(row.amount_minor, row.currency)}</td>
                      <td className="px-4 py-3">{row.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {section === 'audit' ? (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-ink-200/70">
            <table className="w-full min-w-[900px] text-left text-[12px]">
              <thead className="border-b border-ink-200/70 text-[10px] uppercase tracking-wide text-ink-500">
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Metadata', 'Source IP'].map((label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((row) => (
                  <tr key={row.id} className="border-b border-ink-200/50 last:border-0">
                    <td className="px-4 py-3">{dateTime(row.created_at)}</td>
                    <td className="px-4 py-3">
                      {row.actor_type}
                      <div className="text-ink-500">{row.actor_id ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{row.action}</td>
                    <td className="px-4 py-3">
                      {row.entity_type ?? '—'}
                      <div className="text-ink-500">{row.entity_id ?? ''}</div>
                    </td>
                    <td className="max-w-64 truncate px-4 py-3" title={row.metadata ?? ''}>
                      {row.metadata ?? '—'}
                    </td>
                    <td className="px-4 py-3">{row.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between text-[12px] text-ink-500">
          <span>
            {total.toLocaleString()} records · page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-ink-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pageCount || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-ink-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function RecordList({ title, rows }: { title: string; rows: object[] }) {
  if (!rows.length) return null
  return (
    <div className="mt-3">
      <h3 className="text-[11px] font-semibold text-ink-700">{title}</h3>
      <ul className="mt-1 space-y-1">
        {rows.map((row, index) => (
          <li key={index} className="break-all text-[11px] text-ink-500">
            {Object.entries(row)
              .map(([key, value]) => `${key}: ${String(value ?? '—')}`)
              .join(' · ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
