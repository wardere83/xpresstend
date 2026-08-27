import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../i18n'
import { api, money, type Corridor, type Quote } from '../lib/api'
import { CORRIDORS, quoteLocally, type LocalCorridor } from './pricing'

/**
 * Shopfront rate calculator.
 *
 * Prefers the live /quote endpoint so the shopfront can never quote a price the
 * product would not honour. When the API cannot be reached it falls back to the
 * bundled corridor table, which runs the identical arithmetic, so someone
 * checking a rate always gets an answer instead of an error.
 */
export function RateQuote() {
  const t = useT()
  const [corridors, setCorridors] = useState<LocalCorridor[]>(CORRIDORS)
  const [corridorId, setCorridorId] = useState(CORRIDORS[0].id)
  const [amount, setAmount] = useState('200')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [live, setLive] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api
      .get<{ corridors: Corridor[] }>('/corridors')
      .then(({ corridors }) => {
        if (!corridors?.length) return
        const merged = corridors.map((c) => {
          const known = CORRIDORS.find((k) => k.id === c.id)
          return { ...(known ?? CORRIDORS[0]), ...c, label: known?.label ?? c.receive_country } as LocalCorridor
        })
        // The API sorts by country code; keep our own display order so the
        // calculator does not reshuffle when the live data arrives.
        const rank = (id: string) => {
          const i = CORRIDORS.findIndex((k) => k.id === id)
          return i === -1 ? Number.MAX_SAFE_INTEGER : i
        }
        merged.sort((a, b) => rank(a.id) - rank(b.id))
        setCorridors(merged)
        setLive(true)
      })
      .catch(() => setLive(false))
  }, [])

  const amountMinor = useMemo(() => {
    const n = Number.parseFloat(amount.replace(/,/g, ''))
    return Number.isFinite(n) ? Math.round(n * 100) : NaN
  }, [amount])

  const corridor = corridors.find((c) => c.id === corridorId) ?? corridors[0]

  useEffect(() => {
    if (!corridor || !Number.isFinite(amountMinor) || amountMinor <= 0) {
      setQuote(null)
      return
    }
    const local = quoteLocally(corridor, amountMinor)
    setQuote(local ? ({ ...local, corridorId: corridor.id, expiresAt: '' } as Quote) : null)

    if (!live) return
    const timer = setTimeout(() => {
      api
        .post<{ quote: Quote }>('/quote', { corridorId: corridor.id, sendAmountMinor: amountMinor })
        .then(({ quote }) => setQuote(quote))
        .catch(() => {
          // Keep the locally computed figure rather than blanking the panel.
        })
    }, 280)
    return () => clearTimeout(timer)
  }, [corridor, amountMinor, live])

  const belowMin = Number.isFinite(amountMinor) && corridor && amountMinor > 0 && amountMinor < corridor.minSendMinor

  return (
    <div className="rounded-[24px] border border-ink-200/70 bg-canvas p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[15px] font-bold">{t('marketing.calcTitle')}</h2>

      <label className="mt-4 block text-[12px] font-semibold text-ink-500" htmlFor="mk-amount">
        {t('marketing.youSend')}
      </label>

      {/*
        Focus halo. The rotating conic gradient sits behind the field and is
        clipped by the wrapper's own rounded box, so the light rides the border
        and never spills onto the card. The 2px padding is the only place it
        shows; the inner surface covers the rest.
      */}
      <div className="relative mt-1.5 overflow-hidden rounded-[20px] p-[2px]">
        <span
          aria-hidden="true"
          className={`halo-orbit pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_200deg,var(--color-brand-400)_290deg,var(--color-brand-600)_330deg,transparent_360deg)] transition-opacity duration-300 ${
            focused ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative flex items-center gap-2 rounded-[18px] bg-white px-4 py-3.5 transition-shadow ${
            focused ? 'ring-1 ring-brand-200' : 'ring-1 ring-ink-200'
          }`}
        >
          <span className="text-[16px] font-bold text-ink-400">$</span>
          <input
            ref={inputRef}
            id="mk-amount"
            inputMode="decimal"
            value={amount}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-[22px] font-extrabold tabular-nums outline-none"
          />
          <span className="text-[13px] font-semibold text-ink-400">USD</span>
        </div>
      </div>

      <label className="mt-4 block text-[12px] font-semibold text-ink-500" htmlFor="mk-dest">
        {t('marketing.destination')}
      </label>
      <select
        id="mk-dest"
        value={corridorId}
        onChange={(e) => setCorridorId(e.target.value)}
        className="mt-1.5 w-full rounded-[20px] bg-white px-4 py-3.5 text-[14px] font-semibold outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
      >
        {corridors.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} · {c.receive_currency}
          </option>
        ))}
      </select>

      <div className="mt-5 space-y-2 border-t border-ink-200/70 pt-4 text-[13px]">
        {belowMin ? (
          <p className="text-[13px] font-medium text-ink-500">
            {t('marketing.limits', {
              min: money(corridor.minSendMinor, corridor.send_currency),
              max: money(corridor.maxSendMinor, corridor.send_currency),
            })}
          </p>
        ) : quote ? (
          <>
            <Row label={t('marketing.fee')} value={money(quote.feeMinor, quote.sendCurrency)} />
            <Row
              label={t('marketing.rate')}
              value={`1 ${quote.sendCurrency} = ${(quote.effectiveRateE8 / 1e8).toFixed(4)} ${quote.receiveCurrency}`}
            />
            <Row label={t('marketing.totalCharged')} value={money(quote.totalChargedMinor, quote.sendCurrency)} />
            <div className="mt-3 flex items-baseline justify-between rounded-2xl bg-brand-50 px-4 py-3">
              <span className="text-[12px] font-semibold text-brand-700">{t('marketing.theyReceive')}</span>
              <span className="text-[19px] font-extrabold tabular-nums text-brand-700">
                {money(quote.receiveAmountMinor, quote.receiveCurrency)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-ink-400">{t('marketing.calculating')}</p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}
