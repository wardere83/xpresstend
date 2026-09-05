import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n, useT } from '../i18n'
import { api, ApiError, money, type Corridor, type Quote } from '../lib/api'
import { CORRIDORS, quoteLocally, type LocalCorridor } from './pricing'

/**
 * Shopfront rate calculator.
 *
 * Prefers the live /quote endpoint so the shopfront can never quote a price the
 * product would not honour. When the API cannot be reached it falls back to the
 * bundled corridor table, which runs the identical arithmetic, so someone
 * checking a rate always gets an answer instead of an error.
 *
 * The one case that does not fall back is a 503: that is the server saying it
 * holds no rate it is willing to honour. The bundled table would happily print
 * a number there, and it would be a number the product refuses at checkout, so
 * the panel says rates are unavailable instead of inventing a price.
 */
/**
 * Localised country name for an ISO code, e.g. KE -> "Kenya" / "كينيا".
 * Falls back to the bundled English label on engines without Intl.DisplayNames.
 */
function countryName(code: string, lang: string, fallback: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? fallback
  } catch {
    return fallback
  }
}

export function RateQuote() {
  const t = useT()
  const { lang } = useI18n()
  const [corridors, setCorridors] = useState<LocalCorridor[]>(CORRIDORS)
  const [corridorId, setCorridorId] = useState(CORRIDORS[0].id)
  const [amount, setAmount] = useState('200')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [live, setLive] = useState(false)
  const [ratesDown, setRatesDown] = useState(false)
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
        .then(({ quote }) => {
          setQuote(quote)
          setRatesDown(false)
        })
        .catch((err) => {
          // Only a refusal to price clears the panel. Anything else — offline,
          // a dropped connection — keeps the locally computed figure.
          if (err instanceof ApiError && err.status === 503) {
            setQuote(null)
            setRatesDown(true)
          }
        })
    }, 280)
    return () => clearTimeout(timer)
  }, [corridor, amountMinor, live])

  const belowMin = Number.isFinite(amountMinor) && corridor && amountMinor > 0 && amountMinor < corridor.minSendMinor

  /* Round numbers people actually send. Chips remove the need to type at all,
     which is the single biggest thing a rate calculator can do to feel quick. */
  const presets = ['100', '200', '500', '1000']

  return (
    <div className="rounded-[var(--radius-card)] border border-ink-200 bg-white p-6 shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-brand-600">
          {t('marketing.calcTitle')}
        </h2>
        {/* Only claims to be live when it actually is. The dot is the whole
            tell: a calculator that says "live rate" while serving a bundled
            table is worse than one that says nothing. */}
        {live && !ratesDown ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            {t('marketing.rate').toLowerCase()}
          </span>
        ) : null}
      </div>

      <label className="mt-5 block text-[12px] font-semibold text-ink-500" htmlFor="mk-amount">
        {t('marketing.youSend')}
      </label>

      {/*
        Focus halo. The rotating conic gradient sits behind the field and is
        clipped by the wrapper's own rounded box, so the light rides the border
        and never spills onto the card. The 2px padding is the only place it
        shows; the inner surface covers the rest.
      */}
      <div className="relative mt-1.5 overflow-hidden rounded-[var(--radius-card)] p-[2px]">
        <span
          aria-hidden="true"
          className={`halo-orbit pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_200deg,var(--color-brand-400)_290deg,var(--color-brand-600)_330deg,transparent_360deg)] transition-opacity duration-300 ${
            focused ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative flex items-center gap-2 rounded-[var(--radius-card)] bg-white px-4 py-3.5 transition-shadow ${
            focused ? 'ring-1 ring-brand-200' : 'ring-1 ring-ink-200'
          }`}
        >
          <span className="text-[16px] font-bold text-ink-500">$</span>
          <input
            ref={inputRef}
            id="mk-amount"
            inputMode="decimal"
            value={amount}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-[22px] font-semibold tabular-nums outline-none"
          />
          <span className="text-[13px] font-semibold text-ink-500">USD</span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = amount === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              aria-pressed={active}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold tabular-nums transition-colors ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'bg-canvas text-ink-600 ring-1 ring-ink-200 hover:bg-brand-50 hover:text-brand-600 hover:ring-brand-200'
              }`}
            >
              ${p}
            </button>
          )
        })}
      </div>

      <label className="mt-5 block text-[12px] font-semibold text-ink-500" htmlFor="mk-dest">
        {t('marketing.destination')}
      </label>
      <select
        id="mk-dest"
        value={corridorId}
        onChange={(e) => setCorridorId(e.target.value)}
        className="mt-1.5 w-full rounded-[var(--radius-card)] bg-white px-4 py-3.5 text-[14px] font-semibold outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
      >
        {corridors.map((c) => (
          <option key={c.id} value={c.id}>
            {countryName(c.receive_country, lang, c.label)} · {c.receive_currency}
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
        ) : ratesDown ? (
          <p className="text-[13px] font-medium text-ink-500">{t('marketing.ratesUnavailable')}</p>
        ) : quote ? (
          <>
            <Row label={t('marketing.fee')} value={money(quote.feeMinor, quote.sendCurrency)} />
            <Row
              label={t('marketing.rate')}
              value={`1 ${quote.sendCurrency} = ${(quote.effectiveRateE8 / 1e8).toFixed(4)} ${quote.receiveCurrency}`}
            />
            <Row label={t('marketing.totalCharged')} value={money(quote.totalChargedMinor, quote.sendCurrency)} />
            {/*
              The one figure a visitor is actually here for, so it gets the
              navy and the size. Everything above it is the working; this is the
              answer. Wise puts this number at the bottom in the same weight as
              the fee, which buries it.
            */}
            <div className="mt-4 rounded-xl bg-brand-600 px-4 py-4">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-brand-300">
                {t('marketing.theyReceive')}
              </span>
              <span className="mt-1 block text-[28px] font-semibold leading-none tabular-nums tracking-tight text-white">
                {money(quote.receiveAmountMinor, quote.receiveCurrency)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-ink-500">{t('marketing.calculating')}</p>
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
