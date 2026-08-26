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
    line: 'Clear rates. One flat rate. Bonus points to spend later. Speak or type in your language, and the whole app answers in it.',
  },
  {
    code: 'pt-BR',
    label: 'Português',
    dir: 'ltr',
    line: 'Taxas claras. Uma taxa única. Pontos de bônus para usar depois. Fale ou digite no seu idioma, e o app inteiro responde nele.',
  },
  {
    code: 'so',
    label: 'Af-Soomaali',
    dir: 'ltr',
    line: "Sicir cad. Hal boqolkiiba go'an. Dhibco bonus ah oo aad markii dambe isticmaasho. Ku hadal ama ku qor luqaddaada, abkuna wuu kaaga jawaabayaa.",
  },
  {
    code: 'ar',
    label: 'العربية',
    dir: 'rtl',
    line: 'أسعار واضحة. نسبة ثابتة واحدة. نقاط مكافآت تستخدمها لاحقًا. تحدث أو اكتب بلغتك، والتطبيق بأكمله يردّ بها.',
  },
  {
    code: 'sw',
    label: 'Kiswahili',
    dir: 'ltr',
    line: 'Viwango wazi. Kiwango kimoja tu. Pointi za bonasi za kutumia baadaye. Sema au andika kwa lugha yako, na programu nzima itajibu kwa lugha hiyo.',
  },
  {
    code: 'ti',
    label: 'ትግርኛ',
    dir: 'ltr',
    line: 'ንጹር ዋጋታት። ሓደ ቀዋሚ መጠን። ጸኒሕካ እትጥቀመሉ ናይ ሽልማት ነጥብታት። ብቋንቋኻ ተዛረብ ወይ ጽሓፍ፡ እቲ ምሉእ መተግበሪ ብእኡ ይምልሰልካ።',
  },
  {
    code: 'es',
    label: 'Español',
    dir: 'ltr',
    line: 'Tipos de cambio claros. Una tasa única. Puntos de bonificación para usar después. Hable o escriba en su idioma, y toda la app responde en él.',
  },
  {
    code: 'fr',
    label: 'Français',
    dir: 'ltr',
    line: "Des taux clairs. Un seul taux fixe. Des points bonus à utiliser plus tard. Parlez ou écrivez dans votre langue, et toute l'application vous répond dans celle-ci.",
  },
  {
    code: 'am',
    label: 'አማርኛ',
    dir: 'ltr',
    line: 'ግልጽ ተመኖች። አንድ ቋሚ ተመን። በኋላ የሚጠቀሙባቸው የጉርሻ ነጥቦች። በቋንቋዎ ይናገሩ ወይም ይጻፉ፣ መተግበሪያው በሙሉ በዚያው ይመልሳል።',
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    dir: 'ltr',
    line: 'स्पष्ट दरें। एक ही निश्चित दर। बाद में इस्तेमाल करने के लिए बोनस पॉइंट। अपनी भाषा में बोलें या लिखें, और पूरा ऐप उसी में जवाब देता है।',
  },
]
