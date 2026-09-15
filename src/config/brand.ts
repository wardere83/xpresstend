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
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    line1: '',
    zip: '',
  },
  support: {
    phone: '+1 (206) 331-9867',
    email: 'support@xpresstend.com',
    hours: '24/7',
  },
  legal: {
    licence: 'Private beta. Not yet a licensed money transmitter.',
  },
  /**
   * Where the beta builds live. The Android APK downloads straight from the
   * rolling GitHub release. iOS is the TestFlight public link — paste it here
   * once one is created in App Store Connect (Users and Access → TestFlight →
   * public link); while it is empty the UI points at the get-the-app section
   * instead of a dead button.
   */
  appLinks: {
    androidApk: 'https://github.com/wardere83/xpresstend/releases/latest/download/xpresstend.apk',
    iosTestFlight: '',
  },
} as const
