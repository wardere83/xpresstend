import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Info } from 'lucide-react'
import { useT } from '../i18n'
import { api, money, type Corridor, type Quote } from '../lib/api'
import { COMPETITOR_RATES, type CompetitorRate } from './competitors'

interface Row {
  provider: string
  totalCostPct: number
  costMinor: number
  isUs: boolean
  rate?: CompetitorRate
}

/**
 * Side-by-side cost comparison against published competitor pricing.
 *
 * Our column is a live quote from the same /quote endpoint the product uses.
 * Every other column is a sourced, dated figure from competitors.ts, shown
 * with its citation so a reader can check it rather than take our word.
 */
export function RateCompare() {
  const t = useT()
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [corridorId, setCorridorId] = useState('')
  const [amount, setAmount] = useState('200')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api
      .get<{ corridors: Corridor[] }>('/corridors')
      .then(({ corridors }) => {
        setCorridors(corridors)
        setCorridorId((id) => id || (corridors[0]?.id ?? ''))
      })
      .catch(() => setError(t('marketing.ratesUnavailable')))
  }, [t])

  const amountMinor = useMemo(() => {
    const n = Number.parseFloat(amount.replace(/,/g, ''))
    return Number.isFinite(n) ? Math.round(n * 100) : NaN
  }, [amount])

  useEffect(() => {
    if (!corridorId || !Number.isFinite(amountMinor)) return
    const timer = setTimeout(() => {
      api
        .post<{ quote: Quote }>('/quote', { corridorId, sendAmountMinor: amountMinor })
        .then(({ quote }) => { setQuote(quote); setError(null) })
        .catch((err: { message?: string }) => {
          setQuote(null)
          setError(err.message ?? t('marketing.ratesUnavailable'))
        })
    }, 280)
    return () => clearTimeout(timer)
  }, [corridorId, amountMinor, t])

  const corridor = corridors.find((c) => c.id === corridorId)
  const competitors = corridor ? (COMPETITOR_RATES[corridor.receive_country] ?? []) : []

  const rows: Row[] = useMemo(() => {
    if (!quote || !Number.isFinite(amountMinor) || amountMinor <= 0) return []
    const ours: Row = {
      provider: 'XpressTend',
      totalCostPct: (quote.totalChargedMinor - quote.sendAmountMinor) / amountMinor * 100,
      costMinor: quote.totalChargedMinor - quote.sendAmountMinor,
      isUs: true,
    }
    const theirs: Row[] = competitors.map((c) => ({
      provider: c.provider,
      totalCostPct: c.totalCostPct,
      costMinor: Math.round((c.totalCostPct / 100) * amountMinor),
      isUs: false,
      rate: c,
    }))
    return [ours, ...theirs].sort((a, b) => a.totalCostPct - b.totalCostPct)
  }, [quote, competitors, amountMinor])

  const worst = rows.length ? Math.max(...rows.map((r) => r.totalCostPct)) : 1
  const ours = rows.find((r) => r.isUs)
  const cheapestRival = rows.find((r) => !r.isUs)
  // Only a real saving if we actually rank first; otherwise this would be negative.
  const weAreCheapest = rows.length > 0 && rows[0].isUs
  const saving =
    weAreCheapest && ours && cheapestRival ? cheapestRival.costMinor - ours.costMinor : 0

  return (
    <section className="mx-auto max-w-6xl px-5 py-14" id="compare">
      <h2 className="text-balance text-3xl font-extrabold tracking-tight">{t('compare.title')}</h2>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-500">{t('compare.intro')}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
        {/* ---- controls ---- */}
        <div className="rounded-[24px] border border-ink-200/70 bg-canvas p-6">
          <label className="block text-[12px] font-semibold text-ink-500" htmlFor="cmp-amount">
            {t('marketing.youSend')}
          </label>

          {/* Halo: a soft brand-coloured glow that blooms while the field is focused. */}
          <div className="relative mt-2">
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -inset-3 rounded-[30px] bg-brand-500/25 blur-xl transition-all duration-500 ${
                focused ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
              }`}
            />
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -inset-0.5 rounded-[22px] bg-gradient-to-br from-brand-400 to-brand-700 transition-opacity duration-300 ${
                focused ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              onClick={() => inputRef.current?.focus()}
              className="relative flex items-center gap-2 rounded-[20px] bg-white px-4 py-3.5 ring-1 ring-ink-200"
            >
              <span className="text-[16px] font-bold text-ink-400">$</span>
              <input
                ref={inputRef}
                id="cmp-amount"
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

          <label className="mt-5 block text-[12px] font-semibold text-ink-500" htmlFor="cmp-dest">
            {t('marketing.destination')}
          </label>
          <select
            id="cmp-dest"
            value={corridorId}
            onChange={(e) => setCorridorId(e.target.value)}
            className="mt-1.5 w-full rounded-[20px] bg-white px-4 py-3.5 text-[14px] font-semibold outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          >
            {corridors.map((c) => (
              <option key={c.id} value={c.id}>{c.receive_country} · {c.receive_currency}</option>
            ))}
          </select>

          <div className="mt-5 flex flex-wrap gap-2">
            {['100', '200', '500', '1000'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  amount === v ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-brand-400'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>

          {quote ? (
            <div className="mt-6 rounded-[20px] bg-brand-50 px-4 py-4">
              <p className="text-[12px] font-semibold text-brand-700">{t('marketing.theyReceive')}</p>
              <p className="mt-1 text-[24px] font-extrabold tabular-nums text-brand-700">
                {money(quote.receiveAmountMinor, quote.receiveCurrency)}
              </p>
              {saving > 0 ? (
                <p className="mt-2 text-[12px] font-semibold text-emerald-700">
                  {t('compare.saving', { amount: money(saving, quote.sendCurrency) })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ---- comparison ---- */}
        <div>
          {error ? (
            <p className="rounded-[20px] bg-canvas px-5 py-8 text-center text-[13px] text-ink-500">{error}</p>
          ) : rows.length === 0 ? (
            <p className="rounded-[20px] bg-canvas px-5 py-8 text-center text-[13px] text-ink-400">
              {t('marketing.calculating')}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((r, i) => (
                <li
                  key={r.provider}
                  className={`rounded-[18px] px-4 py-3.5 ring-1 transition ${
                    r.isUs ? 'bg-brand-50 ring-brand-300' : 'bg-white ring-ink-200/70'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className={`text-[14px] font-bold ${r.isUs ? 'text-brand-700' : ''}`}>
                      {r.provider}
                    </span>
                    {i === 0 ? (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {t('compare.cheapest')}
                      </span>
                    ) : null}
                    <span className="ml-auto text-[15px] font-extrabold tabular-nums">
                      {money(r.costMinor, quote?.sendCurrency ?? 'USD')}
                    </span>
                    <span className="w-14 text-right text-[12px] font-semibold tabular-nums text-ink-400">
                      {r.totalCostPct.toFixed(2)}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-200/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        r.isUs ? 'bg-gradient-to-r from-brand-400 to-brand-700' : 'bg-ink-400/60'
                      }`}
                      style={{ width: `${Math.max(3, (r.totalCostPct / worst) * 100)}%` }}
                    />
                  </div>

                  {r.rate ? (
                    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[11px] leading-snug text-ink-400">
                      <span>{r.rate.basis}.</span>
                      <a
                        href={r.rate.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2"
                      >
                        {r.rate.sourceLabel} <ExternalLink size={10} />
                      </a>
                      <span>· {r.rate.asOf}</span>
                      {r.rate.understated ? <span className="text-amber-700">· {t('compare.excludesMargin')}</span> : null}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-brand-700/70">{t('compare.ourLive')}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {competitors.length === 0 && corridor ? (
            <p className="mt-4 text-[12px] text-ink-400">{t('compare.noData')}</p>
          ) : null}

          <p className="mt-5 flex gap-2 text-[11px] leading-relaxed text-ink-400">
            <Info size={14} className="mt-px shrink-0" />
            <span>{t('compare.disclaimer')}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
