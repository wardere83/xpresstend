import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './en'
import { dirOf, LANGUAGES, type Lang } from './langs'
import { I18nContext, type I18nValue, STORAGE_KEY, dictionaries, interpolate, readInitialLang } from './index'

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
