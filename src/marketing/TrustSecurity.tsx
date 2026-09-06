import { Eye, FileLock2, ShieldCheck, UserCheck } from 'lucide-react'
import { useT } from '../i18n'
import { useReveal } from '../lib/useReveal'

/**
 * Why a stranger should hand this product their money.
 *
 * Every line here is something the product actually does today, phrased the
 * way the rest of the codebase phrases claims: specifically, and only about
 * what is true right now. No badge graphics for certifications that have not
 * been issued, no "bank-level" hand-wave — the four things that are real:
 * encryption in transit, a ledger every entry is checked against, a named
 * person behind every account action, and a rate that is shown before it is
 * charged.
 */
export function TrustSecurity() {
  const t = useT()
  const { ref, visible } = useReveal<HTMLDivElement>()

  const points = [
    { Icon: FileLock2, title: t('marketing.tr1Title'), body: t('marketing.tr1Body') },
    { Icon: ShieldCheck, title: t('marketing.tr2Title'), body: t('marketing.tr2Body') },
    { Icon: UserCheck, title: t('marketing.tr3Title'), body: t('marketing.tr3Body') },
    { Icon: Eye, title: t('marketing.tr4Title'), body: t('marketing.tr4Body') },
  ]

  return (
    <section className="border-t border-ink-200 bg-white">
      <div
        ref={ref}
        className="mx-auto max-w-6xl px-6 py-16 md:py-20"
      >
        <div className="max-w-2xl">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
            {t('marketing.trustKicker')}
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-brand-700">
            {t('marketing.trustTitle')}
          </h2>
          <p className="mt-3 max-w-prose text-[14.5px] leading-relaxed text-ink-500">
            {t('marketing.trustBody')}
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ Icon, title, body }, i) => (
            <div
              key={title}
              style={visible ? { animationDelay: `${i * 90}ms` } : undefined}
              className={`bg-white p-6 ${visible ? 'animate-fade-up' : 'opacity-0'}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-200/60">
                <Icon size={18} strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-[14.5px] font-semibold tracking-tight text-brand-700">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
