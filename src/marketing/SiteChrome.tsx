import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Logo'
import { useAuth } from '../auth/AuthContext'
import { DownloadAppMenu } from './DownloadAppMenu'
import { useBrandCopy } from './brandCopy'
import './marketing.css'

/**
 * The header and footer every public page wears.
 *
 * They were two implementations before this: the landing page had the brand
 * chrome, and the company, compliance, security, privacy and support pages had
 * a plainer one of their own with a different lockup, no language switcher and
 * no way back into the product. A reader following a footer link from the
 * landing page crossed a visible seam and arrived somewhere that looked like a
 * different site — which, on the pages a partner reads to decide whether this
 * is a real company, is the opposite of what those pages are for.
 *
 * One component each now, so "identical" is a property of the code rather than
 * something that has to be maintained by hand in two places.
 */

/**
 * `onExperience` is the landing page's in-page jump to the product section.
 * It is passed only there, because the section it scrolls to exists only there;
 * a header link that silently does nothing is worse than one that is absent.
 */
export function SiteHeader({ onExperience }: { onExperience?: () => void }) {
  const t = useT()
  const copy = useBrandCopy()
  const { user } = useAuth()
  return (
    <header className="brand-header">
      <div className="brand-header-inner brand-width">
        <Link to="/" aria-label={brand.name} className="brand-wordmark">
          <Logo height={34} />
        </Link>
        <nav aria-label={copy.experience} className="brand-nav">
          {onExperience ? (
            <button className="brand-nav-experience" onClick={onExperience}>
              {copy.experience}
            </button>
          ) : null}
          <DownloadAppMenu />
          <LanguageSwitcher />
          <Link className="brand-nav-account" to={user ? '/app' : '/login'}>
            {t(user ? 'marketing.openApp' : 'marketing.signIn')}{' '}
            <ArrowUpRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const t = useT()
  const copy = useBrandCopy()
  const { user } = useAuth()
  return (
    <footer className="brand-footer brand-width">
      <div className="brand-footer-top">
        <div className="brand-footer-brand">
          <Link to="/" aria-label={brand.name}>
            <Logo variant="full" height={44} />
          </Link>
          <p>
            {brand.hq.city}, {brand.hq.state}, {brand.hq.country}
          </p>
          {/* Latin-script contact details, marked LTR so Arabic does not
              reorder them: an RTL paragraph renders "+1 (206) 331-9867" as
              "331-9867 (206) 1+", which is a phone number no one can dial. */}
          <p dir="ltr">
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
            {/* One label, one route. The support page was reachable from two
                columns under two different names, which reads as two
                destinations until you click both. */}
            <Link to="/support">{copy.footerSupport}</Link>
          </div>
          <div>
            <h2>{copy.footerLegal}</h2>
            <Link to="/privacy">{copy.footerPrivacy}</Link>
            <a href={brand.nmls.verifyUrl} target="_blank" rel="noopener noreferrer">
              NMLS ID {brand.nmls.id}
            </a>
          </div>
        </nav>
      </div>
      {/*
        The registration, the operating status and the copyright are English
        whatever the interface language, because they name a US entity and a US
        register. Marked LTR so an Arabic page does not right-align them and
        move their full stops to the front of the sentence.
      */}
      <div className="brand-footer-bottom" dir="ltr">
        <p className="brand-footer-legal">
          {/*
            The registration, then the link that settles what it means, then
            where the company actually stands. Stated rather than tucked into
            a disclosure toggle: the readers these pages are for establish it
            in minutes anyway, and finding it stated is what makes the rest of
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
  )
}
