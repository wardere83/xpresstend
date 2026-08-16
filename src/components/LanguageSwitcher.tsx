import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LANGUAGES, useI18n } from '../i18n'

export function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]
  const dark = tone === 'dark'

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
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-[0_16px_40px_-12px_rgba(20,18,31,0.35)] ring-1 ring-black/5"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold text-ink-900 hover:bg-brand-50"
              >
                <span aria-hidden="true">{l.flag}</span>
                <span className="flex-1">{l.nativeLabel}</span>
                {l.code === lang && <Check size={15} className="text-brand-600" strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
