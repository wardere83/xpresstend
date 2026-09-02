import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type AdminUser } from '../lib/api'

/**
 * Staff administration.
 *
 * English-only like the rest of the console: this is internal tooling for the
 * back office, not customer-facing.
 */
interface StaffRow {
  id: string
  email: string
  name: string
  role: AdminUser['role']
  status: string
  last_login_at: string | null
  created_at: string
}

const ROLES: { value: AdminUser['role']; label: string; blurb: string }[] = [
  { value: 'viewer', label: 'Viewer', blurb: 'Read only. Sees queues and the ledger.' },
  { value: 'agent', label: 'Agent', blurb: 'Handles customers. Cannot release money.' },
  { value: 'compliance', label: 'Compliance', blurb: 'Releases or rejects transfers, decides KYC.' },
  { value: 'owner', label: 'Owner', blurb: 'Everything, plus adding and removing staff.' },
]

const ROLE_TONE: Record<string, string> = {
  owner: 'bg-brand-100 text-brand-700',
  compliance: 'bg-emerald-100 text-emerald-800',
  agent: 'bg-amber-100 text-amber-800',
  viewer: 'bg-ink-200 text-ink-700',
}

export function StaffPanel({ me }: { me: AdminUser }) {
  const [rows, setRows] = useState<StaffRow[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const isOwner = me.role === 'owner'

  const load = useCallback(async () => {
    const { staff } = await api.get<{ staff: StaffRow[] }>('/admin/staff')
    setRows(staff)
  }, [])

  useEffect(() => {
    void load().catch(() => setNote('Could not load staff.'))
  }, [load])

  async function update(id: string, patch: { role?: string; status?: string }) {
    setBusyId(id); setNote(null)
    try {
      await api.patch(`/admin/staff/${id}`, patch)
      await load()
    } catch (err) {
      setNote(err instanceof ApiError ? (err.message || err.code) : 'Could not update that account.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[15px] font-bold">Staff</h2>
        {isOwner ? (
          <button onClick={() => setAdding((v) => !v)}
            className="rounded-full bg-brand-600 px-3.5 py-1.5 text-[12px] font-semibold text-white">
            {adding ? 'Cancel' : 'Invite staff'}
          </button>
        ) : (
          <span className="text-[12px] text-ink-400">Only an owner can add or change staff.</span>
        )}
      </div>

      {adding && isOwner ? (
        <AddStaff
          onDone={async () => { setAdding(false); await load() }}
          onError={setNote}
        />
      ) : null}

      {note ? <p role="alert" className="mb-3 text-[13px] font-medium text-red-600">{note}</p> : null}

      <div className="overflow-x-auto rounded-[20px] bg-white ring-1 ring-ink-200/70">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="border-b border-ink-200/70 text-[11px] uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last signed in</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-200/50 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-semibold">{r.name}</span>
                  {r.id === me.id ? <span className="ml-2 text-[11px] text-ink-400">you</span> : null}
                  {r.status === 'invited' ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      invited
                    </span>
                  ) : r.status !== 'active' ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                      disabled
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ink-500">{r.email}</td>
                <td className="px-4 py-3">
                  {isOwner && r.id !== me.id ? (
                    <select
                      value={r.role}
                      disabled={busyId === r.id}
                      onChange={(e) => void update(r.id, { role: e.target.value })}
                      className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-semibold ring-1 ring-ink-200"
                    >
                      {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_TONE[r.role]}`}>
                      {r.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-500">
                  {r.last_login_at ? new Date(r.last_login_at).toLocaleDateString() : 'never'}
                </td>
                <td className="px-4 py-3 text-right">
                  {isOwner && r.id !== me.id ? (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => void update(r.id, { status: r.status === 'active' ? 'disabled' : 'active' })}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50 ${
                        r.status === 'active'
                          ? 'bg-white text-red-600 ring-1 ring-red-200'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {r.status === 'active' ? 'Disable' : 'Re-enable'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
        Every change here is written to the audit log against your name. You cannot change
        your own role or disable yourself, and the last active owner cannot be demoted, so
        the console can never be locked from the inside.
      </p>
    </div>
  )
}

function AddStaff({ onDone, onError }: { onDone: () => void; onError: (m: string) => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' })
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<{ emailed: boolean; link?: string }>('/admin/staff/invite', form)
      setForm({ name: '', email: '', role: 'viewer' })
      // A link comes back only when email could not be delivered.
      if (res.link) setLink(res.link)
      else onDone()
    } catch (err) {
      onError(err instanceof ApiError ? (err.message || err.code) : 'Could not send that invitation.')
    } finally {
      setBusy(false)
    }
  }

  if (link) {
    return (
      <div className="mb-4 rounded-[20px] bg-white p-5 ring-1 ring-ink-200/70">
        <h3 className="text-[14px] font-bold">Invitation ready</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
          Email is not configured yet, so nothing was sent. Give this link to them
          over a channel you trust. It works once and expires in 48 hours.
        </p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-2xl bg-canvas px-3 py-2.5 text-[12px] ring-1 ring-ink-200" />
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => setCopied(true))
            }}
            className="shrink-0 rounded-full bg-ink-900 px-4 py-2.5 text-[12px] font-semibold text-white">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <button onClick={() => { setLink(null); onDone() }}
          className="mt-4 text-[12px] font-semibold text-brand-700">
          Done
        </button>
      </div>
    )
  }

  const field = 'rounded-2xl bg-white px-4 py-2.5 text-[13px] outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500'

  return (
    <form onSubmit={submit} className="mb-4 rounded-[20px] bg-white p-5 ring-1 ring-ink-200/70">
      <div className="grid gap-3 sm:grid-cols-3">
        <input required placeholder="Full name" value={form.name} onChange={set('name')} className={field} />
        <input required type="email" placeholder="name@xpresstend.com" value={form.email}
               onChange={set('email')} className={field} autoComplete="off" />
        <select value={form.role} onChange={set('role')} className={field}>
          {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-400">
        {ROLES.find((r) => r.value === form.role)?.blurb} They choose their own password,
        so you never handle it. The invitation expires in 48 hours.
      </p>
      <button type="submit" disabled={busy}
        className="mt-4 rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
        {busy ? 'Sending…' : 'Send invitation'}
      </button>
    </form>
  )
}
