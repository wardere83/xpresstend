import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Globe, Search } from 'lucide-react'
import { LANGUAGES, useI18n, useT } from '../i18n'

export function LanguageSwitcher({
  tone = 'light',
  drop = 'down',
}: {
  tone?: 'light' | 'dark'
  /** The sidebar control sits at the bottom of the column, so its list opens upward. */
  drop?: 'down' | 'up'
}) {
  const { lang, setLang } = useI18n()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]
  const dark = tone === 'dark'

  useEffect(() => {
    if (!open) return
    setQuery('')
    // Let the list paint before stealing focus, so the caret lands reliably.
    const focus = setTimeout(() => searchRef.current?.focus(), 30)
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(focus)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      LANGUAGES.filter(
        (l) =>
          !q ||
          l.nativeLabel.toLowerCase().includes(q) ||
          l.label.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q),
      ),
    [q],
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
          dark
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
        }`}
      >
        <Globe size={14} strokeWidth={2.4} />
        <span>{current.nativeLabel}</span>
        <ChevronDown size={13} strokeWidth={2.6} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>

      {open && (
        <div
          className={`absolute end-0 z-40 w-60 overflow-hidden rounded-xl bg-white shadow-[0_16px_40px_-12px_rgba(11,37,47,0.35)] ring-1 ring-black/5 ${
            drop === 'up' ? 'bottom-full mb-2' : 'mt-2'
          }`}
        >
          <div className="flex items-center gap-2 border-b border-ink-200/70 px-3 py-2.5">
            <Search size={14} className="shrink-0 text-ink-500" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('lang.search')}
              aria-label={t('lang.search')}
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-500"
            />
          </div>

          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {matches.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === lang}
                  onClick={() => {
                    setLang(l.code)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-[13px] font-semibold text-ink-900 hover:bg-brand-50"
                >
                  <span aria-hidden="true">{l.flag}</span>
                  <span className="flex-1">{l.nativeLabel}</span>
                  {l.code === lang && <Check size={15} className="text-brand-600" strokeWidth={3} />}
                </button>
              </li>
            ))}


            {matches.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px] text-ink-500">{t('lang.noMatch')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
