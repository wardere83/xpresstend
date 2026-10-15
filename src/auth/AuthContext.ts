import { createContext, useContext } from 'react'
import { type AccountUser } from '../lib/api'

export interface AuthState {
  user: AccountUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  register: (input: {
    email: string; password: string; firstName: string; lastName: string; language?: string
  }) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export const Ctx = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
