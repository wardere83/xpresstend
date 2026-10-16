import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { API_BASE, money } from '../lib/api'
import './staff-console.css'

type Batch = {
  id: string
  bank_id: string
  currency: string
  total_minor: number
  item_count: number
  status: string
  manifest_hash: string
}
type Item = {
  id: string
  reference: string
  first_name: string
  last_name: string
  recipient_name: string
  send_amount_minor: number
  send_currency: string
  fee_minor: number
}
type Detail = {
  batch: Batch
  manifestCanonical: string
  manifest: {
    batchId: string
    bankId: string
    currency: string
    totalMinor: number
    items: Item[]
  }
  ledger: unknown[]
  screenings: {
    id: string
    subject_name: string
    status: string
    provider: string
  }[]
  testMode: boolean
}

/** Bank credentials stay in memory, never in a URL, cookie, storage or telemetry. */
export function BankReview() {
  const [draftKey, setDraftKey] = useState('')
  const [key, setKey] = useState('')
  const [batches, setBatches] = useState<Batch[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [verified, setVerified] = useState(false)
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const paginated = useRef(false)
  function disconnect() {
    setBusy(false)
    generation.current++
    setKey('')
    setDraftKey('')
    setBatches([])
    setDetail(null)
    setVerified(false)
    setReference('')
    setReason('')
    setCursor(null)
    paginated.current = false
    setMessage('')
  }
  const request = useCallback(
    async <T,>(path: string, body?: unknown): Promise<T> => {
      const requestGeneration = generation.current
      const response = await fetch(`${API_BASE}/bank/v1${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Bearer ${key}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      if (response.status === 401) {
        if (requestGeneration === generation.current) {
          disconnect()
          setError(
            'The bank key is invalid, expired or revoked. Connect again with a valid key.',
          )
        }
        throw new Error(
          'The bank key is invalid, expired or revoked. Connect again with a valid key.',
        )
      }
      if (response.status === 429)
        throw new Error(
          'Request limit reached. Wait a minute before trying again.',
        )
      if (!response.ok)
        throw new Error(
          response.status === 409
            ? 'The batch or decision changed. Refresh the manifest and review it again.'
            : 'The bank API request failed. No payment has been executed.',
        )
      return response.json() as Promise<T>
    },
    [key],
  )
  const load = useCallback(
    async (after?: string, preserve = false) => {
      const current = generation.current
      const result = await request<{
        batches: Batch[]
        nextCursor: string | null
      }>(`/batches${after ? `?after=${encodeURIComponent(after)}` : ''}`)
      if (current !== generation.current) return
      setBatches((previous) =>
        after
          ? [
              ...previous,
              ...result.batches.filter(
                (row) => !previous.some((old) => old.id === row.id),
              ),
            ]
          : preserve
            ? [
                ...result.batches,
                ...previous.filter(
                  (row) => !result.batches.some((fresh) => fresh.id === row.id),
                ),
              ]
            : result.batches,
      )
      if (after) paginated.current = true
      if (!preserve || !paginated.current) setCursor(result.nextCursor)
      if (!after && !preserve) paginated.current = false
    },
    [request],
  )
  useEffect(() => {
    if (!key) return
    const refresh = () => {
      const current = generation.current
      if (!document.hidden)
        void load(undefined, true).catch((error) => {
          if (current === generation.current) setError(error.message)
        })
    }
    refresh()
    const timer = window.setInterval(refresh, 30_000)
    return () => window.clearInterval(timer)
  }, [key, load])
  async function open(batch: Batch) {
    const current = ++generation.current
    setBusy(true)
    setError('')
    setMessage('')
    setDetail(null)
    setVerified(false)
    setReference('')
    setReason('')
    try {
      const result = await request<Detail>(
        `/batches/${encodeURIComponent(batch.id)}`,
      )
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(result.manifestCanonical),
      )
      const hash = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
      const manifest = JSON.parse(
        result.manifestCanonical,
      ) as Detail['manifest']
      if (
        !Array.isArray(manifest.items) ||
        !Array.isArray(result.ledger) ||
        !Array.isArray(result.screenings)
      )
        throw new Error(
          'The manifest response is incomplete. Decisions remain blocked.',
        )
      const total = manifest.items.reduce(
        (sum, item) => sum + item.send_amount_minor,
        0,
      )
      if (
        hash !== result.batch.manifest_hash ||
        manifest.batchId !== batch.id ||
        manifest.bankId !== result.batch.bank_id ||
        manifest.currency !== result.batch.currency ||
        manifest.totalMinor !== result.batch.total_minor ||
        !Number.isSafeInteger(total) ||
        total !== manifest.totalMinor ||
        manifest.items.length !== result.batch.item_count ||
        manifest.items.some(
          (item) =>
            !Number.isSafeInteger(item.send_amount_minor) ||
            item.send_amount_minor <= 0 ||
            item.send_currency !== manifest.currency,
        )
      )
        throw new Error(
          'Manifest verification failed. Decisions are blocked; contact the sending institution.',
        )
      if (current !== generation.current) return
      setDetail({ ...result, manifest })
      setVerified(true)
    } catch (error) {
      if (current === generation.current)
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load the manifest.',
        )
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }
  async function decide(decision: 'approved' | 'rejected') {
    if (
      !detail ||
      !verified ||
      reference.trim().length < 3 ||
      reason.trim().length < 20
    )
      return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await request<{ expiresAt: string }>(
        `/batches/${encodeURIComponent(detail.batch.id)}/decision`,
        {
          decision,
          manifestHash: detail.batch.manifest_hash,
          reference: reference.trim(),
          reason: reason.trim(),
        },
      )
      if (current !== generation.current) return
      setMessage(
        `Bank ${decision === 'approved' ? 'approval' : 'rejection'} recorded. ${decision === 'approved' ? `Approval expires at ${new Date(result.expiresAt).toLocaleTimeString()}.` : ''} This records a review decision; it does not execute a wire.`,
      )
      setDetail((previous) =>
        previous
          ? { ...previous, batch: { ...previous.batch, status: decision } }
          : null,
      )
      setVerified(false)
      setReference('')
      setReason('')
      await load()
    } catch (error) {
      if (current === generation.current) {
        setVerified(false)
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to record the decision.',
        )
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }
  function connect(event: FormEvent) {
    event.preventDefault()
    if (!/^xpt_bank_[a-f0-9]{64}$/.test(draftKey.trim())) {
      setError(
        'Enter the complete bank API key issued privately by XpressTend.',
      )
      return
    }
    generation.current++
    setKey(draftKey.trim())
    setDraftKey('')
    setError('')
    setMessage('')
  }
  return (
    <>
      {!key && <PublicHeader />}
      <div className="staff-console bank-portal">
        {key && (
          <header>
            <Link to="/">XpressTend</Link>
            <span>Partner bank review</span>
            {key && <button onClick={disconnect}>Disconnect</button>}
          </header>
        )}
        <main>
          <div className="bank-portal-title">
            <div>
              <p className="operations-eyebrow">Bank API / Manifest review</p>
              <h1>Review with confidence.</h1>
              <p>
                Bank-scoped manifests, verified totals and recorded decisions.
              </p>
            </div>
            <span className="bank-mode">
              Review environment · No wire execution
            </span>
          </div>
          {error && (
            <p role="alert" className="bank-notice">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="bank-notice">
              {message}
            </p>
          )}
          {!key ? (
            <form onSubmit={connect} className="bank-connect">
              <h2>Connect your bank</h2>
              <p>
                Use the scoped key issued by an XpressTend owner. It stays in
                this tab’s memory and is cleared when you disconnect or close
                the page.
              </p>
              <label>
                Bank API key
                <input
                  required
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={draftKey}
                  onChange={(event) => setDraftKey(event.target.value)}
                />
              </label>
              <button type="submit" className="bank-action">
                Connect to review API
              </button>
              <p>
                API base: <code>{API_BASE}/bank/v1</code>
              </p>
            </form>
          ) : (
            <div className="bank-review-grid">
              <section className="bank-batches">
                <div className="bank-section-title">
                  <h2>Assigned batches</h2>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setError('')
                      void load().catch((error) => setError(error.message))
                    }}
                  >
                    Refresh batches
                  </button>
                </div>
                <p className="bank-help">
                  Refreshes every 30 seconds while this tab is visible.
                </p>
                {batches.length ? (
                  batches.map((batch) => (
                    <button
                      className="bank-batch"
                      aria-pressed={detail?.batch.id === batch.id}
                      key={batch.id}
                      disabled={busy}
                      onClick={() => void open(batch)}
                    >
                      <strong>{batch.id}</strong>
                      <span>
                        {money(batch.total_minor, batch.currency)} ·{' '}
                        {batch.item_count} contributions
                      </span>
                      <small>{batch.status.replaceAll('_', ' ')}</small>
                    </button>
                  ))
                ) : (
                  <p className="bank-help">
                    No batches are currently assigned to this connection.
                  </p>
                )}
                {cursor && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void load(cursor).catch((error) =>
                        setError(error.message),
                      )
                    }
                  >
                    Load more batches
                  </button>
                )}
              </section>
              <section
                className="bank-manifest"
                aria-label="Bank manifest review"
              >
                {busy && <p role="status">Loading bank review…</p>}
                {detail ? (
                  <>
                    <div className="bank-section-title">
                      <h2>Manifest {detail.batch.id}</h2>
                      <span>
                        {verified
                          ? 'Hash & totals verified'
                          : 'Refresh required'}
                      </span>
                    </div>
                    <p className="bank-help">
                      {detail.batch.bank_id} · {detail.batch.status} ·{' '}
                      {money(
                        detail.manifest.totalMinor,
                        detail.manifest.currency,
                      )}
                    </p>
                    <details>
                      <summary>Manifest SHA-256</summary>
                      <code className="bank-hash">
                        {detail.batch.manifest_hash}
                      </code>
                    </details>
                    <div className="bank-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Sender</th>
                            <th>Recipient</th>
                            <th>Principal</th>
                            <th>Fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.manifest.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.reference}</td>
                              <td>
                                {item.first_name} {item.last_name}
                              </td>
                              <td>{item.recipient_name}</td>
                              <td>
                                {money(
                                  item.send_amount_minor,
                                  item.send_currency,
                                )}
                              </td>
                              <td>
                                {money(item.fee_minor, item.send_currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <details>
                      <summary>
                        Screening evidence ({detail.screenings.length})
                      </summary>
                      {detail.screenings.map((record) => (
                        <p key={record.id}>
                          {record.subject_name} · {record.provider} ·{' '}
                          {record.status.replaceAll('_', ' ')}
                        </p>
                      ))}
                      {!detail.screenings.length && (
                        <p>
                          No provider evidence returned. Perform your
                          institution’s required review before deciding.
                        </p>
                      )}
                    </details>
                    <p className="bank-help">
                      {detail.ledger.length} ledger entries returned. Bank
                      approval is an attestation against this exact manifest; it
                      never bypasses identity, sanctions or funding checks.
                    </p>
                    {['submitted', 'approved'].includes(detail.batch.status) ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          void decide('approved')
                        }}
                        className="bank-decision"
                      >
                        <label>
                          Bank review reference
                          <input
                            required
                            minLength={3}
                            maxLength={200}
                            value={reference}
                            onChange={(event) =>
                              setReference(event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Review reason
                          <textarea
                            required
                            minLength={20}
                            maxLength={2000}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                          />
                        </label>
                        <div>
                          <button
                            className="bank-action"
                            type="submit"
                            disabled={
                              busy ||
                              !verified ||
                              reference.trim().length < 3 ||
                              reason.trim().length < 20
                            }
                          >
                            Record bank approval
                          </button>
                          <button
                            type="button"
                            disabled={
                              busy ||
                              !verified ||
                              reference.trim().length < 3 ||
                              reason.trim().length < 20
                            }
                            onClick={() => void decide('rejected')}
                          >
                            Record bank rejection
                          </button>
                        </div>
                        <p className="bank-help">
                          Approvals expire after five minutes. Reopen the
                          manifest before issuing a new decision.
                        </p>
                      </form>
                    ) : (
                      <p className="bank-notice">
                        This batch is {detail.batch.status}. New decisions are
                        unavailable.
                      </p>
                    )}
                  </>
                ) : (
                  !busy && (
                    <p className="bank-help">
                      Choose an assigned batch to verify its manifest and review
                      its contributions.
                    </p>
                  )
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
