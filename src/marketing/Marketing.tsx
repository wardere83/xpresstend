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

/** Public shopfront. Everything here is readable without an account. */
export function Marketing() {
  const t = useT()
  const { user } = useAuth()

  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center" aria-label={brand.name}>
            <Logo height={32} />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <a href="#get-the-app"
               className="hidden rounded-full px-4 py-2 text-[13px] font-semibold text-ink-700 hover:bg-canvas sm:block">
              {t('app.android').split(' ')[0]}
            </a>
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
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.15fr_1fr] md:items-center md:py-20">
          <div>
            <h1 className="text-balance text-[clamp(1.75rem,4.2vw,2.125rem)] font-extrabold leading-[1.12] tracking-tight">
              {t('marketing.heroTitle')}
            </h1>
            <div className="mt-5">
              <HeroRotator />
            </div>
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
              {([[t('marketing.statMany'), 'marketing.statLanguages'], ['24/7', 'marketing.statSupport'], ['0', 'marketing.statHidden']] as const)
                .map(([value, key]) => (
                  <div key={key}>
                    <dt className="text-2xl font-extrabold tabular-nums">{value}</dt>
                    <dd className="mt-1 text-[12px] leading-snug text-ink-500">{t(key)}</dd>
                  </div>
                ))}
            </dl>
          </div>

          <RateQuote />
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 border-t border-ink-200/70 px-5 py-14 md:grid-cols-3">
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
        </section>

        <GetTheApp />

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
          <Logo height={20} className="mb-0.5" />
          <p className="mt-1">{brand.hq.line1}, {brand.hq.city}, {brand.hq.state} {brand.hq.zip}</p>
          <p className="mt-3 max-w-prose">{t('marketing.disclaimer')}</p>
          <p className="mt-4">© {new Date().getFullYear()} {brand.name}</p>
        </div>
      </footer>
    </div>
  )
}
