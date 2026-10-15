import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, type AccountUser } from '../lib/api'
import { type AuthState, Ctx } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const { user } = await api.get<{ user: AccountUser }>('/auth/me')
    setUser(user)
    return user
  }, [])

  const refresh = useCallback(async () => {
    try {
      await loadSession()
    } catch (err) {
      // 401 simply means signed out; anything else is left to the caller's UI.
      if (!(err instanceof ApiError) || err.status !== 401) console.warn('session check failed', err)
      setUser(null)
    } finally {
      setLoading(false)
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
        await api.post('/auth/login', { email, password })
        // Do not continue until the browser confirms that the session cookie works.
        await loadSession()
      },
      register: async (input) => {
        await api.post('/auth/register', input)
        try {
          await loadSession()
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            throw new ApiError(401, 'registration_incomplete', 'If you already have an account, sign in or reset your password. Otherwise, please try again.')
          }
          throw err
        }
      },
      signOut: async () => {
        await api.post('/auth/logout')
        setUser(null)
      },
    }),
    [user, loading, refresh, loadSession],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
