/**
 * Language registry.
 *
 * Kept out of `index.tsx` so plain data modules (and the Fast Refresh
 * boundary) can reference the codes without pulling in the provider.
 */

export type Lang = 'en' | 'so' | 'pt-BR' | 'es' | 'ar'

export type LangMeta = {
  code: Lang
  /** English name, used for `aria`/debugging. */
  label: string
  /** How the language names itself — what the switcher shows. */
  nativeLabel: string
  flag: string
  dir: 'ltr' | 'rtl'
  /** BCP-47 tag matched against `navigator.language` on first load. */
  matches: string[]
}

export const LANGUAGES: LangMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸', dir: 'ltr', matches: ['en'] },
  { code: 'so', label: 'Somali', nativeLabel: 'Af-Soomaali', flag: '🇸🇴', dir: 'ltr', matches: ['so'] },
  {
    code: 'pt-BR',
    label: 'Portuguese (Brazil)',
    nativeLabel: 'Português',
    flag: '🇧🇷',
    dir: 'ltr',
    matches: ['pt'],
  },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', dir: 'ltr', matches: ['es'] },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', dir: 'rtl', matches: ['ar'] },
]

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]))

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && byCode.has(value as Lang)
}

export function langMeta(lang: Lang): LangMeta {
  return byCode.get(lang) ?? LANGUAGES[0]
}

export function dirOf(lang: Lang): 'ltr' | 'rtl' {
  return langMeta(lang).dir
}

export function isRtlLang(lang: Lang): boolean {
  return dirOf(lang) === 'rtl'
}

/** Best match for a `navigator.language` value, or `null` when nothing fits. */
export function matchBrowserLang(tag: string | undefined): Lang | null {
  if (!tag) return null
  const lower = tag.toLowerCase()
  // Exact region match first (`pt-br` beats a bare `pt`).
  const exact = LANGUAGES.find((l) => l.code.toLowerCase() === lower)
  if (exact) return exact.code
  const base = LANGUAGES.find((l) => l.matches.some((m) => lower.startsWith(m)))
  return base ? base.code : null
}
