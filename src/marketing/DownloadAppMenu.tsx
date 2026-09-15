import { useEffect, useRef, useState } from 'react'
import { Apple, ChevronDown, Download } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'

/**
 * Header "Download App" control: one button, two platforms.
 *
 * Android downloads the beta APK directly. iOS opens the TestFlight public
 * link when one is configured on the brand; until then it walks the visitor to
 * the get-the-app section, which explains the honest state of the iOS beta
 * rather than presenting a button that goes nowhere.
 */
export function DownloadAppMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const iosHref = brand.appLinks.iosTestFlight || '#get-the-app'
  const iosIsExternal = brand.appLinks.iosTestFlight !== ''

  const itemClass =
    'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13px] font-semibold text-ink-900 hover:bg-brand-50'

  const betaChip = (
    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200/60">
      {t('nav.beta')}
    </span>
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.downloadApp')}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-600 transition-colors hover:text-ink-900"
      >
        {/* The label needs the room a phone header does not have; the glyph
            carries the meaning alone below sm. */}
        <Download size={15} className="sm:hidden" />
        <span className="hidden whitespace-nowrap sm:inline">{t('nav.downloadApp')}</span>
        <ChevronDown size={13} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>

      {open && (
        <div
          role="menu"
          /* w-44 below sm: the control sits mid-header on a phone, and a wider
             panel anchored to its right edge runs into the left screen edge. */
          className="absolute end-0 z-40 mt-2 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-[0_16px_40px_-12px_rgba(11,37,47,0.35)] ring-1 ring-brand-600/5 sm:w-56"
        >
          <a
            role="menuitem"
            href={iosHref}
            onClick={() => setOpen(false)}
            {...(iosIsExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
            className={itemClass}
          >
            <Apple size={16} className="shrink-0 text-ink-700" />
            <span className="flex-1">iOS</span>
            {betaChip}
          </a>
          <a role="menuitem" href={brand.appLinks.androidApk} onClick={() => setOpen(false)} className={itemClass}>
            <Download size={16} className="shrink-0 text-ink-700" />
            <span className="flex-1">Android</span>
            {betaChip}
          </a>
        </div>
      )}
    </div>
  )
}
