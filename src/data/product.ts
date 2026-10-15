import type { Lang } from '../i18n/langs'

export type Corridor = {
  code: string
  currency: string
  country: string
  countryI18n: Partial<Record<Lang, string>>
  flag: string
  rate: number
  currencyName: string
  wallets: string[]
}

export const corridors: Corridor[] = [
  {
    code: 'SO', currency: 'USD', country: 'Somalia',
    countryI18n: { so: 'Soomaaliya', 'pt-BR': 'Somália', es: 'Somalia', ar: 'الصومال' },
    flag: '🇸🇴', rate: 1, currencyName: 'US Dollar', wallets: ['EVC Plus', 'Zaad', 'Sahal', 'eDahab'],
  },
  {
    code: 'KE', currency: 'USD', country: 'Kenya',
    countryI18n: { so: 'Kenya', 'pt-BR': 'Quênia', es: 'Kenia', ar: 'كينيا' },
    flag: '🇰🇪', rate: 1, currencyName: 'US Dollar', wallets: ['M-Pesa', 'Airtel Money'],
  },
  {
    code: 'ET', currency: 'USD', country: 'Ethiopia',
    countryI18n: { so: 'Itoobiya', 'pt-BR': 'Etiópia', es: 'Etiopía', ar: 'إثيوبيا' },
    flag: '🇪🇹', rate: 1, currencyName: 'US Dollar', wallets: ['Telebirr', 'CBE Birr'],
  },
  {
    code: 'BR', currency: 'USD', country: 'Brazil',
    countryI18n: { so: 'Brazil', 'pt-BR': 'Brasil', es: 'Brasil', ar: 'البرازيل' },
    flag: '🇧🇷', rate: 1, currencyName: 'US Dollar', wallets: ['Bank transfer'],
  },
  {
    code: 'MX', currency: 'USD', country: 'Mexico',
    countryI18n: { so: 'Mexico', 'pt-BR': 'México', es: 'México', ar: 'المكسيك' },
    flag: '🇲🇽', rate: 1, currencyName: 'US Dollar', wallets: ['Bank transfer'],
  },
]

export const defaultCorridor = corridors[0]!

export type Recipient = {
  id: string
  name: string
  phone: string
  corridorCode: string
  wallet: string
  last4: string
  hue: number
}

export type PaymentMethodId = 'bank' | 'debit' | 'apple' | 'google'

export const paymentMethods: { id: PaymentMethodId; labelKey: string; detail: string }[] = [
  { id: 'bank', labelKey: 'pay.bank', detail: '' },
  { id: 'debit', labelKey: 'pay.debit', detail: '' },
  { id: 'apple', labelKey: 'pay.applePay', detail: '' },
  { id: 'google', labelKey: 'pay.googlePay', detail: '' },
]

export type Transaction = {
  id: string
  recipientId: string
  amountUsd: number
  fee: number
  date: string
  status: 'completed' | 'pending'
  reference: string
}

export const TRANSFER_FEE = 4.99

export function getCorridor(code: string) {
  return corridors.find((corridor) => corridor.code === code) ?? defaultCorridor
}

/** Country name in the active language, falling back to English. */
export function corridorName(corridor: Corridor, lang: Lang) {
  return corridor.countryI18n[lang] ?? corridor.country
}
