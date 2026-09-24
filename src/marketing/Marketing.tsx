import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Play } from 'lucide-react'
import { useT } from '../i18n'
import { useAuth } from '../auth/AuthContext'
import { SiteFooter, SiteHeader } from './SiteChrome'
import { GetTheApp } from './GetTheApp'
import { RateQuote } from './RateQuote'
import { BrandFilm } from './BrandFilm'
import { AppShowcase } from './AppShowcase'
import { useBrandCopy } from './brandCopy'
import './marketing.css'

export function Marketing() {
  const t = useT()
  const copy = useBrandCopy()
  const { user, enterDemo } = useAuth()
  const navigate = useNavigate()
  const explore = () => {
    if (!user) enterDemo()
    navigate('/app')
  }
  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      })
  }
  return (
    <div className="brand-site">
      <a
        className="brand-skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        {copy.skip}
      </a>
      <SiteHeader onExperience={() => scrollTo('experience')} />
      <main id="main" tabIndex={-1}>
        <section className="brand-hero brand-width">
          <p className="brand-eyebrow">{copy.connected}</p>
          <h1>
            {copy.heroFirst}
            <br />
            <span>{copy.heroSecond}</span>
          </h1>
          <p className="brand-hero-intro">{copy.intro}</p>
          <div className="brand-actions">
            <button className="brand-primary" onClick={explore}>
              {t('marketing.tryDemo')} <ArrowUpRight size={16} />
            </button>
            <button
              className="brand-text-link"
              onClick={() => {
                scrollTo('brand-film')
                void document
                  .querySelector<HTMLVideoElement>('#brand-film video')
                  ?.play()
                  .catch(() => {})
              }}
            >
              {copy.watch} <Play size={14} />
            </button>
          </div>
        </section>
        <BrandFilm />
        <AppShowcase onExplore={explore} />
        <section className="brand-rates" aria-labelledby="rates-heading">
          <div className="brand-rates-inner brand-width">
            <div>
              <p className="brand-eyebrow">{copy.ratesEyebrow}</p>
              <h2 className="brand-display" id="rates-heading">
                {copy.ratesTitle}
              </h2>
              <p className="brand-body">{copy.ratesBody}</p>
              <Link to="/register" className="brand-text-link">
                {t('marketing.getStarted')} <ArrowUpRight size={17} />
              </Link>
            </div>
            <RateQuote />
          </div>
        </section>
        <GetTheApp onExplore={explore} />
        {/*
          The institutional layer. A consumer skims past it; a partner, a bank's
          onboarding team or an examiner is looking for exactly this, and its
          absence is what made the site read as a project rather than a company.
        */}
        <section className="brand-trust" aria-labelledby="trust-heading">
          <div className="brand-trust-inner brand-width">
            <div>
              <p className="brand-eyebrow">{copy.trustEyebrow}</p>
              <h2 className="brand-display" id="trust-heading">
                {copy.trustTitle}
              </h2>
              <p className="brand-body">{copy.trustBody}</p>
            </div>
            <ul className="brand-trust-links">
              {[
                { to: '/company', label: copy.trustCompany },
                { to: '/compliance', label: copy.trustCompliance },
                { to: '/security', label: copy.trustSecurity },
                { to: '/partners', label: copy.trustPartners },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>
                    {l.label}
                    <ArrowUpRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
