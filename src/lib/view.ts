import type { ApiRecipient, ApiTransfer } from '../state/AccountData'
import { getRecipient, type Recipient } from '../data/mock'

/**
 * One shape the screens render, whichever source the data came from.
 *
 * /app is reachable without an account, so the seeded records still have to
 * render for a visitor touring the product. Normalising here means each screen
 * renders a single shape instead of branching on which world it is in, and a
 * real recipient never has to be forced into the mock's fields.
 */
export interface RecipientView {
  id: string
  name: string
  /** Relationship for a seeded record, country for a real one. */
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

export function seededRecipientView(r: Recipient, relation: string): RecipientView {
  return { id: r.id, name: r.name, subtitle: relation, detail: r.phone, hue: r.hue, favourite: r.favourite }
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

export function seededTransferView(tx: {
  id: string; recipientId: string; amountUsd: number; date: string; status: 'completed' | 'pending'
}): TransferView {
  const r = getRecipient(tx.recipientId)
  return {
    id: tx.id, name: r.name, subtitle: r.wallet, hue: r.hue,
    amountUsd: tx.amountUsd, date: tx.date, status: tx.status,
  }
}
