import { AccessibilityLink } from '../accessibility/Accessibility'
import { reducedMotionQuery } from '../accessibility/motion'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, Mail, ShieldCheck, Layers3, Globe2 } from 'lucide-react'
import { brand } from '../config/brand'
import { Logo } from '../components/Logo'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useI18n } from '../i18n'
import { useBrandCopy } from './brandCopy'
import { readPassage, siteLabels, type SitePage } from './siteContent'
import { usePageTitle } from './usePageTitle'
import './institutional.css'

function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  target.tabIndex = -1
  target.focus({ preventScroll: true })
  target.scrollIntoView({
    behavior: reducedMotionQuery().matches ? 'instant' : 'smooth',
    block: 'start',
  })
}
export function PageHeader() {
  const copy = useBrandCopy()
  const { lang, dir } = useI18n()
  const nav = [
    { to: '/company', label: copy.trustCompany },
    { to: '/philanthropy', label: copy.trustPartners },
    { to: '/compliance', label: copy.trustCompliance },
    { to: '/security', label: copy.trustSecurity },
  ]
  return (
    <>
      <a
        className="institutional-skip"
        href="#company-content"
        onClick={(e) => {
          e.preventDefault()
          scrollToSection('company-content')
        }}
      >
        {readPassage(siteLabels.skip, lang)}
      </a>
      <header className="institutional-header" dir={dir}>
        <Link to="/" aria-label={brand.name}>
          <Logo variant="full" height={36} />
        </Link>
        <nav aria-label={copy.footerCompany}>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <LanguageSwitcher />
      </header>
    </>
  )
}
export function PageFooter() {
  const { lang } = useI18n()
  const copy = useBrandCopy()
  return (
    <footer className="institutional-footer">
      <div>
        <p>
          <strong>{brand.legalName}</strong>
          <br />
          <bdi>Seattle, Washington, USA</bdi>
        </p>
        <p>
          <a href={`mailto:${brand.support.email}`}>
            <bdi>{brand.support.email}</bdi>
          </a>
          <br />
          <a href={`tel:${brand.support.phone.replace(/[^+\d]/g, '')}`}>
            <bdi>{brand.support.phone}</bdi>
          </a>
        </p>
        <nav aria-label={readPassage(siteLabels.resources, lang)}>
          <AccessibilityLink />
          <Link to="/company">{copy.trustCompany}</Link>
          <Link to="/philanthropy">{copy.trustPartners}</Link>
          <Link to="/compliance">{copy.trustCompliance}</Link>
          <Link to="/security">{copy.trustSecurity}</Link>
          <Link to="/privacy">{readPassage(siteLabels.privacy, lang)}</Link>
          <Link to="/support">{readPassage(siteLabels.support, lang)}</Link>
        </nav>
      </div>
      <div className="institutional-disclosure">
        <p>
          NMLS ID <bdi>{brand.nmls.id}</bdi>.
        </p>
        <p>{readPassage(siteLabels.operating, lang)}</p>
        <p>
          © {new Date().getFullYear()} {brand.legalName}. {readPassage(siteLabels.rights, lang)}
        </p>
      </div>
    </footer>
  )
}
export function Shell({
  title,
  intro,
  updated,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  children: ReactNode
}) {
  const { lang, dir } = useI18n()
  usePageTitle(title)
  return (
    <div lang={lang} dir={dir} className="institutional-site">
      <PageHeader />
      <main id="company-content" tabIndex={-1}>
        <section className="institutional-hero">
          <div>
            <p className="institutional-eyebrow">{brand.legalName}</p>
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
            {updated && (
              <small>
                {readPassage(siteLabels.updated, lang)} {updated}
              </small>
            )}
          </div>
          <div className="institutional-orbits" aria-hidden="true">
            <span />
            <span />
            <span />
            <Globe2 />
          </div>
        </section>
        <div className="institutional-body">{children}</div>
      </main>
      <PageFooter />
    </div>
  )
}
export function Contents({ items }: { items: { id: string; label: string }[] }) {
  const { lang } = useI18n()
  const [selected, setSelected] = useState(items[0]?.id)
  return (
    <nav className="institutional-contents" aria-label={readPassage(siteLabels.contents, lang)}>
      <p>{readPassage(siteLabels.contents, lang)}</p>
      <div>
        {items.map((item) => (
          <button
            key={item.id}
            aria-current={selected === item.id ? 'location' : undefined}
            onClick={() => {
              setSelected(item.id)
              scrollToSection(item.id)
            }}
          >
            {item.label}
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
    </nav>
  )
}
export function H({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} tabIndex={-1}>
      {children}
    </h2>
  )
}
export function Q({ q, id, children }: { q: string; id?: string; children: ReactNode }) {
  return (
    <details id={id} className="institutional-details">
      <summary>
        {q}
        <ChevronDown size={16} />
      </summary>
      <div>{children}</div>
    </details>
  )
}
export function Facts({ rows }: { rows: { k: string; v: ReactNode }[] }) {
  return (
    <dl className="institutional-facts">
      {rows.map((row) => (
        <div key={row.k}>
          <dt>{row.k}</dt>
          <dd>{row.v}</dd>
        </div>
      ))}
    </dl>
  )
}
export function ContentSections({ page, extra }: { page: SitePage; extra?: (id: string) => ReactNode }) {
  const { lang } = useI18n()
  return (
    <>
      <Contents items={page.sections.map((s) => ({ id: s.id, label: readPassage(s.title, lang) }))} />
      <div className="institutional-sections">
        {page.sections.map((section, index) => (
          <section className="institutional-section" key={section.id}>
            <span className="institutional-number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <H id={section.id}>{readPassage(section.title, lang)}</H>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i}>{readPassage(paragraph, lang)}</p>
            ))}
            {extra?.(section.id)}
          </section>
        ))}
      </div>
    </>
  )
}
export function InstitutionalActions() {
  const { lang } = useI18n()
  const copy = useBrandCopy()
  return (
    <div className="institutional-actions">
      <Link to="/demo">
        <Globe2 />
        <span>{readPassage(siteLabels.demo, lang)}</span>
        <ArrowUpRight />
      </Link>
      <Link to="/compliance">
        <ShieldCheck />
        <span>{copy.trustCompliance}</span>
        <ArrowUpRight />
      </Link>
      <Link to="/security">
        <Layers3 />
        <span>{copy.trustSecurity}</span>
        <ArrowUpRight />
      </Link>
      <Link to="/support">
        <Mail />
        <span>{readPassage(siteLabels.contact, lang)}</span>
        <ArrowUpRight />
      </Link>
    </div>
  )
}
