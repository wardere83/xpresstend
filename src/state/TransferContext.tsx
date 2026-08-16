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
  commit: () => Transaction
  reset: () => void
}

const TransferContext = createContext<TransferValue | null>(null)

export function TransferProvider({ children }: { children: ReactNode }) {
  const [recipientId, setRecipientId] = useState(recipients[0].id)
  const [amountUsd, setAmountUsd] = useState(500)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('mobile')
  const [history, setHistory] = useState<Transaction[]>(seedTransactions)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)

  const recipient = useMemo(() => getRecipient(recipientId), [recipientId])
  const corridor = useMemo(() => getCorridor(recipient.corridorCode), [recipient])

  const quote = useMemo<Quote>(() => {
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
  }, [amountUsd, corridor])

  const commit = useCallback(() => {
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
  }, [amountUsd, history.length, recipientId])

  const reset = useCallback(() => {
    setAmountUsd(500)
    setPaymentMethod('bank')
    setDeliveryMethod('mobile')
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
    ],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}

export function useTransfer() {
  const ctx = useContext(TransferContext)
  if (!ctx) throw new Error('useTransfer must be used inside <TransferProvider>')
  return ctx
}
