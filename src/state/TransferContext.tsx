import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  TRANSFER_FEE,
  getCorridor,
  getRecipient,
  recipients,
  transactions as seedTransactions,
  type PaymentMethodId,
  type Transaction,
} from '../data/mock'
import { makeReference } from '../lib/format'
import { api } from '../lib/api'
import { useAccountData } from './AccountData'
import { CORRIDORS, quoteLocally } from '../marketing/pricing'
import { hueFor } from '../lib/view'

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

type TransferValue = {
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
  commit: () => Promise<Transaction>
  reset: () => void
  /** True when the numbers and the recipient come from the customer's account. */
  live: boolean
  /** Set when a real transfer could not be created. */
  commitError: string | null
}

const TransferContext = createContext<TransferValue | null>(null)

export function TransferProvider({ children }: { children: ReactNode }) {
  const { live, recipients: mine, refresh } = useAccountData()
  const [recipientId, setRecipientId] = useState(recipients[0].id)
  const [amountUsd, setAmountUsd] = useState(500)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('mobile')
  const [history, setHistory] = useState<Transaction[]>(seedTransactions)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  // A real recipient id never matches a seeded one, so pick whichever source is
  // in play and fall back rather than throwing on a stale selection.
  const mineSelected = live ? mine.find((r) => r.id === recipientId) ?? mine[0] : undefined

  const recipient = useMemo(() => {
    if (mineSelected) {
      return {
        id: mineSelected.id,
        name: mineSelected.full_name,
        phone: mineSelected.phone ?? '',
        wallet: mineSelected.phone ?? mineSelected.bank_name ?? mineSelected.country,
        last4: (mineSelected.phone ?? mineSelected.id).slice(-4),
        hue: hueFor(mineSelected.full_name),
        corridorCode: mineSelected.country,
      } as ReturnType<typeof getRecipient>
    }
    return getRecipient(recipientId)
  }, [mineSelected, recipientId])

  const liveCorridor = mineSelected
    ? CORRIDORS.find((c) => c.receive_country === mineSelected.country)
    : undefined

  const corridor = useMemo(() => {
    if (liveCorridor) {
      const seededMatch = getCorridor(liveCorridor.receive_country)
      return {
        ...seededMatch,
        currency: liveCorridor.receive_currency,
        rate: liveCorridor.midRateE8 / 1e8,
      }
    }
    return getCorridor(recipient.corridorCode)
  }, [liveCorridor, recipient.corridorCode])

  const quote = useMemo<Quote>(() => {
    if (liveCorridor) {
      const q = quoteLocally(liveCorridor, Math.round(amountUsd * 100))
      if (q) {
        return {
          amountUsd,
          fee: q.feeMinor / 100,
          totalUsd: q.totalChargedMinor / 100,
          recipientUsd: amountUsd,
          recipientLocal: q.receiveAmountMinor / 100,
          rate: q.effectiveRateE8 / 1e8,
          currency: q.receiveCurrency,
        }
      }
    }
    const fee = TRANSFER_FEE
    const recipientUsd = FEE_MODE === 'added' ? amountUsd : Math.max(0, amountUsd - fee)
    const totalUsd = FEE_MODE === 'added' ? amountUsd + fee : amountUsd
    return {
      amountUsd,
      fee,
      totalUsd,
      recipientUsd,
      recipientLocal: recipientUsd * corridor.rate,
      rate: corridor.rate,
      currency: corridor.currency,
    }
  }, [amountUsd, corridor, liveCorridor])

  const commit = useCallback(async (): Promise<Transaction> => {
    setCommitError(null)

    if (live && mineSelected && liveCorridor) {
      try {
        const created = await api.post<{ transfer: { id: string; reference: string } }>('/transfers', {
          corridorId: liveCorridor.id,
          recipientId: mineSelected.id,
          sendAmountMinor: Math.round(amountUsd * 100),
        })
        // Capture is test mode: it books the ledger and moves the transfer into
        // the compliance queue without charging anything.
        await api.post(`/transfers/${created.transfer.id}/pay`)
        await refresh()

        const tx: Transaction = {
          id: created.transfer.id,
          recipientId: mineSelected.id,
          amountUsd,
          fee: quote.fee,
          date: new Date().toISOString(),
          status: 'pending',
          reference: created.transfer.reference,
        }
        setLastTransaction(tx)
        return tx
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not create that transfer.'
        setCommitError(message)
        throw err
      }
    }

    const tx: Transaction = {
      id: `t-${history.length + 1}-${Date.now()}`,
      recipientId,
      amountUsd,
      fee: TRANSFER_FEE,
      date: new Date().toISOString(),
      status: 'completed',
      reference: makeReference(),
    }
    setHistory((prev) => [tx, ...prev])
    setLastTransaction(tx)
    return tx
  }, [live, mineSelected, liveCorridor, amountUsd, quote.fee, refresh, history.length, recipientId])

  const reset = useCallback(() => {
    setAmountUsd(500)
    setPaymentMethod('bank')
    setDeliveryMethod('mobile')
    setCommitError(null)
  }, [])

  const value = useMemo<TransferValue>(
    () => ({
      recipientId,
      setRecipientId,
      amountUsd,
      setAmountUsd,
      paymentMethod,
      setPaymentMethod,
      deliveryMethod,
      setDeliveryMethod,
      recipient,
      corridor,
      quote,
      history,
      lastTransaction,
      commit,
      reset,
      live,
      commitError,
    }),
    [
      recipientId,
      amountUsd,
      paymentMethod,
      deliveryMethod,
      recipient,
      corridor,
      quote,
      history,
      lastTransaction,
      commit,
      reset,
      live,
      commitError,
    ],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}

export function useTransfer() {
  const ctx = useContext(TransferContext)
  if (!ctx) throw new Error('useTransfer must be used inside <TransferProvider>')
  return ctx
}
