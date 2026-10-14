import { useCallback, useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Landmark,
} from 'lucide-react'
import { api, money, type AdminUser } from '../lib/api'

type Batch = {
  id: string
  bank_id: string
  status: string
  total_minor: number
  currency: string
  item_count: number
  manifest_hash: string
}
type Key = {
  id: string
  bank_id: string
  label: string
  expires_at: string
  revoked_at: string | null
}
type Screening = {
  id: string
  subject_name: string
  subject_type: string
  provider_ref: string
  status: string
  created_at: string
}
type Transfer = {
  id: string
  reference: string
  first_name: string
  last_name: string
  recipient_name: string
  send_amount_minor: number
  send_currency: string
}
type Overview = {
  testMode: boolean
  providers: { identity: boolean; sanctions: boolean }
  batches: Batch[]
  keys: Key[]
  screenings: Screening[]
  identity: { status: string; count: number }[]
}
const button =
  'rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-brand-600'
const input =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm'
export function CompliancePanel({ admin }: { admin: AdminUser }) {
  const [data, setData] = useState<Overview | null>(null),
    [eligible, setEligible] = useState<Transfer[]>([]),
    [selected, setSelected] = useState<string[]>([])
  const [bankId, setBankId] = useState(''),
    [label, setLabel] = useState(''),
    [token, setToken] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const refresh = useCallback(async () => {
    try {
      const [overview, list] = await Promise.all([
        api.get<Overview>('/admin/compliance/overview'),
        api.get<{ transfers: Transfer[] }>('/admin/compliance/eligible'),
      ])
      setData(overview)
      setEligible(list.transfers)
      setError('')
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to load compliance operations.',
      )
    }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), 30_000)
    return () => clearInterval(timer)
  }, [refresh])
  const act = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.')
    } finally {
      setBusy(false)
    }
  }
  if (!['owner', 'compliance'].includes(admin.role))
    return (
      <p className="rounded-xl bg-white p-6">
        Compliance or owner access is required.
      </p>
    )
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 p-7 text-white sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-white/60">
          XpressTend • Control center
        </p>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Every transfer. Accounted for.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              Identity evidence, sanctions decisions and bank reconciliation in
              one operational workspace.
            </p>
          </div>
          <ShieldCheck size={42} className="text-emerald-300" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-2">
            Test payments • No live wire execution
          </span>
          <span className="rounded-full bg-white/10 px-3 py-2">
            Refreshes every 30 seconds
          </span>
        </div>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-alert-soft p-4 text-sm text-alert"
        >
          {error}
        </p>
      )}
      {!data ? (
        <p role="status">Loading compliance operations…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Identity & liveness',
                ready: data.providers.identity,
                detail: 'Persona • Government ID + live selfie',
                icon: ShieldCheck,
              },
              {
                title: 'Global sanctions',
                ready: data.providers.sanctions,
                detail: 'ComplyAdvantage + existing OFAC controls',
                icon: CheckCircle2,
              },
              {
                title: 'Bank connectivity',
                ready: data.keys.some(
                  (k) => !k.revoked_at && Date.parse(k.expires_at) > Date.now(),
                ),
                detail: 'Scoped API access • Immutable manifests',
                icon: Landmark,
              },
            ].map(({ title, ready, detail, icon: Icon }) => (
              <section
                key={title}
                className="rounded-2xl border border-ink-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <Icon size={21} className="text-brand-700" />
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${ready ? 'bg-ok-soft text-brand-700' : 'bg-wait-soft text-ink-700'}`}
                  >
                    {ready ? 'Configured' : 'Setup required'}
                  </span>
                </div>
                <h2 className="mt-5 font-semibold">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-ink-500">{detail}</p>
              </section>
            ))}
          </div>
          {(!data.providers.identity || !data.providers.sanctions) && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Transfers remain blocked until provider credentials and
              verification policies are configured and validated. “Configured”
              confirms settings, not provider certification.
            </p>
          )}
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Wire sub-ledger</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Every principal contribution reconciles to a single-currency
                  manifest. Fees remain separate.
                </p>
              </div>
              <button
                aria-label="Refresh compliance"
                onClick={() => void refresh()}
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b text-xs text-ink-500">
                  <tr>
                    {[
                      'Batch / bank',
                      'Contributions',
                      'Principal',
                      'Bank decision',
                    ].map((x) => (
                      <th className="pb-3" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.batches.map((b) => (
                    <tr key={b.id} className="border-b border-ink-100">
                      <td className="py-4">
                        <p className="font-medium">{b.id}</p>
                        <p className="mt-1 text-xs text-ink-500">{b.bank_id}</p>
                      </td>
                      <td>{b.item_count}</td>
                      <td>{money(b.total_minor, b.currency)}</td>
                      <td>
                        <span className="rounded-full bg-canvas px-3 py-1 text-xs">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.batches.length && (
                <p className="py-10 text-center text-sm text-ink-500">
                  No wire manifests yet. Select funded transfers below to
                  prepare the first bank review.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Prepare bank review</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="text-xs text-ink-600">
                Bank identifier
                <input
                  className={`${input} mt-2`}
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  placeholder="partner-bank"
                />
              </label>
              <button
                className={`${button} self-end`}
                disabled={busy || !bankId || !selected.length}
                onClick={() =>
                  void act(async () => {
                    await api.post('/admin/compliance/batches', {
                      bankId,
                      transferIds: selected,
                    })
                    setSelected([])
                  })
                }
              >
                Submit {selected.length || ''} for review{' '}
                <ArrowUpRight className="ml-1 inline" size={16} />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {eligible.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-canvas p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(t.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked
                          ? [...s, t.id]
                          : s.filter((id) => id !== t.id),
                      )
                    }
                  />
                  <span className="flex-1">
                    {t.first_name} {t.last_name} → {t.recipient_name}
                    <small className="block text-ink-500">{t.reference}</small>
                  </span>
                  <strong>{money(t.send_amount_minor, t.send_currency)}</strong>
                </label>
              ))}
              {!eligible.length && (
                <p className="text-sm text-ink-500">
                  No funded, unassigned transfers are available.
                </p>
              )}
            </div>
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-ink-200 bg-white p-6">
              <h2 className="text-lg font-semibold">
                Recent screening evidence
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Potential matches stay blocked. Review provider cases before
                repeating screening.
              </p>
              <div className="mt-5 max-h-80 space-y-3 overflow-auto">
                {data.screenings.map((s) => (
                  <div key={s.id} className="rounded-xl bg-canvas p-3">
                    <div className="flex justify-between gap-3 text-sm">
                      <strong>{s.subject_name}</strong>
                      <span>{s.status.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">
                      {s.subject_type} • Case {s.provider_ref ?? 'unavailable'}{' '}
                      • {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {!data.screenings.length && (
                  <p className="text-sm text-ink-500">
                    No provider screening requests recorded.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-ink-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Bank API credentials</h2>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                Keys expire after 90 days. A bank can read only its assigned
                batches and submit its own review decision.
              </p>
              {data.keys.map((k) => (
                <div
                  key={k.id}
                  className="mt-4 flex items-center justify-between gap-3 border-b pb-3 text-sm"
                >
                  <span>
                    {k.label}
                    <small className="block text-ink-500">
                      {k.bank_id} •{' '}
                      {k.revoked_at
                        ? 'Revoked'
                        : `Expires ${new Date(k.expires_at).toLocaleDateString()}`}
                    </small>
                  </span>
                  {admin.role === 'owner' && !k.revoked_at && (
                    <button
                      disabled={busy}
                      className="text-alert"
                      onClick={() =>
                        void act(async () => {
                          await api.post(
                            `/admin/compliance/keys/${k.id}/revoke`,
                          )
                        })
                      }
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
              {admin.role === 'owner' && (
                <form
                  className="mt-5 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void act(async () => {
                      const r = await api.post<{ token: string }>(
                        '/admin/compliance/keys',
                        { bankId, label },
                      )
                      setToken(r.token)
                    })
                  }}
                >
                  <label className="block text-xs">
                    Connection label
                    <input
                      className={`${input} mt-2`}
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      required
                      minLength={3}
                      placeholder="Bank compliance integration"
                    />
                  </label>
                  <p className="text-xs text-ink-500">
                    Uses bank identifier: {bankId || 'Enter above'}
                  </p>
                  <button disabled={busy || !bankId} className={button}>
                    <KeyRound size={15} className="mr-2 inline" />
                    Create scoped key
                  </button>
                </form>
              )}
              {token && (
                <div className="mt-4 rounded-xl bg-wait-soft p-4">
                  <p className="text-xs font-semibold">
                    Copy to the bank’s secure credential store. Shown once.
                  </p>
                  <code className="mt-2 block break-all text-xs">{token}</code>
                  <button
                    className="mt-3 text-xs underline"
                    onClick={() => setToken('')}
                  >
                    Dismiss credential
                  </button>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
