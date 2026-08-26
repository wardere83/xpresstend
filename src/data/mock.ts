import type { Lang } from '../i18n/langs'

export type Corridor = {
  code: string
  /** ISO currency of the destination */
  currency: string
  /** Country name in English */
  country: string
  /** Country name per language; English is the fallback. */
  countryI18n: Partial<Record<Lang, string>>
  flag: string
  /** Destination currency units per 1 USD */
  rate: number
  /** Localised currency name shown on the send screen */
  currencyName: string
  wallets: string[]
}

export const corridors: Corridor[] = [
  {
    code: 'SO',
    currency: 'SOS',
    country: 'Somalia',
    countryI18n: {
      so: 'Soomaaliya',
      'pt-BR': 'Somália',
      es: 'Somalia',
      ar: 'الصومال',
    },
    flag: '🇸🇴',
    rate: 2556,
    currencyName: 'Somali Shilling',
    wallets: ['EVC Plus', 'Zaad', 'Sahal', 'eDahab'],
  },
  {
    code: 'KE',
    currency: 'KES',
    country: 'Kenya',
    countryI18n: {
      so: 'Kenya',
      'pt-BR': 'Quênia',
      es: 'Kenia',
      ar: 'كينيا',
    },
    flag: '🇰🇪',
    rate: 129.4,
    currencyName: 'Kenyan Shilling',
    wallets: ['M-Pesa', 'Airtel Money'],
  },
  {
    code: 'ET',
    currency: 'ETB',
    country: 'Ethiopia',
    countryI18n: {
      so: 'Itoobiya',
      'pt-BR': 'Etiópia',
      es: 'Etiopía',
      ar: 'إثيوبيا',
    },
    flag: '🇪🇹',
    rate: 118.2,
    currencyName: 'Ethiopian Birr',
    wallets: ['Telebirr', 'CBE Birr'],
  },
  {
    code: 'DJ',
    currency: 'DJF',
    country: 'Djibouti',
    countryI18n: {
      so: 'Jabuuti',
      'pt-BR': 'Djibuti',
      es: 'Yibuti',
      ar: 'جيبوتي',
    },
    flag: '🇩🇯',
    rate: 177.7,
    currencyName: 'Djiboutian Franc',
    wallets: ['D-Money', 'Waafi'],
  },
  {
    code: 'UG',
    currency: 'UGX',
    country: 'Uganda',
    countryI18n: {
      so: 'Uganda',
      'pt-BR': 'Uganda',
      es: 'Uganda',
      ar: 'أوغندا',
    },
    flag: '🇺🇬',
    rate: 3785,
    currencyName: 'Ugandan Shilling',
    wallets: ['MTN MoMo', 'Airtel Money'],
  },
  {
    code: 'GB',
    currency: 'GBP',
    country: 'United Kingdom',
    countryI18n: {
      so: 'Boqortooyada Midowday',
      'pt-BR': 'Reino Unido',
      es: 'Reino Unido',
      ar: 'المملكة المتحدة',
    },
    flag: '🇬🇧',
    rate: 0.78,
    currencyName: 'British Pound',
    wallets: ['Bank transfer'],
  },
  {
    code: 'AE',
    currency: 'AED',
    country: 'United Arab Emirates',
    countryI18n: {
      so: 'Imaaraadka',
      'pt-BR': 'Emirados Árabes Unidos',
      es: 'Emiratos Árabes Unidos',
      ar: 'الإمارات العربية المتحدة',
    },
    flag: '🇦🇪',
    rate: 3.67,
    currencyName: 'UAE Dirham',
    wallets: ['Bank transfer', 'Cash pickup'],
  },
  {
    code: 'IN',
    currency: 'INR',
    country: 'India',
    countryI18n: {
      so: 'Hindiya',
      'pt-BR': 'Índia',
      es: 'India',
      ar: 'الهند',
    },
    flag: '🇮🇳',
    rate: 83.4,
    currencyName: 'Indian Rupee',
    wallets: ['UPI', 'Bank transfer'],
  },
]

export const defaultCorridor = corridors[0]

export type Recipient = {
  id: string
  name: string
  phone: string
  corridorCode: string
  wallet: string
  last4: string
  favourite: boolean
  /** Relationship label, purely cosmetic */
  relation: string
  /** Relationship label per language; English is the fallback. */
  relationI18n: Partial<Record<Lang, string>>
  hue: number
}

