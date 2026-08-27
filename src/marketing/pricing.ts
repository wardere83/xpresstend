/**
 * Corridor pricing, mirrored from the database.
 *
 * The API is the source of truth and is used whenever it can be reached. This
 * table is the fallback so the shopfront calculator still answers when the
 * Worker is unreachable, rather than showing an error to someone who just
 * wants to know what a transfer costs.
 *
 * The arithmetic below is the same as api/src/money.ts: integer minor units,
 * fee rounded up, recipient amount rounded down. Keep the two in step.
 */
export interface LocalCorridor {
  id: string
  receive_country: string
  receive_currency: string
  send_currency: string
  label: string
  feePercentBps: number
  fxMarginBps: number
  midRateE8: number
  minSendMinor: number
  maxSendMinor: number
}

/** Display order. The first entry is what the calculator opens on. */
export const CORRIDORS: LocalCorridor[] = [
  { id: 'cor_us_ke', receive_country: 'KE', receive_currency: 'KES', send_currency: 'USD', label: 'Kenya',    feePercentBps: 99, fxMarginBps: 0, midRateE8: 12_950_000_000, minSendMinor: 1000, maxSendMinor: 500_000 },
  { id: 'cor_us_so', receive_country: 'SO', receive_currency: 'USD', send_currency: 'USD', label: 'Somalia',  feePercentBps: 99, fxMarginBps: 0, midRateE8: 100_000_000,    minSendMinor: 1000, maxSendMinor: 500_000 },
  { id: 'cor_us_et', receive_country: 'ET', receive_currency: 'ETB', send_currency: 'USD', label: 'Ethiopia', feePercentBps: 99, fxMarginBps: 0, midRateE8: 15_000_000_000, minSendMinor: 1000, maxSendMinor: 500_000 },
  { id: 'cor_us_br', receive_country: 'BR', receive_currency: 'BRL', send_currency: 'USD', label: 'Brazil',   feePercentBps: 99, fxMarginBps: 0, midRateE8: 540_000_000,    minSendMinor: 1000, maxSendMinor: 500_000 },
  { id: 'cor_us_mx', receive_country: 'MX', receive_currency: 'MXN', send_currency: 'USD', label: 'Mexico',   feePercentBps: 99, fxMarginBps: 0, midRateE8: 1_850_000_000,  minSendMinor: 1000, maxSendMinor: 500_000 },
]

export interface LocalQuote {
  sendAmountMinor: number
  feeMinor: number
  totalChargedMinor: number
  receiveAmountMinor: number
  sendCurrency: string
  receiveCurrency: string
  effectiveRateE8: number
}

export function quoteLocally(c: LocalCorridor, sendAmountMinor: number): LocalQuote | null {
  if (!Number.isFinite(sendAmountMinor) || sendAmountMinor <= 0) return null
  const send = BigInt(Math.round(sendAmountMinor))
  // Fee rounds up, matching the server, so the two never disagree by a cent.
  const fee = (send * BigInt(c.feePercentBps) + 9_999n) / 10_000n
  const effective = (BigInt(c.midRateE8) * BigInt(10_000 - c.fxMarginBps)) / 10_000n
  const receive = (send * effective) / 100_000_000n
  if (receive <= 0n) return null
  return {
    sendAmountMinor: Number(send),
    feeMinor: Number(fee),
    totalChargedMinor: Number(send + fee),
    receiveAmountMinor: Number(receive),
    sendCurrency: c.send_currency,
    receiveCurrency: c.receive_currency,
    effectiveRateE8: Number(effective),
  }
}
