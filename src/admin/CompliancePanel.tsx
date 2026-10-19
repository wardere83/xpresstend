import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
type Key = { id: string; bank_id: string; label: string; expires_at: string; revoked_at: string | null }
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
  screenings: {
    id: string
    subject_name: string
    subject_type: string
    provider_ref: string
    status: string
    created_at: string
  }[]
  identity: { status: string; count: number }[]
}
type Readiness = {
  checkedAt: string
  bankApi: { available: boolean; activeConnections: number; banks: string[]; mode: string; basePath: string }
  identity: { provider: string; configured: boolean }
  globalSanctions: { provider: string; configured: boolean }
  ofac: {
    ready: boolean
    reason: string | null
    checkedAt: string | null
    entityCount: number
    nameCount: number
  }
}
export type ComplianceSection = 'readiness' | 'review' | 'evidence' | 'connections'
export interface ComplianceRefreshHandle {
  refresh: () => Promise<void>
  getLatest: () => Promise<void> | null
}
const button = 'rounded-full bg-ink-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40'
const input = 'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm'

export function CompliancePanel({
  admin,
  sectionRequest,
  onRegisterRefresh,
  onRefreshingChange,
}: {
  admin: AdminUser
  sectionRequest?: { section: ComplianceSection; request: number }
  onRegisterRefresh?: (handle: ComplianceRefreshHandle | null) => void
  onRefreshingChange?: (refreshing: boolean) => void
}) {
  const [section, setSection] = useState<ComplianceSection>('readiness')
  const [data, setData] = useState<Overview | null>(null)
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const [eligible, setEligible] = useState<Transfer[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [bankId, setBankId] = useState('')
  const [label, setLabel] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const refreshRequest = useRef(0)
  const latestRefresh = useRef<Promise<void> | null>(null)
  const mounted = useRef(true)
  const allowed = ['owner', 'compliance'].includes(admin.role)
  const performRefresh = useCallback(async () => {
    const request = ++refreshRequest.current
    onRefreshingChange?.(true)
    try {
      const [overview, list, status] = await Promise.allSettled([
        api.get<Overview>('/admin/compliance/overview', { timeoutMs: 15_000 }),
        api.get<{ transfers: Transfer[] }>('/admin/compliance/eligible', { timeoutMs: 15_000 }),
        api.get<Readiness>('/admin/compliance/readiness', { timeoutMs: 15_000 }),
      ])
      if (!mounted.current || request !== refreshRequest.current) return
      setReadiness(status.status === 'fulfilled' ? status.value : null)
      if (overview.status === 'rejected') throw overview.reason
      if (list.status === 'rejected') throw list.reason
      setData(overview.value)
      setEligible(list.value.transfers)
      setSelected((previous) => previous.filter((id) => list.value.transfers.some((transfer) => transfer.id === id)))
      if (status.status === 'rejected') throw new Error('Could not refresh environment readiness. Please retry.')
      setError('')
    } catch (error) {
      if (mounted.current && request === refreshRequest.current)
        setError(error instanceof Error ? error.message : 'Unable to load compliance.')
      throw error
    } finally {
      if (mounted.current && request === refreshRequest.current) onRefreshingChange?.(false)
    }
  }, [onRefreshingChange])
  const refresh = useCallback(() => {
    const task = performRefresh()
    latestRefresh.current = task
    return task
  }, [performRefresh])
  const invalidateRefresh = useCallback(() => {
    refreshRequest.current++
  }, [])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      invalidateRefresh()
      onRefreshingChange?.(false)
    }
  }, [onRefreshingChange, invalidateRefresh])
  useEffect(() => {
    if (!allowed) return
    onRegisterRefresh?.({ refresh, getLatest: () => latestRefresh.current })
    return () => onRegisterRefresh?.(null)
  }, [allowed, refresh, onRegisterRefresh])
  useEffect(() => {
    if (!allowed) return
    const update = () => {
      if (!document.hidden)
        void refresh().catch(() => undefined)
    }
    update()
    const timer = window.setInterval(update, 30_000)
    return () => window.clearInterval(timer)
  }, [allowed, refresh])
  useEffect(() => {
    if (sectionRequest) setSection(sectionRequest.section)
  }, [sectionRequest])
  async function act(fn: () => Promise<void>, noticeAfterRefresh?: string) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
      await refresh()
      if (noticeAfterRefresh) setNotice(noticeAfterRefresh)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Request failed. Please retry.')
    } finally {
      setBusy(false)
    }
  }
  if (!allowed) return <p className="rounded-xl bg-white p-6">Compliance or owner access is required.</p>
  const activeKeys =
    data?.keys.filter((key) => !key.revoked_at && Date.parse(key.expires_at) > Date.now()) ?? []
  const banks = readiness?.bankApi.banks ?? []
  const activeConnectionCount = readiness?.bankApi.activeConnections ?? activeKeys.length
  return (
    <div className="compliance-workspace">
      <div className="compliance-heading">
        <div>
          <h2>Every transfer. Accounted for.</h2>
          <p>Identity evidence, sanctions controls and partner-bank review.</p>
        </div>
      </div>
      <nav className="compliance-tabs" aria-label="Compliance workspace">
        {(
          [
            ['readiness', 'Verification'],
            ['review', 'Bank review'],
            ['evidence', 'Evidence'],
            ['connections', 'Connections & API'],
          ] as const
        ).map(([key, title]) => (
          <button
            key={key}
            aria-current={section === key ? 'page' : undefined}
            onClick={() => setSection(key)}
          >
            {title}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="bank-notice">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="bank-notice">
          {notice}
        </p>
      )}
      {!data ? (
        <p role="status">Loading compliance operations…</p>
      ) : (
        <>
          {section === 'readiness' && (
            <>
              <div className="connection-cards">
                {[
                  {
                    title: 'Identity & liveness',
                    status: data.providers.identity ? 'Configured' : 'Setup required',
                    detail: 'Government ID + live selfie; server-verified provider evidence.',
                    body: 'The Persona adapter is ready. Production verification requires an approved inquiry template and privately configured credentials.',
                    action: 'View identity setup',
                    target: 'connections' as const,
                  },
                  {
                    title: 'Global sanctions',
                    status: data.providers.sanctions ? 'Configured' : 'Setup required',
                    detail: readiness?.ofac.ready
                      ? `OFAC live · ${readiness.ofac.entityCount.toLocaleString()} entities`
                      : 'Official OFAC dataset and global provider controls.',
                    body: 'OFAC and global screening are separate checks. Missing global-provider settings or unresolved matches continue to block release.',
                    action: 'View screening evidence',
                    target: 'evidence' as const,
                  },
                  {
                    title: 'Bank connectivity',
                    status: activeConnectionCount ? 'Configured' : 'Setup required',
                    detail: `${activeConnectionCount} active scoped connection${activeConnectionCount === 1 ? '' : 's'}.`,
                    body: 'The bank review API accepts assigned manifests and hash-bound decisions. A connection does not enable live wire execution.',
                    action: 'Manage bank connections',
                    target: 'connections' as const,
                  },
                ].map((card) => (
                  <article key={card.title} className="connection-card">
                    <span className="connection-status">{card.status}</span>
                    <h3>{card.title}</h3>
                    <strong>{card.detail}</strong>
                    <p>{card.body}</p>
                    <button onClick={() => setSection(card.target)}>{card.action} ↗</button>
                  </article>
                ))}
              </div>
              <div className="connection-summary">
                <p>
                  <strong>Review environment.</strong> Test payments • No live wire execution
                </p>
                <p>
                  Configured confirms settings, not a completed provider acceptance test. Last environment
                  check:{' '}
                  {readiness
                    ? new Date(readiness.checkedAt).toLocaleTimeString()
                    : 'Unavailable — refresh to retry'}
                  .
                </p>
                <button className={button} onClick={() => setSection('review')}>
                  Prepare a bank review
                </button>
                <Link className="connection-link" to="/bank-review">
                  Open partner bank portal ↗
                </Link>
              </div>
            </>
          )}
          {section === 'review' && (
            <div className="compliance-review-columns">
              <section className="connection-panel">
                <div className="bank-section-title">
                  <h3>Prepare bank review</h3>
                  <Link to="/bank-review">Bank portal ↗</Link>
                </div>
                <p className="bank-help">
                  Select funded contributions in one currency. Screening and exact reconciliation are checked
                  on the server.
                </p>
                <label className="connection-label">
                  Bank identifier
                  <select
                    aria-label="Review bank identifier"
                    className={input}
                    value={bankId}
                    onChange={(event) => setBankId(event.target.value)}
                  >
                    <option value="">Choose an active connection</option>
                    {banks.map((bank) => (
                      <option key={bank}>{bank}</option>
                    ))}
                  </select>
                </label>
                {!banks.length && (
                  <button className="connection-link" onClick={() => setSection('connections')}>
                    Set up a scoped connection first
                  </button>
                )}
                <div className="connection-transfer-list">
                  {eligible.map((transfer) => (
                    <div key={transfer.id} className="connection-transfer">
                      <label>
                        <input
                          type="checkbox"
                          checked={selected.includes(transfer.id)}
                          onChange={(event) =>
                            setSelected((previous) =>
                              event.target.checked
                                ? [...previous, transfer.id]
                                : previous.filter((id) => id !== transfer.id),
                            )
                          }
                        />
                        <span>
                          {transfer.first_name} {transfer.last_name} → {transfer.recipient_name}
                          <small>
                            {transfer.reference} · {money(transfer.send_amount_minor, transfer.send_currency)}
                          </small>
                        </span>
                      </label>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await api.post(`/admin/transfers/${transfer.id}/screen`)
                            setNotice(`Screening refreshed for ${transfer.reference}.`)
                          })
                        }
                      >
                        Screen now
                      </button>
                    </div>
                  ))}
                  {!eligible.length && (
                    <p className="bank-help">No funded, unassigned transfers are available.</p>
                  )}
                </div>
                <button
                  className={button}
                  disabled={busy || !banks.includes(bankId) || !selected.length}
                  onClick={() =>
                    void act(async () => {
                      const result = await api.post<{ id: string }>('/admin/compliance/batches', {
                        bankId,
                        transferIds: selected,
                      })
                      setSelected([])
                      setNotice(`Batch ${result.id} submitted to the assigned bank’s review API.`)
                    })
                  }
                >
                  Submit {selected.length || ''} for review
                </button>
              </section>
              <section className="connection-panel">
                <h3>Wire sub-ledger</h3>
                <p className="bank-help">
                  Principal contributions reconcile to an immutable manifest. Fees remain separate.
                </p>
                <div className="bank-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Batch / bank</th>
                        <th>Items</th>
                        <th>Principal</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.batches.map((batch) => (
                        <tr key={batch.id}>
                          <td>
                            {batch.id}
                            <small>{batch.bank_id}</small>
                          </td>
                          <td>{batch.item_count}</td>
                          <td>{money(batch.total_minor, batch.currency)}</td>
                          <td>{batch.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!data.batches.length && <p className="bank-help">No wire manifests yet.</p>}
              </section>
            </div>
          )}
          {section === 'evidence' && (
            <div className="compliance-review-columns">
              <section className="connection-panel">
                <h3>Official OFAC source</h3>
                <p className="bank-help">
                  {readiness?.ofac.ready
                    ? `${readiness.ofac.entityCount.toLocaleString()} entities and ${readiness.ofac.nameCount.toLocaleString()} names available. Last checked ${readiness.ofac.checkedAt ? new Date(readiness.ofac.checkedAt).toLocaleString() : 'Unavailable'}.`
                    : `Source readiness: ${readiness?.ofac.reason ?? 'Unavailable; refresh environment to retry'}.`}
                </p>
                <h3>Identity outcomes</h3>
                {data.identity.length ? (
                  data.identity.map((row) => (
                    <p key={row.status} className="bank-help">
                      {row.status} · {row.count}
                    </p>
                  ))
                ) : (
                  <p className="bank-help">No identity provider sessions recorded.</p>
                )}
              </section>
              <section className="connection-panel">
                <h3>Recent screening evidence</h3>
                <p className="bank-help">
                  Potential matches stay blocked. Refresh individual transfer screening before bank
                  submission.
                </p>
                {data.screenings.map((record) => (
                  <article key={record.id} className="connection-evidence">
                    <strong>{record.subject_name}</strong>
                    <span>{record.status.replaceAll('_', ' ')}</span>
                    <p>
                      {record.subject_type} · Case {record.provider_ref ?? 'Unavailable'} ·{' '}
                      {new Date(record.created_at).toLocaleString()}
                    </p>
                  </article>
                ))}
                {!data.screenings.length && (
                  <p className="bank-help">No provider screening requests recorded.</p>
                )}
              </section>
            </div>
          )}
          {section === 'connections' && (
            <div className="compliance-review-columns">
              <section className="connection-panel">
                <h3>Verification adapters</h3>
                <p className="bank-help">
                  Credentials belong in encrypted Worker settings, never in this form or browser storage.
                </p>
                <dl className="connection-settings">
                  <div>
                    <dt>Identity & liveness</dt>
                    <dd>
                      Persona ·{' '}
                      {data.providers.identity ? 'Configured' : 'Awaiting credentials and approved template'}
                    </dd>
                  </div>
                  <div>
                    <dt>Required identity settings</dt>
                    <dd>
                      <code>PERSONA_API_KEY</code>, <code>PERSONA_TEMPLATE_ID</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Global screening</dt>
                    <dd>
                      ComplyAdvantage · {data.providers.sanctions ? 'Configured' : 'Awaiting credentials'}
                    </dd>
                  </div>
                  <div>
                    <dt>Required screening setting</dt>
                    <dd>
                      <code>COMPLYADVANTAGE_API_KEY</code>
                    </dd>
                  </div>
                </dl>
                <p className="bank-help">
                  Government-ID authenticity, matching account names, live selfie and selfie-to-ID comparison
                  are required. Unavailable providers fail closed.
                </p>
                <h3>Bank API contract</h3>
                <code className="connection-endpoint">
                  GET /api/bank/v1/batches
                  <br />
                  GET /api/bank/v1/batches/:id
                  <br />
                  POST /api/bank/v1/batches/:id/decision
                </code>
                <p className="bank-help">
                  Bearer key authentication; bank-scoped manifests; hash-bound decisions; five-minute
                  approvals. Review-only, with no wire execution.
                </p>
                <Link className="connection-link" to="/bank-review">
                  Open operational bank review portal ↗
                </Link>
              </section>
              <section className="connection-panel">
                <h3>Bank API credentials</h3>
                <p className="bank-help">
                  Keys are shown once, expire after 90 days and only access the assigned bank. Hand them over
                  privately.
                </p>
                {data.keys.map((key) => (
                  <div key={key.id} className="connection-key">
                    <span>
                      <strong>{key.label}</strong>
                      <small>
                        {key.bank_id} ·{' '}
                        {key.revoked_at
                          ? 'Revoked'
                          : `Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                      </small>
                    </span>
                    {admin.role === 'owner' && !key.revoked_at && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await api.post(`/admin/compliance/keys/${key.id}/revoke`)
                            setNotice('Bank key revoked.')
                          })
                        }
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
                {admin.role === 'owner' ? (
                  <form
                    className="connection-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void act(async () => {
                        const result = await api.post<{ token: string }>('/admin/compliance/keys', {
                          bankId,
                          label,
                        })
                        setToken(result.token)
                        setLabel('')
                      })
                    }}
                  >
                    <label>
                      Bank identifier
                      <input
                        className={input}
                        required
                        pattern="[a-z0-9_-]{3,64}"
                        value={bankId}
                        onChange={(event) => setBankId(event.target.value)}
                        placeholder="partner-bank"
                      />
                    </label>
                    <label>
                      Connection label
                      <input
                        className={input}
                        required
                        minLength={3}
                        maxLength={100}
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="Bank compliance integration"
                      />
                    </label>
                    <button className={button} disabled={busy}>
                      Create scoped key
                    </button>
                  </form>
                ) : (
                  <p className="bank-help">An owner must issue or revoke bank credentials.</p>
                )}
                {token && (
                  <div className="bank-notice">
                    <p>Copy this once to the bank’s secure credential store.</p>
                    <code className="bank-hash">{token}</code>
                    <button onClick={() => setToken('')}>Dismiss credential</button>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