export const recipients: Recipient[] = [
  {
    id: 'r1',
    name: 'Hooyo',
    phone: '+252 61 123 4567',
    corridorCode: 'SO',
    wallet: 'EVC Plus',
    last4: '4721',
    favourite: true,
    relation: 'Mother',
    relationI18n: {
      so: 'Hooyo',
      'pt-BR': 'Mãe',
      es: 'Madre',
      ar: 'الوالدة',
    },
    hue: 268,
  },
  {
    id: 'r2',
    name: 'Abdi Warsame',
    phone: '+252 61 884 2210',
    corridorCode: 'SO',
    wallet: 'Zaad',
    last4: '2210',
    favourite: true,
    relation: 'Brother',
    relationI18n: {
      so: 'Walaal',
      'pt-BR': 'Irmão',
      es: 'Hermano',
      ar: 'الأخ',
    },
    hue: 202,
  },
  {
    id: 'r3',
    name: 'Fadumo Ali',
    phone: '+254 712 448 903',
    corridorCode: 'KE',
    wallet: 'M-Pesa',
    last4: '8903',
    favourite: true,
    relation: 'Sister',
    relationI18n: {
      so: 'Walaashay',
      'pt-BR': 'Irmã',
      es: 'Hermana',
      ar: 'الأخت',
    },
    hue: 340,
  },
  {
    id: 'r4',
    name: 'Mohamed Yusuf',
    phone: '+251 911 220 774',
    corridorCode: 'ET',
    wallet: 'Telebirr',
    last4: '0774',
    favourite: false,
    relation: 'Cousin',
    relationI18n: {
      so: 'Ina-adeer',
      'pt-BR': 'Primo',
      es: 'Primo',
      ar: 'ابن العم',
    },
    hue: 152,
  },
  {
    id: 'r5',
    name: 'Amina Farah',
    phone: '+253 77 445 118',
    corridorCode: 'DJ',
    wallet: 'D-Money',
    last4: '5118',
    favourite: false,
    relation: 'Aunt',
    relationI18n: {
      so: 'Eeddo',
      'pt-BR': 'Tia',
      es: 'Tía',
      ar: 'العمة',
    },
    hue: 28,
  },
  {
    id: 'r6',
    name: 'Ismail Nur',
    phone: '+44 7700 900 145',
    corridorCode: 'GB',
    wallet: 'Bank transfer',
    last4: '0145',
    favourite: false,
    relation: 'Friend',
    relationI18n: {
      so: 'Saaxiib',
      'pt-BR': 'Amigo',
      es: 'Amigo',
      ar: 'صديق',
    },
    hue: 246,
  },
]

export type PaymentMethodId = 'bank' | 'debit' | 'apple' | 'google'

export const paymentMethods: { id: PaymentMethodId; labelKey: string; detail: string }[] = [
  { id: 'bank', labelKey: 'pay.bank', detail: 'Chase •••• 1234' },
  { id: 'debit', labelKey: 'pay.debit', detail: 'Visa •••• 5678' },
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

export const transactions: Transaction[] = [
  {
    id: 't1',
    recipientId: 'r1',
    amountUsd: 200,
    fee: 4.99,
    date: '2024-05-12T09:24:00Z',
    status: 'completed',
    reference: 'XPT-7741-1180-2024',
  },
  {
    id: 't2',
    recipientId: 'r3',
    amountUsd: 150,
    fee: 4.99,
    date: '2024-05-04T17:02:00Z',
    status: 'completed',
    reference: 'XPT-7620-8842-2024',
  },
  {
    id: 't3',
    recipientId: 'r2',
    amountUsd: 320,
    fee: 4.99,
    date: '2024-04-28T12:41:00Z',
    status: 'completed',
    reference: 'XPT-7455-3391-2024',
  },
  {
    id: 't4',
    recipientId: 'r4',
    amountUsd: 90,
    fee: 4.99,
    date: '2024-04-19T08:15:00Z',
    status: 'pending',
    reference: 'XPT-7302-5527-2024',
  },
]

export const user = {
  firstName: 'Ahmed',
  fullName: 'Ahmed Hassan',
  phone: '+1 (206) 555-0188',
  email: 'ahmed@example.com',
  memberSince: 2021,
  balanceUsd: 1245.5,
  referralCode: 'AHMED-2024',
  referralEarned: 40,
  hue: 262,
}

export const TRANSFER_FEE = 4.99

export function getRecipient(id: string) {
  return recipients.find((r) => r.id === id) ?? recipients[0]
}

export function getCorridor(code: string) {
  return corridors.find((c) => c.code === code) ?? defaultCorridor
}

/** Country name in the active language, falling back to English. */
export function corridorName(corridor: Corridor, lang: Lang) {
  return corridor.countryI18n[lang] ?? corridor.country
}

/** Relationship label in the active language, falling back to English. */
export function relationName(recipient: Recipient, lang: Lang) {
  return recipient.relationI18n[lang] ?? recipient.relation
}
