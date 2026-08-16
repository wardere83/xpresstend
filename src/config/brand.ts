/**
 * Single source of truth for company identity.
 * Change `name` here and it updates the logo, page title copy, assistant name,
 * receipt reference prefix and footer everywhere in the app.
 */
export const brand = {
  name: 'NabadPay',
  assistantName: 'Nabad Assistant',
  /** Prefix used on transfer reference IDs, e.g. NBDP-8457-2391-2024 */
  referencePrefix: 'NBDP',
  tagline: 'Send money home, in your language',
  hq: {
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    line1: '1201 Third Avenue, Suite 2200',
    zip: '98101',
  },
  support: {
    phone: '+1 (206) 555-0142',
    email: 'support@nabadpay.com',
    hours: '24/7',
  },
  legal: {
    licence: 'Licensed money transmitter (NMLS #1847302)',
  },
} as const
