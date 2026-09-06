import { useT } from '../i18n'
import { useReveal } from '../lib/useReveal'

/**
 * Three steps, drawn as a single connected line rather than three
 * disconnected cards — the point of this section is that it is one
 * continuous action from a visitor's side, not three separate ones.
 */
export function HowItWorks() {
  const t = useT()
  const { ref, visible } = useReveal<HTMLDivElement>()

  const steps = [
    { title: t('marketing.step1Title'), body: t('marketing.step1Body') },
    { title: t('marketing.step2Title'), body: t('marketing.step2Body') },
    { title: t('marketing.step3Title'), body: t('marketing.step3Body') },
  ]

  return (
    <section id="how-it-works" className="border-t border-ink-200 bg-canvas">
      <div ref={ref} className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="max-w-2xl">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-brand-600">
            {t('marketing.howKicker')}
          </span>
          <h2 className="mt-3 text-balance text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-brand-700">
            {t('marketing.howTitle')}
          </h2>
        </div>

        <ol className="relative mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {/* The connector. Absolutely positioned behind the numbers, and only
              between them — inset by half a column so it never overshoots
              the first or last node. */}
          <div
            aria-hidden="true"
            className="absolute top-5 left-[16.5%] right-[16.5%] hidden h-px bg-ink-200 sm:block"
          />
          {steps.map((step, i) => (
            <li
              key={step.title}
              style={visible ? { animationDelay: `${i * 110}ms` } : undefined}
              className={`relative ${visible ? 'animate-fade-up' : 'opacity-0'}`}
            >
              <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-[14px] font-semibold text-white ring-4 ring-canvas">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-brand-700">{step.title}</h3>
              <p className="mt-2 max-w-[26ch] text-[13.5px] leading-relaxed text-ink-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
