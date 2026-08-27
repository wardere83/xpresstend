/**
 * The tagline, cycling through every language the product actually speaks.
 *
 * These are the same five the switcher offers and the same five the UI is fully
 * translated into, so the rotator never advertises a language a visitor cannot
 * then select. Portuguese, Somali and Arabic lead, ahead of Spanish, because
 * those are the communities XpressTend serves first; English sits at the front
 * only as the entry point before the loop begins.
 *
 * Keep this list in step with LANGUAGES in src/i18n/langs.ts.
 */
export interface HeroLocale {
  /** BCP-47 tag, used for lang= so screen readers switch voice. */
  code: string
  label: string
  dir: 'ltr' | 'rtl'
  line: string
}

export const HERO_LOCALES: HeroLocale[] = [
  { code: 'en', label: 'English', dir: 'ltr', line: 'Closer with every transfer!' },
  { code: 'pt-BR', label: 'Português', dir: 'ltr', line: 'Mais perto a cada transferência!' },
  { code: 'so', label: 'Af-Soomaali', dir: 'ltr', line: 'Dhawaansho wareejin kasta!' },
  { code: 'ar', label: 'العربية', dir: 'rtl', line: 'أقرب مع كل تحويل!' },
  { code: 'es', label: 'Español', dir: 'ltr', line: '¡Más cerca con cada envío!' },
]
