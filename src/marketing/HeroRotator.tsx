import { useEffect, useState } from 'react'
import { HERO_LOCALES } from './heroLocales'

const DWELL_MS = 4200
const FADE_MS = 420

/**
 * Cycles the hero line through ten languages.
 *
 * The visible copy is swapped rather than duplicated, and `lang`/`dir` move
 * with it so a screen reader switches voice and Arabic lays out right to left.
 * Honours prefers-reduced-motion by holding on the reader's own language.
 */
export function HeroRotator() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || paused) return

    const hold = setTimeout(() => {
      setVisible(false)
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_LOCALES.length)
        setVisible(true)
      }, FADE_MS)
      return () => clearTimeout(swap)
    }, DWELL_MS)
    return () => clearTimeout(hold)
  }, [index, paused])

  const locale = HERO_LOCALES[index]

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p
        lang={locale.code}
        dir={locale.dir}
        aria-live="polite"
        style={{ transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease` }}
        className={`min-h-[3.5rem] max-w-[26ch] text-pretty text-[17px] font-semibold leading-snug text-ink-500 ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        }`}
      >
        {locale.line}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-hidden="true">
        {HERO_LOCALES.map((l, i) => (
          <button
            key={l.code}
            type="button"
            onClick={() => { setIndex(i); setVisible(true) }}
            title={l.label}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-brand-600' : 'w-1.5 bg-ink-200 hover:bg-ink-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
