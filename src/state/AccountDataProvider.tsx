import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { type AccountDataValue, type ApiRecipient, type ApiTransfer, Ctx } from './AccountData'

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
