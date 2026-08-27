/**
 * Single source of truth for company identity.
 * Change `name` here and it updates the logo, page title copy, assistant name,
 * receipt reference prefix and footer everywhere in the app.
 */
export const brand = {
  name: 'XpressTend',
  assistantName: 'Xpress Assistant',
  /** Prefix used on transfer reference IDs, e.g. XPT-8457-2391-2024 */
  referencePrefix: 'XPT',
  /** Canonical English tagline. The UI reads the translated
   *  marketing.heroTitle key instead, so this is for non-UI use. */
  tagline: 'Closer with every transfer!',
  hq: {
    city: 'New York',
    state: 'NY',
    country: 'USA',
    line1: '255 West 43rd Street',
    zip: '10036',
  },
  support: {
    phone: '+1 (212) 555-0142',
    email: 'support@xpresstend.com',
    hours: '24/7',
  },
  legal: {
    licence: 'Private beta. Not yet a licensed money transmitter.',
  },
} as const
