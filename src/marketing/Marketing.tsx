import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Play } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Logo'
import { useAuth } from '../auth/AuthContext'
import { DownloadAppMenu } from './DownloadAppMenu'
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
      <header className="brand-header">
        <div className="brand-header-inner brand-width">
          <Link to="/" aria-label={brand.name} className="brand-wordmark">
            <Logo height={34} />
          </Link>
          <nav aria-label={copy.experience} className="brand-nav">
            <button
              className="brand-nav-experience"
              onClick={() => scrollTo('experience')}
            >
              {copy.experience}
            </button>
            <DownloadAppMenu />
            <LanguageSwitcher />
            <Link className="brand-nav-account" to={user ? '/app' : '/login'}>
              {t(user ? 'marketing.openApp' : 'marketing.signIn')}{' '}
              <ArrowUpRight size={14} />
            </Link>
          </nav>
        </div>
      </header>
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
      <footer className="brand-footer brand-width">
        <div className="brand-footer-top">
          <div className="brand-footer-brand">
            <Link to="/" aria-label={brand.name}>
              <Logo variant="full" height={44} />
            </Link>
            <p>
              {brand.hq.city}, {brand.hq.state}, {brand.hq.country}
            </p>
            <p>
              <a href={`mailto:${brand.support.email}`}>{brand.support.email}</a>
              <br />
              <a href={`tel:${brand.support.phone.replace(/[^+\d]/g, '')}`}>
                {brand.support.phone}
              </a>
            </p>
          </div>
          <nav className="brand-footer-columns" aria-label={copy.footerCompany}>
            <div>
              <h2>{copy.footerCompany}</h2>
              <Link to="/company">{copy.trustCompany}</Link>
              <Link to="/compliance">{copy.trustCompliance}</Link>
              <Link to="/security">{copy.trustSecurity}</Link>
              <Link to="/partners">{copy.trustPartners}</Link>
            </div>
            <div>
              <h2>{copy.footerProduct}</h2>
              <Link to={user ? '/app' : '/login'}>
                {t(user ? 'marketing.openApp' : 'marketing.signIn')}
              </Link>
              <Link to="/register">{t('marketing.getStarted')}</Link>
              <Link to="/support">{t('quick.support')}</Link>
            </div>
            <div>
              <h2>{copy.footerLegal}</h2>
              <Link to="/privacy">Privacy</Link>
              <a href={brand.nmls.verifyUrl} target="_blank" rel="noopener noreferrer">
                NMLS ID {brand.nmls.id}
              </a>
            </div>
          </nav>
        </div>
        <div className="brand-footer-bottom">
          <p className="brand-footer-legal">
            {/*
              The registration, then the link that settles what it means, then
              where the company actually stands. Stated rather than tucked into
              a disclosure toggle: the readers this page is for establish it in
              minutes anyway, and finding it stated is what makes the rest of
              the page credible.
            */}
            {brand.legal.licence}{' '}
            <a href={brand.nmls.verifyUrl} target="_blank" rel="noopener noreferrer">
              Verify at NMLS Consumer Access
            </a>
            .
          </p>
          <p className="brand-footer-legal">{brand.legal.operatingStatus}</p>
          <p className="brand-footer-copyright">
            © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
