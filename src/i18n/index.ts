import { createContext, useContext } from 'react'
import { brand } from '../config/brand'
import { ar } from './ar'
import { en, type TranslationKey } from './en'
import { es } from './es'
import { isLang, matchBrowserLang, type Lang } from './langs'
import { ptBR } from './ptBR'
import { so } from './so'

export type { Lang } from './langs'
export { LANGUAGES } from './langs'
export type { TranslationKey } from './en'

export const dictionaries: Record<Lang, Record<string, string>> = { en, so, 'pt-BR': ptBR, es, ar }

export const STORAGE_KEY = 'xpresstend.lang'

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

export function interpolate(
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

export type I18nValue = {
  lang: Lang
  /** Writing direction of the active language. */
  dir: 'ltr' | 'rtl'
  /** `true` while a right-to-left language is active — Arabic today. */
  isRtl: boolean
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLang(stored)) return stored
  // English is the primary language; only auto-switch when the browser asks
  // for one of the others.
  return matchBrowserLang(window.navigator.language) ?? 'en'
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
