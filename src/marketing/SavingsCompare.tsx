import { useT } from '../i18n'
import { useReveal } from '../lib/useReveal'
import { CORRIDORS, quoteLocally } from './pricing'

/**
 * What a $500 transfer actually costs here versus the two extra charges a
 * bank wire typically stacks on top of its flat fee.
 *
 * The XpressTend bar is computed from the live corridor table — the same
 * function the calculator above runs — so it can never drift from what the
 * product would actually charge. The bank comparison is a labelled estimate,
 * not a quote from a named competitor: a $25–$45 wire fee plus a marked-up
 * exchange rate is the standard, widely documented structure of a bank
 * international transfer, not a claim about any specific bank.
 */
export function SavingsCompare() {
  const t = useT()
  const { ref, visible } = useReveal<HTMLDivElement>()

  const AMOUNT = 50000 // $500.00 in minor units
  const corridor = CORRIDORS[0]
  const quote = quoteLocally(corridor, AMOUNT)
  const usFeeDollars = quote ? quote.feeMinor / 100 : 0

  // Illustrative bank-wire estimate: a flat wire fee plus a typical FX markup
  // on the mid-market rate, both figures commonly cited for international
  // bank wires rather than pulled from any one institution's rate card.
  const bankFlat = 30
  const bankMarkupPct = 3
  const bankTotal = bankFlat + AMOUNT / 100 * (bankMarkupPct / 100)

  const maxBar = Math.max(bankTotal, usFeeDollars)
  const pct = (v: number) => `${Math.max(6, (v / maxBar) * 100)}%`

  return (
    <section className="border-t border-ink-200 bg-white">
      <div ref={ref} className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_1fr] md:items-center md:py-20">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
            {t('marketing.saveKicker')}
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-brand-700">
            {t('marketing.saveTitle')}
          </h2>
          <p className="mt-3 max-w-prose text-[14.5px] leading-relaxed text-ink-500">
            {t('marketing.saveBody')}
          </p>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-500">{t('marketing.saveNote')}</p>
        </div>

        <div className={`card p-6 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          <p className="text-[12px] font-semibold text-ink-500">{t('marketing.saveExample')}</p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-medium text-ink-600">{t('marketing.saveBankLabel')}</span>
                <span className="font-semibold tabular-nums text-ink-700">${bankTotal.toFixed(2)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-ink-300 transition-[width] duration-700 ease-out"
                  style={{ width: visible ? pct(bankTotal) : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-medium text-brand-600">{t('marketing.saveUsLabel')}</span>
                <span className="font-semibold tabular-nums text-brand-600">${usFeeDollars.toFixed(2)}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-400 transition-[width] duration-700 ease-out delay-150"
                  style={{ width: visible ? pct(usFeeDollars) : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3.5 ring-1 ring-brand-200/60">
            <span className="text-[12.5px] font-medium text-brand-700">{t('marketing.saveKeepMore')}</span>
            <span className="text-[16px] font-semibold tabular-nums text-brand-600">
              ${(bankTotal - usFeeDollars).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
