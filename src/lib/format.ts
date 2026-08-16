import { brand } from '../config/brand'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const plainFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

/** `$504.99` */
export function usd(value: number) {
  return usdFormatter.format(value)
}

/** `3,180,000.00` — destination amounts are shown without a currency symbol. */
export function amount(value: number) {
  return plainFormatter.format(value)
}

/** `2,556` — used for exchange-rate lines. */
export function rate(value: number) {
  return value >= 100 ? compactFormatter.format(value) : plainFormatter.format(value)
}

/** Dates in the mockups read `May 13, 2024  9:42 AM` in both languages. */
export function formatDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date}  ${time}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** `XPH-8457-2391-2024` */
export function makeReference(date = new Date()) {
  const block = () => String(Math.floor(1000 + Math.random() * 9000))
  return `${brand.referencePrefix}-${block()}-${block()}-${date.getFullYear()}`
}

export function maskedWallet(wallet: string, last4: string) {
  return `${wallet} •••• ${last4}`
}
