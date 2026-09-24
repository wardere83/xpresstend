import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { Logo } from '../components/Logo'

/**
 * The formal presentation layer, shared by every page a reader arrives at to
 * assess the company rather than to send money: the policies, and the company,
 * compliance, security and partnership pages.
 *
 * These are read by people doing diligence — a bank's onboarding team, a payout
 * partner, a state examiner — so they are typeset as documents, not as landing
 * pages: one column, a contents list, and a footer that repeats the registration
 * and how to verify it on every page rather than only on the home page.
 *
 * English only, deliberately, for the same reason the policies are: a
 * mistranslated statement about licence status or fund custody carries real
 * consequence, and belongs to a qualified translator rather than to the same
 * process as interface copy.
 */

export function Shell({
  title,
  intro,
  updated,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  children: React.ReactNode
}) {
  // Arriving from a footer link carries the landing page's scroll position
  // along, so a document would open partway down itself.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-dvh bg-white text-ink-900">
      {/* Same safe-area treatment as the marketing header: the native webview
          draws under the status bar, and the lockup must clear it. */}
      <header className="border-b border-ink-200/70 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          {/* The full lockup: here the company is being presented formally
              rather than the product worn casually. */}
          <Link to="/" aria-label={brand.name}>
            <Logo variant="full" height={40} />
          </Link>
          <nav aria-label="Company" className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-500">
            <Link className="hover:text-brand-600" to="/company">Company</Link>
            <Link className="hover:text-brand-600" to="/compliance">Compliance</Link>
            <Link className="hover:text-brand-600" to="/security">Security</Link>
            <Link className="hover:text-brand-600" to="/partners">Partners</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {intro ? <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{intro}</p> : null}
        {updated ? <p className="mt-2 text-[13px] text-ink-500">Last updated {updated}</p> : null}
        <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-ink-700">{children}</div>
      </main>
      <PageFooter />
    </div>
  )
}

/**
 * The corporate footer carried by every formal page.
 *
 * The registration and the verification link appear on each one rather than
 * only on the home page, because these pages are landed on directly from a
 * search or a forwarded link as often as they are navigated to.
 */
export function PageFooter() {
  return (
    <footer className="border-t border-ink-200/70">
      <div className="mx-auto max-w-3xl px-5 py-8 text-[12px] leading-relaxed text-ink-500">
        <p className="font-semibold text-ink-700">{brand.legalName}</p>
        <p className="mt-1">
          {brand.hq.city}, {brand.hq.state}, {brand.hq.country}
        </p>
        <p className="mt-2">
          <a className="underline" href={`mailto:${brand.support.email}`}>
            {brand.support.email}
          </a>
          {' · '}
          <a className="underline" href={`tel:${brand.support.phone.replace(/[^+\d]/g, '')}`}>
            {brand.support.phone}
          </a>
        </p>
        {/* The registration, then the link that settles what it actually
            means. Anyone checking a money transmitter starts here. */}
        <p className="mt-3">{brand.legal.licence}</p>
        <p className="mt-2">
          <a
            className="underline"
            href={brand.nmls.verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Verify NMLS ID {brand.nmls.id} at NMLS Consumer Access
          </a>
        </p>
        <p className="mt-3">{brand.legal.operatingStatus}</p>
      </div>
    </footer>
  )
}

export function H({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="scroll-mt-24 pt-2 text-[17px] font-bold text-ink-900">
      {children}
    </h2>
  )
}

/**
 * One question and its answer. `id` gives each answer a URL, so support can
 * send someone to the exact one instead of "scroll down to Refunds".
 */
export function Q({ q, id, children }: { q: string; id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="scroll-mt-24">
      <strong className="text-ink-900">{q}</strong> {children}
    </p>
  )
}

/** Jump list, so a long page stays navigable without scrolling it twice. */
export function Contents({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="rounded-xl bg-canvas p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">On this page</p>
      <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.id}>
            <a
              className="text-[13px] underline decoration-ink-300 hover:text-brand-600"
              href={`#${i.id}`}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * A labelled fact. Diligence readers scan for these — legal name, registration,
 * jurisdiction — and a definition list is what they expect to find them in.
 */
export function Facts({ rows }: { rows: { k: string; v: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-ink-200/70 overflow-hidden rounded-xl ring-1 ring-ink-200">
      {rows.map((r) => (
        <div key={r.k} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
          <dt className="text-[13px] font-semibold text-ink-900">{r.k}</dt>
          <dd className="text-[13.5px] text-ink-700">{r.v}</dd>
        </div>
      ))}
    </dl>
  )
}
