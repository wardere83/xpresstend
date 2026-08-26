import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, ShieldCheck, Zap } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { api, money, type Corridor, type Quote } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

/** Public shopfront. Everything here is readable without an account. */
export function Marketing() {
  const t = useT()
  const { user } = useAuth()
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [corridorId, setCorridorId] = useState('')
  const [amount, setAmount] = useState('200')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ corridors: Corridor[] }>('/corridors')
      .then(({ corridors }) => {
        setCorridors(corridors)
        setCorridorId((id) => id || (corridors[0]?.id ?? ''))
      })
      .catch(() => setQuoteError(t('marketing.ratesUnavailable')))
  }, [t])

  const amountMinor = useMemo(() => {
    const n = Number.parseFloat(amount.replace(/,/g, ''))
    return Number.isFinite(n) ? Math.round(n * 100) : NaN
  }, [amount])

  // Re-price as the sender types, but only once they have paused.
  useEffect(() => {
    if (!corridorId || !Number.isFinite(amountMinor)) return
    const timer = setTimeout(() => {
      api
        .post<{ quote: Quote }>('/quote', { corridorId, sendAmountMinor: amountMinor })
        .then(({ quote }) => {
          setQuote(quote)
          setQuoteError(null)
        })
        .catch((err: { message?: string }) => {
          setQuote(null)
          setQuoteError(err.message ?? t('marketing.ratesUnavailable'))
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [corridorId, amountMinor, t])

  const selected = corridors.find((c) => c.id === corridorId)

  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
              <svg width="18" height="18" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M10 34h9l4-11 6 21 6-25 5 15h14" stroke="#fff" strokeWidth="6"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[17px] font-extrabold tracking-tight">{brand.name}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <Link to="/app" className="rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white">
                {t('marketing.openApp')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-4 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas">
                  {t('marketing.signIn')}
                </Link>
                <Link to="/register" className="rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white">
                  {t('marketing.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl">
              {t('marketing.heroTitle')}
            </h1>
            <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-ink-500">
              {t('marketing.heroBody')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-brand-700">
                {t('marketing.getStarted')} <ArrowRight size={16} />
              </Link>
              <Link to="/app"
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 px-6 py-3 text-[14px] font-semibold text-ink-700 transition hover:bg-canvas">
                {t('marketing.tryDemo')}
              </Link>
            </div>
            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-ink-200/70 pt-6">
              {([['5', 'marketing.statLanguages'], ['24/7', 'marketing.statSupport'], ['0', 'marketing.statHidden']] as const)
                .map(([value, key]) => (
                  <div key={key}>
                    <dt className="text-2xl font-extrabold tabular-nums">{value}</dt>
                    <dd className="mt-1 text-[12px] leading-snug text-ink-500">{t(key)}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Live pricing straight off the API — the same quote endpoint the app uses. */}
          <div className="rounded-[24px] border border-ink-200/70 bg-canvas p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-[15px] font-bold">{t('marketing.calcTitle')}</h2>
            <label className="mt-4 block text-[12px] font-semibold text-ink-500" htmlFor="mk-amount">
              {t('marketing.youSend')}
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-ink-200">
              <span className="text-[15px] font-bold text-ink-400">$</span>
              <input id="mk-amount" inputMode="decimal" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-[20px] font-extrabold tabular-nums outline-none" />
              <span className="text-[13px] font-semibold text-ink-400">USD</span>
            </div>

            <label className="mt-4 block text-[12px] font-semibold text-ink-500" htmlFor="mk-dest">
              {t('marketing.destination')}
            </label>
            <select id="mk-dest" value={corridorId} onChange={(e) => setCorridorId(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-semibold outline-none ring-1 ring-ink-200">
              {corridors.map((c) => (
                <option key={c.id} value={c.id}>{c.receive_country} · {c.receive_currency}</option>
              ))}
            </select>

            <div className="mt-5 space-y-2 border-t border-ink-200/70 pt-4 text-[13px]">
              {quoteError ? (
                <p className="text-[13px] font-medium text-ink-500">{quoteError}</p>
              ) : quote ? (
                <>
                  <Row label={t('marketing.fee')} value={money(quote.feeMinor, quote.sendCurrency)} />
                  <Row label={t('marketing.rate')}
                       value={`1 ${quote.sendCurrency} = ${(quote.effectiveRateE8 / 1e8).toFixed(4)} ${quote.receiveCurrency}`} />
                  <Row label={t('marketing.totalCharged')}
                       value={money(quote.totalChargedMinor, quote.sendCurrency)} />
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
            {selected ? (
              <p className="mt-3 text-[11px] leading-snug text-ink-400">
                {t('marketing.limits', {
                  min: money(selected.min_send_minor, selected.send_currency),
                  max: money(selected.max_send_minor, selected.send_currency),
                })}
              </p>
            ) : null}
          </div>
        </section>

        <section className="border-y border-ink-200/70 bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
            {([
              [Zap, 'marketing.f1Title', 'marketing.f1Body'],
              [ShieldCheck, 'marketing.f2Title', 'marketing.f2Body'],
              [Lock, 'marketing.f3Title', 'marketing.f3Body'],
            ] as const).map(([Icon, title, body]) => (
              <div key={title}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 text-[15px] font-bold">{t(title)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{t(body)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight">{t('marketing.ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-prose text-[15px] text-ink-500">{t('marketing.ctaBody')}</p>
          <Link to="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-[14px] font-semibold text-white transition hover:bg-brand-700">
            {t('marketing.getStarted')} <ArrowRight size={16} />
          </Link>
        </section>
      </main>

      <footer className="border-t border-ink-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 text-[12px] leading-relaxed text-ink-400">
          <p className="font-semibold text-ink-700">{brand.name}</p>
          <p className="mt-1">{brand.hq.line1}, {brand.hq.city}, {brand.hq.state} {brand.hq.zip}</p>
          <p className="mt-3 max-w-prose">{t('marketing.disclaimer')}</p>
          <p className="mt-4">© {new Date().getFullYear()} {brand.name}</p>
        </div>
      </footer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}
