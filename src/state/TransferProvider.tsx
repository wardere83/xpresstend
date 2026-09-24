import { useCallback, useMemo, useState, type ReactNode } from 'react'
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
import { RailUnavailableError, authorizeRail, captureRail, railStatus } from '../lib/rails'
import { type DeliveryMethod, FEE_MODE, type Quote, type RailPhase, TransferContext, type TransferValue } from './TransferContext'

export function TransferProvider({ children }: { children: ReactNode }) {
  const { live, recipients: mine, refresh } = useAccountData()
  const [recipientId, setRecipientId] = useState(recipients[0].id)
  const [amountUsd, setAmountUsd] = useState(500)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bank')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('mobile')
  const [history, setHistory] = useState<Transaction[]>(seedTransactions)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)
  const [walletAccount, setWalletAccount] = useState('')
  const [walletPin, setWalletPin] = useState('')
  const [railPhase, setRailPhase] = useState<RailPhase>('idle')
  const [railMessage, setRailMessage] = useState<string | null>(null)

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

  const commit = useCallback(async (password: string): Promise<Transaction> => {
    setCommitError(null)
    setRailMessage(null)

    if (live && mineSelected && liveCorridor) {
      try {
        const created = await api.post<{ transfer: { id: string; reference: string } }>('/transfers', {
          corridorId: liveCorridor.id,
          recipientId: mineSelected.id,
          sendAmountMinor: Math.round(amountUsd * 100),
        })

        const tx: Transaction = {
          id: created.transfer.id,
          recipientId: mineSelected.id,
          amountUsd,
          fee: quote.fee,
          date: new Date().toISOString(),
          status: 'pending',
          reference: created.transfer.reference,
        }
        // Recorded before the payment resolves, so a transfer left pending on
        // the payer's handset is still something the customer can come back to.
        setLastTransaction(tx)

        /*
         * Mobile money goes through the rail: hold the funds, then capture.
         * The two steps are separate because the hold can come back PENDING —
         * the payer's provider has pushed a prompt to their handset and has not
         * been answered. That is neither success nor failure, so it is carried
         * as its own state rather than resolved by guessing.
         *
         * Any other payment method, or an environment with no rail configured,
         * keeps the existing path.
         */
        if (paymentMethod === 'mwallet') {
          try {
            setRailPhase('authorizing')
            const auth = await authorizeRail(created.transfer.id, {
              password,
              payerAccountNo: walletAccount,
              payerAccountPin: walletPin || undefined,
            })

            if (auth.state === 'pending') {
              setRailPhase('pending')
              setRailMessage(auth.message ?? null)
              await refresh()
              return tx
            }
            if (auth.state !== 'authorized' && auth.state !== 'captured') {
              setRailPhase('failed')
              setRailMessage(auth.message ?? null)
              throw new Error(auth.message ?? 'That payment was declined.')
            }

            const captured = await captureRail(created.transfer.id, password)
            if (captured.state === 'pending') {
              setRailPhase('pending')
              setRailMessage(captured.message ?? null)
              await refresh()
              return tx
            }
            if (captured.state !== 'captured') {
              setRailPhase('failed')
              setRailMessage(captured.message ?? null)
              throw new Error(captured.message ?? 'That payment was declined.')
            }

            setRailPhase('settled')
            await refresh()
            return tx
          } catch (err) {
            // No rail configured on this environment is not a payment failure:
            // fall through to the existing path rather than failing the send.
            if (!(err instanceof RailUnavailableError)) throw err
          }
        }

        // Test mode: books the ledger and moves the transfer into the
        // compliance queue without charging anything.
        await api.post(`/transfers/${created.transfer.id}/pay`, { password })
        setRailPhase('settled')
        await refresh()
        return tx
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not create that transfer.'
        setCommitError(message)
        if (railPhase === 'authorizing') setRailPhase('failed')
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
  }, [live, mineSelected, liveCorridor, amountUsd, quote.fee, refresh, history.length, recipientId, paymentMethod, walletAccount, walletPin, railPhase])

  /**
   * Re-reads the transfer's real state from the server.
   *
   * Asks our own record rather than assuming: the answer is whatever the
   * ledger says, which is the only state this product is willing to show a
   * customer. Returns true once the payment has settled.
   */
  const refreshRailStatus = useCallback(async (): Promise<boolean> => {
    if (!live || !lastTransaction) return false
    try {
      const s = await railStatus(lastTransaction.id)
      if (s.status !== 'awaiting_payment') {
        setRailPhase('settled')
        await refresh()
        return true
      }
      setRailPhase(s.awaitingPayer ? 'pending' : 'idle')
      return false
    } catch {
      // A failed poll is a failed poll. It says nothing about the payment, so
      // the displayed state is left exactly as it was.
      return false
    }
  }, [live, lastTransaction, refresh])

  const reset = useCallback(() => {
    setAmountUsd(500)
    setPaymentMethod('bank')
    setDeliveryMethod('mobile')
    setCommitError(null)
    setWalletAccount('')
    setWalletPin('')
    setRailPhase('idle')
    setRailMessage(null)
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
      walletAccount,
      setWalletAccount,
      walletPin,
      setWalletPin,
      railPhase,
      railMessage,
      refreshRailStatus,
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
      walletAccount,
      walletPin,
      railPhase,
      railMessage,
      refreshRailStatus,
      reset,
      live,
      commitError,
    ],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}
