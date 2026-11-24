import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError, type AccountUser } from '../lib/api'
import { type AuthState, Ctx } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionRevision = useRef(0)

  const loadSession = useCallback(async () => {
    const { user } = await api.get<{ user: AccountUser }>('/auth/me')
    return user
  }, [])

  const refresh = useCallback(async () => {
    const revision = sessionRevision.current
    try {
      const user = await loadSession()
      if (revision === sessionRevision.current) setUser(user)
    } catch (err) {
      // 401 simply means signed out; anything else is left to the caller's UI.
      if (revision === sessionRevision.current) {
        if (!(err instanceof ApiError) || err.status !== 401) console.warn('session check failed', err)
        setUser(null)
      }
    } finally {
      if (revision === sessionRevision.current) setLoading(false)
    }
  }, [loadSession])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      refresh,
      signIn: async (email, password) => {
        let revision = ++sessionRevision.current
        try {
          await api.post('/auth/login', { email, password })
          if (revision !== sessionRevision.current) return
          revision = ++sessionRevision.current
          // Do not continue until the browser confirms that the session cookie works.
          const user = await loadSession()
          if (revision === sessionRevision.current) setUser(user)
        } finally {
          if (revision === sessionRevision.current) setLoading(false)
        }
      },
      register: async (input) => {
        let revision = ++sessionRevision.current
        try {
          await api.post('/auth/register', input)
          if (revision !== sessionRevision.current) return
          revision = ++sessionRevision.current
          try {
            const user = await loadSession()
            if (revision === sessionRevision.current) setUser(user)
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              throw new ApiError(401, 'registration_incomplete', 'If you already have an account, sign in or reset your password. Otherwise, please try again.')
            }
            throw err
          }
        } finally {
          if (revision === sessionRevision.current) setLoading(false)
        }
      },
      signOut: async () => {
        const revision = ++sessionRevision.current
        await api.post('/auth/logout')
        if (revision === sessionRevision.current) {
          ++sessionRevision.current
          setUser(null)
          setLoading(false)
        }
      },
    }),
    [user, loading, refresh, loadSession],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
