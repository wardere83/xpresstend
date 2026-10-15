import { useI18n } from '../i18n'
import { brand } from '../config/brand'

const locale = () => (typeof document === 'undefined' ? 'en-US' : document.documentElement.lang || 'en-US')

/** `$504.99` */
export function usd(value: number, lang = locale()) {
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** `3,180,000.00` — destination amounts are shown without a currency symbol. */
export function amount(value: number, lang = locale()) {
  return new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

/** `2,556` — used for exchange-rate lines. */
export function rate(value: number, lang = locale()) {
  return new Intl.NumberFormat(lang, {
    maximumFractionDigits: value >= 100 ? 0 : 2,
    minimumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value)
}

/** Dates in the mockups read `May 13, 2024  9:42 AM` in both languages. */
export function formatDateTime(iso: string, lang = locale()) {
  const d = new Date(iso)
  const date = d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' })
  return `${date}  ${time}`
}

export function formatDate(iso: string, lang = locale()) {
  return new Date(iso).toLocaleDateString(lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** `XPT-8457-2391-2024` */
export function makeReference(date = new Date()) {
  const block = () => String(Math.floor(1000 + Math.random() * 9000))
  return `${brand.referencePrefix}-${block()}-${block()}-${date.getFullYear()}`
}

export function maskedWallet(wallet: string, last4: string) {
  return `${wallet} •••• ${last4}`
}

export function useFormats() {
  const { lang } = useI18n()
  return {
    usd: (n: number) => usd(n, lang),
    amount: (n: number) => amount(n, lang),
    rate: (n: number) => rate(n, lang),
    formatDate: (s: string) => formatDate(s, lang),
    formatDateTime: (s: string) => formatDateTime(s, lang),
  }
}
