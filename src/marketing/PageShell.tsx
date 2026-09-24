import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { NEEDS_FACT } from '../config/brand'
import { SiteFooter, SiteHeader } from './SiteChrome'
import { useDocumentMeta } from './meta'

/**
 * The formal presentation layer, shared by every page a reader arrives at to
 * assess the company rather than to send money: the policies, and the company,
 * compliance, security and partnership pages.
 *
 * These are read by people doing diligence — a bank's onboarding team, a payout
 * partner, a state examiner — so the body is typeset as a document: one column,
 * a contents list, and the registration repeated in the footer of every page
 * rather than only on the home page. The header and footer are the site's own,
 * shared with the landing page, so a document reads as part of the company's
 * site rather than as a separate, plainer one.
 *
 * English only, deliberately, for the same reason the policies are: a
 * mistranslated statement about licence status or fund custody carries real
 * consequence, and belongs to a qualified translator rather than to the same
 * process as interface copy. The body is marked `dir="ltr"` to match, so
 * choosing Arabic does not right-align English legal prose.
 */

/**
 * Builds an in-page link that survives the hash router.
 *
 * The router keeps the whole route in `location.hash`, so a bare `href="#limits"`
 * replaces the route with `/limits`, misses every route, and the catch-all
 * sends the reader back to the landing page. Every jump link on every document
 * page did exactly that. Writing the route back in — `#/compliance#limits` —
 * keeps the page and leaves a fragment the router hands back through
 * `useLocation().hash`, so the link is also a real URL someone can copy,
 * forward, or cite in an email.
 */
function sectionHref(pathname: string, id: string) {
  return `#${pathname}#${id}`
}

export function Shell({
  title,
  description,
  intro,
  updated,
  children,
}: {
  title: string
  /** Meta description for this page, and its social-card description. */
  description: string
  intro?: string
  updated?: string
  children: React.ReactNode
}) {
  const { pathname, hash } = useLocation()
  useDocumentMeta({ title, description })

  /*
   * Arriving from a footer link carries the landing page's scroll position
   * along, so a document would otherwise open partway down itself. Arriving on
   * a section link should instead land on that section — including when the
   * page is opened cold from a forwarded URL, which is when it matters most.
   */
  useEffect(() => {
    const id = hash.replace(/^#/, '')
    if (!id) {
      window.scrollTo(0, 0)
      return
    }
    const target = document.getElementById(id)
    if (!target) {
      window.scrollTo(0, 0)
      return
    }
    target.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    })
  }, [pathname, hash])

  return (
    <div className="brand-site">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12" dir="ltr">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {intro ? <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{intro}</p> : null}
        {updated ? <p className="mt-2 text-[13px] text-ink-500">Last updated {updated}</p> : null}
        <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-ink-700">{children}</div>
      </main>
      <SiteFooter />
    </div>
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
  const { pathname } = useLocation()
  return (
    <nav aria-label="On this page" className="rounded-xl bg-canvas p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">On this page</p>
      <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.id}>
            <a
              className="text-[13px] underline decoration-ink-300 hover:text-brand-600"
              href={sectionHref(pathname, i.id)}
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

/**
 * An unconfirmed fact, shown as an unfilled field rather than as prose.
 *
 * Deliberately conspicuous. These pages are checked against primary records, so
 * the one thing that must never happen is a plausible-looking invention sitting
 * where a documented value belongs; a field that visibly wants filling is the
 * safe failure. Every one of these is listed in the change notes so they can be
 * filled from the filed documents before the site is sent to anyone.
 */
export function NeedsFact({ what }: { what: string }) {
  return (
    <span className="rounded bg-alert-soft px-1.5 py-0.5 font-semibold text-alert ring-1 ring-ink-300">
      {NEEDS_FACT} {what}
    </span>
  )
}
