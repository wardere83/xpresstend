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
import { en, type TranslationKey } from './en'
import { so } from './so'

export type Lang = 'en' | 'so'

export const LANGUAGES: { code: Lang; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'so', label: 'Somali', nativeLabel: 'Af-Soomaali', flag: '🇸🇴' },
]

const dictionaries: Record<Lang, Record<string, string>> = { en, so }

const STORAGE_KEY = 'xpresshawala.lang'

/** Variables every string can rely on without the caller passing them. */
const globalVars: Record<string, string> = {
  brand: brand.name,
  assistant: brand.assistantName,
  city: brand.hq.city,
  state: brand.hq.state,
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars?.[key] ?? globalVars[key]
    return value === undefined ? match : String(value)
  })
}

type I18nValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'so') return stored
  // English is the primary language; only auto-switch for Somali browsers.
  return window.navigator.language?.toLowerCase().startsWith('so') ? 'so' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggleLang = useCallback(() => setLangState((l) => (l === 'en' ? 'so' : 'en')), [])

  const t = useCallback<I18nValue['t']>(
    (key, vars) => {
      const template = dictionaries[lang][key] ?? en[key] ?? key
      return interpolate(template, vars)
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t])

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
