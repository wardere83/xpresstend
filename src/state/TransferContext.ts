import { createContext, useContext } from 'react'
import { getCorridor, getRecipient, type PaymentMethodId, type Transaction } from '../data/mock'

/**
 * How the fee is applied.
 *  - 'added'    → you are charged amount + fee, the recipient gets the full amount (default).
 *  - 'deducted' → you are charged the amount, the fee comes out of what the recipient gets.
 */
export const FEE_MODE: 'added' | 'deducted' = 'added'

export type DeliveryMethod = 'mobile' | 'bank' | 'cash' | 'airtime'

export type Quote = {
  amountUsd: number
  fee: number
  /** Charged to the sender's payment method. */
  totalUsd: number
  /** What lands with the recipient, in USD. */
  recipientUsd: number
  /** What lands with the recipient, in the destination currency. */
  recipientLocal: number
  rate: number
  currency: string
}

/**
 * Where the money is, from the customer's point of view.
 *
 *  - 'idle'        nothing attempted yet
 *  - 'authorizing' the rail has been asked to hold the funds
 *  - 'pending'     the payer's provider has sent a prompt and has not answered
 *  - 'settled'     captured, booked, and in compliance review
 *  - 'failed'      the provider declined
 *
 * 'pending' is a state and not a spinner. Mobile money routinely answers it,
 * and a flow that cannot represent it has to either block or claim an outcome
 * it does not have.
 */
export type RailPhase = 'idle' | 'authorizing' | 'pending' | 'settled' | 'failed'

export type TransferValue = {
  recipientId: string
  setRecipientId: (id: string) => void
  amountUsd: number
  setAmountUsd: (value: number) => void
  paymentMethod: PaymentMethodId
  setPaymentMethod: (id: PaymentMethodId) => void
  deliveryMethod: DeliveryMethod
  setDeliveryMethod: (m: DeliveryMethod) => void
  recipient: ReturnType<typeof getRecipient>
  corridor: ReturnType<typeof getCorridor>
  quote: Quote
  history: Transaction[]
  lastTransaction: Transaction | null
  /**
   * Records the transfer. For a signed-in customer this creates it through the
   * API and captures the (test-mode) payment, so it lands in the compliance
   * queue; for a visitor touring the app it only appends to local history.
   */
  /** Requires the account password: the server authorises payment with it. */
  commit: (password: string) => Promise<Transaction>
  /**
   * The mobile-money account the sender pays FROM. Collected on the send
   * screen, carried to our API, and never stored by us: it is passed to the
   * payment provider and dropped.
   */
  walletAccount: string
  setWalletAccount: (value: string) => void
  /** One-time wallet authorisation, where the provider asks for one. */
  walletPin: string
  setWalletPin: (value: string) => void
  /** Where the payment stands. See RailPhase. */
  railPhase: RailPhase
  /** What the provider said, when it said anything worth showing. */
  railMessage: string | null
  /**
   * Re-reads the transfer's real state from the server. Returns true once the
   * payment has settled, so a caller can stop polling.
   */
  refreshRailStatus: () => Promise<boolean>
  reset: () => void
  /** True when the numbers and the recipient come from the customer's account. */
  live: boolean
  /** Set when a real transfer could not be created. */
  commitError: string | null
}

export const TransferContext = createContext<TransferValue | null>(null)

export function useTransfer() {
  const ctx = useContext(TransferContext)
  if (!ctx) throw new Error('useTransfer must be used inside <TransferProvider>')
  return ctx
}
