import { createContext, useContext } from 'react'

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

export interface AccountDataValue {
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

export const Ctx = createContext<AccountDataValue | null>(null)

export function useAccountData(): AccountDataValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAccountData must be used inside AccountDataProvider')
  return ctx
}
