/**
 * The hero line, cycling through ten languages.
 *
 * Ordered as the business asked: Portuguese, Somali, Arabic, Swahili, Tigrinya
 * and Spanish lead, because those are the communities XpressTend serves first.
 * English sits at the front only as the entry point before the loop begins.
 *
 * The five languages that also exist as full UI translations (en, pt-BR, so,
 * es, ar) are the reviewed ones. Swahili, Tigrinya, French, Amharic and Hindi
 * appear here only, and should be checked by a native speaker before this line
 * is used in paid advertising.
 */
export interface HeroLocale {
  /** BCP-47 tag, used for lang= so screen readers switch voice. */
  code: string
  label: string
  dir: 'ltr' | 'rtl'
  line: string
}

export const HERO_LOCALES: HeroLocale[] = [
  {
    code: 'en',
    label: 'English',
    dir: 'ltr',
    line: 'One flat rate. Your language.',
  },
  {
    code: 'pt-BR',
    label: 'Português',
    dir: 'ltr',
    line: 'Uma taxa única. Seu idioma.',
  },
  {
    code: 'so',
    label: 'Af-Soomaali',
    dir: 'ltr',
    line: 'Hal boqolkiiba. Luqaddaada.',
  },
  {
    code: 'ar',
    label: 'العربية',
    dir: 'rtl',
    line: 'نسبة ثابتة. لغتك.',
  },
  {
    code: 'sw',
    label: 'Kiswahili',
    dir: 'ltr',
    line: 'Kiwango kimoja. Lugha yako.',
  },
  {
    code: 'ti',
    label: 'ትግርኛ',
    dir: 'ltr',
    line: 'ሓደ ቀዋሚ መጠን። ቋንቋኻ።',
  },
  {
    code: 'es',
    label: 'Español',
    dir: 'ltr',
    line: 'Una tasa única. Su idioma.',
  },
  {
    code: 'fr',
    label: 'Français',
    dir: 'ltr',
    line: 'Un taux fixe. Votre langue.',
  },
  {
    code: 'am',
    label: 'አማርኛ',
    dir: 'ltr',
    line: 'አንድ ቋሚ ተመን። በቋንቋዎ።',
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    dir: 'ltr',
    line: 'एक निश्चित दर। आपकी भाषा।',
  },
]
