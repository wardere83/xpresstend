import type { ApiRecipient, ApiTransfer } from '../state/AccountData'

/** Normalized shapes for account-backed records. */
export interface RecipientView {
  id: string
  name: string
  /** Relationship or country for a real account recipient. */
  subtitle: string
  /** Phone or account reference, whichever the record carries. */
  detail: string
  hue: number
  favourite: boolean
}

export interface TransferView {
  id: string
  name: string
  subtitle: string
  hue: number
  amountUsd: number
  date: string
  status: 'completed' | 'pending'
}

/** Deterministic avatar colour for a real record, which carries no seeded hue. */
export function hueFor(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return h
}

const PAYOUT_LABEL: Record<string, string> = {
  mobile_wallet: 'Mobile wallet',
  bank_account: 'Bank account',
  cash_pickup: 'Cash pickup',
}

export function toRecipientView(r: ApiRecipient): RecipientView {
  return {
    id: r.id,
    name: r.full_name,
    subtitle: r.relationship || PAYOUT_LABEL[r.payout_method] || r.payout_method,
    detail: r.phone || r.bank_name || r.country,
    hue: hueFor(r.full_name),
    // Favourites are a seeded idea; a real account has none until the feature exists.
    favourite: false,
  }
}

export function toTransferView(t: ApiTransfer): TransferView {
  return {
    id: t.id,
    name: t.recipient_name,
    subtitle: t.recipient_country,
    hue: hueFor(t.recipient_name),
    amountUsd: t.send_amount_minor / 100,
    date: t.created_at,
    status: t.status === 'completed' ? 'completed' : 'pending',
  }
}
