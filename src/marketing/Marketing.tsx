import { Link } from 'react-router-dom'
import { ArrowRight, Lock, ShieldCheck, Zap } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Logo'
import { useAuth } from '../auth/AuthContext'
import { HeroRotator } from './HeroRotator'
import { GetTheApp } from './GetTheApp'
import { RateQuote } from './RateQuote'
import { TransferRoute } from './TransferRoute'
import { TrustSecurity } from './TrustSecurity'
import { HowItWorks } from './HowItWorks'
import { SavingsCompare } from './SavingsCompare'
import { scrollToSection } from '../lib/scrollToSection'

/**
 * Public shopfront. Everything here is readable without an account.
 *
 * The visual register is deliberately restrained. Competitors in this market
 * lean on saturated colour, heavy type and large soft shadows, which reads
 * consumer and, for a company asking a regulator for a money transmitter
 * licence, slightly unserious. This page instead uses one dark navy surface,
 * turquoise only where the eye should actually go, hairline rules, and type
 * that is large but light. Restraint is the whole idea: it is what a bank's
 * site looks like, and it costs nothing to do properly.
 */
export function Marketing() {
  const t = useT()
  const { user } = useAuth()

  /* Buttons are defined once. Every call to action on the page is one of these
     two, which is what keeps the hierarchy legible: a visitor should never have
     to work out which control matters. */
  const primaryButton =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 ' +
    'text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 ' +
    'focus-visible:outline-brand-400'
  const secondaryButton =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-ink-200 px-6 py-3 ' +
    'text-[14px] font-semibold text-ink-700 transition-colors hover:border-ink-300 hover:bg-canvas'

  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link to="/" className="flex items-center" aria-label={brand.name}>
            <Logo height={30} />
          </Link>

          <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Page sections">
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="text-[13px] font-medium text-ink-600 transition-colors hover:text-brand-600">
              {t('marketing.navHow')}
            </a>
            <a href="#security" onClick={scrollToSection('security')} className="text-[13px] font-medium text-ink-600 transition-colors hover:text-brand-600">
              {t('marketing.navSecurity')}
            </a>
            <a href="#pricing" onClick={scrollToSection('pricing')} className="text-[13px] font-medium text-ink-600 transition-colors hover:text-brand-600">
              {t('marketing.navPricing')}
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <a
              href="#get-the-app"
              onClick={scrollToSection('get-the-app')}
              className="hidden rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-600 transition-colors hover:text-ink-900 sm:block"
            >
              {t('app.android').split(' ')[0]}
            </a>
            <LanguageSwitcher />
            {user ? (
              <Link
                to="/app"
                className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {t('marketing.openApp')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-600 transition-colors hover:text-ink-900"
                >
                  {t('marketing.signIn')}
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  {t('marketing.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          {/* A quiet gradient wash behind the fold only — two blooms, well off
              to the sides, so the type and the calculator both still read on
              flat white. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-brand-100/70 blur-3xl" />
            <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-brand-50 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16 md:py-24">
          <div>
            {/*
              Large but not heavy. The previous heading capped at about 34px in
              extrabold, which is the reverse of how confident type works: size
              carries the emphasis, weight only adds noise once the size is
              there.
            */}
            <h1 className="text-balance text-[clamp(2.25rem,5.4vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-brand-600">
              {t('marketing.heroTitle')}
            </h1>
            <div className="mt-6">
              <HeroRotator />
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register" className={primaryButton}>
                {t('marketing.getStarted')} <ArrowRight size={16} />
              </Link>
              <Link to="/app" className={secondaryButton}>
                {t('marketing.tryDemo')}
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-ink-200 pt-7">
              {(
                [
                  [t('marketing.statMany'), 'marketing.statLanguages'],
                  ['24/7', 'marketing.statSupport'],
                  ['0', 'marketing.statHidden'],
                ] as const
              ).map(([value, key]) => (
                <div key={key}>
                  <dt className="text-[26px] font-semibold tabular-nums tracking-tight text-brand-600">
                    {value}
                  </dt>
                  <dd className="mt-1.5 text-[12px] leading-snug text-ink-500">{t(key)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <RateQuote />
          </div>
        </section>

        <TransferRoute />

        <section className="border-t border-ink-200">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3 md:gap-12 md:py-20">
            {(
              [
                [Zap, 'marketing.f1Title', 'marketing.f1Body'],
                [ShieldCheck, 'marketing.f2Title', 'marketing.f2Body'],
                [Lock, 'marketing.f3Title', 'marketing.f3Body'],
              ] as const
            ).map(([Icon, title, body]) => (
              <div key={title}>
                {/* The one place turquoise appears on a light ground. Used on
                    all three, it stays a system rather than a decoration. */}
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-200/60">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-brand-600">
                  {t(title)}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-500">{t(body)}</p>
              </div>
            ))}
          </div>
        </section>

        <div id="security">
          <TrustSecurity />
        </div>

        <HowItWorks />

        <div id="pricing">
          <SavingsCompare />
        </div>

        <GetTheApp />

        {/*
          The navy surface. The palette pairs navy with turquoise, and a brand
          that never actually shows its primary colour at full strength does not
          look like a brand. One band, once, at the point of decision.
        */}
        <section className="bg-brand-600">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
            <h2 className="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
              {t('marketing.ctaTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-prose text-[15px] leading-relaxed text-brand-200">
              {t('marketing.ctaBody')}
            </p>
            <Link
              to="/register"
              className="mt-9 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-400 px-7 py-3.5 text-[14px] font-semibold text-brand-600 transition-colors hover:bg-white"
            >
              {t('marketing.getStarted')} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <Logo height={22} />
              <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed text-ink-500">
                {t('marketing.footerAbout')}
              </p>
              <p className="mt-4 text-[12.5px] text-ink-500">
                {brand.hq.city}, {brand.hq.state}
              </p>
            </div>

            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                {t('marketing.footerCompany')}
              </h3>
              <ul className="mt-3 space-y-2.5 text-[13px]">
                <li>
                  <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="text-ink-600 transition-colors hover:text-brand-600">
                    {t('marketing.navHow')}
                  </a>
                </li>
                <li>
                  <a href="#security" onClick={scrollToSection('security')} className="text-ink-600 transition-colors hover:text-brand-600">
                    {t('marketing.navSecurity')}
                  </a>
                </li>
                <li>
                  <a href="#pricing" onClick={scrollToSection('pricing')} className="text-ink-600 transition-colors hover:text-brand-600">
                    {t('marketing.navPricing')}
                  </a>
                </li>
                <li>
                  <Link to="/privacy" className="text-ink-600 transition-colors hover:text-brand-600">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                {t('marketing.footerSupport')}
              </h3>
              <ul className="mt-3 space-y-2.5 text-[13px]">
                <li>
                  <Link to="/support" className="text-ink-600 transition-colors hover:text-brand-600">
                    Support
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${brand.support.email}`} className="text-ink-600 transition-colors hover:text-brand-600">
                    {brand.support.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${brand.support.phone}`} className="text-ink-600 transition-colors hover:text-brand-600">
                    {brand.support.phone}
                  </a>
                </li>
                <li className="text-ink-500">{brand.support.hours}</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-ink-200/70 pt-6">
            <p className="max-w-prose text-[12px] leading-relaxed text-ink-500">{t('marketing.disclaimer')}</p>
            <p className="mt-4 text-[12px] text-ink-500">
              © {new Date().getFullYear()} {brand.name}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
