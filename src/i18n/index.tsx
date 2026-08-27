import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { brand } from '../config/brand'
import { ar } from './ar'
import { en, type TranslationKey } from './en'
import { es } from './es'
import { dirOf, isLang, matchBrowserLang, LANGUAGES, type Lang } from './langs'
import { ptBR } from './ptBR'
import { so } from './so'

export type { Lang } from './langs'
export { LANGUAGES } from './langs'
export type { TranslationKey } from './en'

const dictionaries: Record<Lang, Record<string, string>> = { en, so, 'pt-BR': ptBR, es, ar }

const STORAGE_KEY = 'xpresstend.lang'

/** Variables every string can rely on without the caller passing them. */
const globalVars: Record<string, string> = {
  brand: brand.name,
  assistant: brand.assistantName,
  city: brand.hq.city,
  state: brand.hq.state,
}

/**
 * Unicode first-strong isolate. Under RTL, a substituted run such as
 * `$505.00` would otherwise be reordered by the bidi algorithm and render as
 * `505.00$`. Wrapping it isolates the run without changing how it reads.
 */
const FSI = '\u2068'
const PDI = '\u2069'

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
  isolate = false,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars?.[key] ?? globalVars[key]
    if (value === undefined) return match
    return isolate ? `${FSI}${String(value)}${PDI}` : String(value)
  })
}

type I18nValue = {
  lang: Lang
  /** Writing direction of the active language. */
  dir: 'ltr' | 'rtl'
  /** `true` while a right-to-left language is active — Arabic today. */
  isRtl: boolean
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLang(stored)) return stored
  // English is the primary language; only auto-switch when the browser asks
  // for one of the others.
  return matchBrowserLang(window.navigator.language) ?? 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)
  const dir = dirOf(lang)
  const isRtl = dir === 'rtl'

  useEffect(() => {
    // Arabic flips the whole document; every other language flips it back.
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang, dir])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggleLang = useCallback(
    () =>
      setLangState((current) => {
        const i = LANGUAGES.findIndex((l) => l.code === current)
        return LANGUAGES[(i + 1) % LANGUAGES.length].code
      }),
    [],
  )

  const t = useCallback<I18nValue['t']>(
    (key, vars) => {
      const template = dictionaries[lang][key] ?? en[key] ?? key
      return interpolate(template, vars, isRtl)
    },
    [lang, isRtl],
  )

  const value = useMemo(
    () => ({ lang, dir, isRtl, setLang, toggleLang, t }),
    [lang, dir, isRtl, setLang, toggleLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Shorthand for components that only need the translate function. */
export function useT() {
  return useI18n().t
}

/**
 * `scale-x-[-1]` when the layout is right-to-left, so glyphs that carry a
 * direction (chevrons, the send arrow) point the way the reader travels.
 * Lucide icons do not mirror on their own.
 */
export function useMirrorClass() {
  return useI18n().isRtl ? 'scale-x-[-1]' : ''
}
