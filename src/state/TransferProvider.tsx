import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  TRANSFER_FEE,
  defaultCorridor,
  getCorridor,
  type Recipient,
  type PaymentMethodId,
  type Transaction,
} from '../data/product'
import { api } from '../lib/api'
import { useAccountData } from './AccountData'
import { CORRIDORS, quoteLocally } from '../marketing/pricing'
import { hueFor } from '../lib/view'
import { type DeliveryMethod, FEE_MODE, type Quote, TransferContext, type TransferValue } from './TransferContext'

export function TransferProvider({ children }: { children: ReactNode }) {
  const { live, recipients: mine, refresh } = useAccountData()
  const [recipientId, setRecipientId] = useState('')
  const [amountUsd, setAmountUsd] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('mobile')
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

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
      } satisfies Recipient
    }
    return {
      id: '',
      name: '',
      phone: '',
      corridorCode: defaultCorridor.code,
      wallet: '',
      last4: '',
      hue: 0,
    } satisfies Recipient
  }, [mineSelected])

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

  const commit = useCallback(async (password: string): Promise<Transaction> => {
    setCommitError(null)

    if (!live || !mineSelected || !liveCorridor) {
      const error = new Error('Add a supported recipient before creating a transfer.')
      setCommitError(error.message)
      throw error
    }

    try {
      const created = await api.post<{ transfer: { id: string; reference: string } }>('/transfers', {
        corridorId: liveCorridor.id,
        recipientId: mineSelected.id,
        sendAmountMinor: Math.round(amountUsd * 100),
      })
      await api.post(`/transfers/${created.transfer.id}/pay`, { password })
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
  }, [live, mineSelected, liveCorridor, amountUsd, quote.fee, refresh])

  const reset = useCallback(() => {
    setAmountUsd(0)
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
      lastTransaction,
      commit,
      reset,
      live,
      commitError,
    ],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}
