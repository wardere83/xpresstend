import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

/**
 * The signed-in customer's real recipients and transfers.
 *
 * /app is reachable without an account, because the marketing page invites
 * people to explore it. So this deliberately does two things at once: for a
 * signed-in customer it serves their own data from the API, and for everyone
 * else it stays empty and the screens fall back to the seeded demo. That keeps
 * the shopfront tour working without ever showing invented figures to somebody
 * who has actually signed up.
 */
export interface ApiRecipient {
  id: string
  full_name: string
  country: string
  payout_method: string
  phone: string | null
  bank_name: string | null
  relationship: string | null
  created_at: string
}

export interface ApiTransfer {
  id: string
  reference: string
  send_amount_minor: number
  send_currency: string
  fee_minor: number
  receive_amount_minor: number
  receive_currency: string
  status: string
  created_at: string
  completed_at: string | null
  recipient_name: string
  recipient_country: string
}

interface AccountDataValue {
  /** True once a signed-in customer's data has been loaded at least once. */
  live: boolean
  loading: boolean
  error: string | null
  recipients: ApiRecipient[]
  transfers: ApiTransfer[]
  refresh: () => Promise<void>
  addRecipient: (input: {
    fullName: string; country: string; payoutMethod: string
    phone?: string; bankName?: string; relationship?: string
  }) => Promise<void>
}

const Ctx = createContext<AccountDataValue | null>(null)

export function AccountDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [recipients, setRecipients] = useState<ApiRecipient[]>([])
  const [transfers, setTransfers] = useState<ApiTransfer[]>([])
  const [loading, setLoading] = useState(false)
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setRecipients([]); setTransfers([]); setLive(false)
      return
    }
    setLoading(true); setError(null)
    try {
      const [r, t] = await Promise.all([
        api.get<{ recipients: ApiRecipient[] }>('/recipients'),
        api.get<{ transfers: ApiTransfer[] }>('/transfers'),
      ])
      setRecipients(r.recipients ?? [])
      setTransfers(t.transfers ?? [])
      setLive(true)
    } catch (err) {
      // A signed-in customer must never be shown seeded figures as if they were
      // theirs, so stay live-but-empty and surface the failure instead.
      setLive(true)
      setError(err instanceof ApiError ? (err.message || err.code) : 'Could not load your account.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  const value = useMemo<AccountDataValue>(() => ({
    live, loading, error, recipients, transfers, refresh,
    addRecipient: async (input) => {
      await api.post('/recipients', input)
      await refresh()
    },
  }), [live, loading, error, recipients, transfers, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAccountData(): AccountDataValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAccountData must be used inside AccountDataProvider')
  return ctx
}
