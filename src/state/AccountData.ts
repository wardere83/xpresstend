import { createContext, useContext } from 'react'

/**
 * The signed-in customer's real recipients and transfers.
 *
 * Product routes require an account. These records are always loaded from the
 * authenticated API and never replaced with sample customer data.
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
  /** True for an authenticated account, including while its data is loading. */
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
