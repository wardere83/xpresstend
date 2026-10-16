import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, UserRound } from 'lucide-react'
import { useI18n, useT } from '../i18n'
import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { useBrandCopy } from '../marketing/brandCopy'
import { useCorporateCopy } from '../marketing/corporateCopy'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SiteBrand } from './SiteBrand'
import './public-header.css'

/** The same navigation stays available throughout the public website. */
export function PublicHeader({ className = '' }: { className?: string }) {
  const { dir } = useI18n()
  const t = useT()
  const p = useInterfaceCopy()
  const labels = useBrandCopy()
  const copy = useCorporateCopy()
  const location = useLocation()
  const header = useRef<HTMLElement>(null)
  const links = [
    { to: '/company', label: labels.trustCompany },
    { to: '/philanthropy', label: labels.trustPartners },
    { to: '/compliance', label: labels.trustCompliance },
    { to: '/security', label: labels.trustSecurity },
    { to: '/demo', label: copy.demoAction },
  ]
  const signIns = [
    { to: '/login', label: p('Customer sign in') },
    { to: '/admin', label: p('Staff sign in') },
    {
      to: '/institutional-reviewer',
      label: p('Institutional reviewer sign in'),
    },
  ]
  const closeOtherMenus = (opened: HTMLDetailsElement) => {
    if (!opened.open) return
    header.current?.querySelectorAll('details[open]').forEach((details) => {
      if (details !== opened) details.removeAttribute('open')
    })
  }
  // A native details control gives keyboard and touch users the same menu.
  // Dismiss both popovers after navigation, outside presses and Escape.
  useEffect(() => {
    header.current?.querySelectorAll('details[open]').forEach((details) => {
      details.removeAttribute('open')
    })
  }, [location.pathname])
  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      const host = header.current
      if (!host) return
      const escape = event instanceof KeyboardEvent && event.key === 'Escape'
      if (
        event instanceof PointerEvent &&
        host.contains(event.target as Node)
      ) {
        const pressedMenu = (event.target as Element).closest('details')
        host.querySelectorAll('details[open]').forEach((details) => {
          if (details !== pressedMenu) details.removeAttribute('open')
        })
      }
      if (escape || !host.contains(event.target as Node)) {
        const active = document.activeElement
        host.querySelectorAll('details[open]').forEach((details) => {
          details.removeAttribute('open')
          if (escape && details.contains(active))
            details.querySelector('summary')?.focus()
        })
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [])
  const navigation = links.map(({ to, label }) => (
    <NavLink key={to} to={to}>
      {label}
    </NavLink>
  ))
  return (
    <header ref={header} className={`public-header ${className}`} dir={dir}>
      <div className="public-header-inner brand-header-inner">
        <SiteBrand />
        <nav className="public-desktop-nav" aria-label={copy.navigation}>
          {navigation}
        </nav>
        <details
          className="public-mobile-menu brand-mobile-menu"
          onToggle={(event) => closeOtherMenus(event.currentTarget)}
        >
          <summary aria-label={copy.menu}>
            <Menu size={20} aria-hidden="true" />
            <span>{copy.menu}</span>
          </summary>
          <nav aria-label={copy.navigation}>{navigation}</nav>
        </details>
        <LanguageSwitcher />
        <details
          className="public-signin-menu"
          onToggle={(event) => closeOtherMenus(event.currentTarget)}
        >
          <summary aria-label={t('marketing.signIn')}>
            <UserRound size={18} aria-hidden="true" />
            <span>{t('marketing.signIn')}</span>
            <ChevronDown
              className="public-signin-chevron"
              size={13}
              aria-hidden="true"
            />
          </summary>
          <nav aria-label={t('marketing.signIn')}>
            {signIns.map(({ to, label }) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  )
}
