import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, type AccountUser } from '../lib/api'
import { type AuthState, Ctx } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: AccountUser }>('/auth/me')
      setUser(user)
    } catch (err) {
      // 401 simply means signed out; anything else is left to the caller's UI.
      if (!(err instanceof ApiError) || err.status !== 401) console.warn('session check failed', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      refresh,
      signIn: async (email, password) => {
        await api.post('/auth/login', { email, password })
        await refresh()
      },
      register: async (input) => {
        await api.post('/auth/register', input)
        await refresh()
      },
      signOut: async () => {
        await api.post('/auth/logout')
        setUser(null)
      },
    }),
    [user, loading, refresh],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
