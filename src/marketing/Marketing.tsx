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
      </main>
      <footer className="brand-footer brand-width">
        <div className="brand-footer-top">
          <Link to="/" aria-label={brand.name}>
            <Logo height={34} />
          </Link>
          <nav aria-label="Support">
            <Link to={user ? '/app' : '/login'}>
              {t(user ? 'marketing.openApp' : 'marketing.signIn')}
            </Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/support">{t('quick.support')}</Link>
            <a href={`mailto:${brand.support.email}`}>{brand.support.email}</a>
          </nav>
        </div>
        <div className="brand-footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name} · {brand.hq.city},{' '}
            {brand.hq.state}
            {' · '}
            {/*
              Where a money services business is expected to show its NMLS ID,
              and linked so the reader can check the licence status themselves
              rather than taking a sentence on a marketing page for it.
            */}
            <a href={brand.nmls.verifyUrl} target="_blank" rel="noopener noreferrer">
              NMLS ID {brand.nmls.id}
            </a>
          </span>
          <details>
            <summary>{copy.availability}</summary>
            <p>{copy.availabilityBody}</p>
          </details>
        </div>
      </footer>
    </div>
  )
}
