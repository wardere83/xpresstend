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
  /**
   * Nationwide Multistate Licensing System registration.
   *
   * An NMLS ID identifies the company's record in the system. It is not itself
   * a licence: licences are granted state by state, and which ones have been
   * granted is recorded against this ID. That distinction is why the copy that
   * uses this never asserts a licence status of its own and points at Consumer
   * Access instead. The public record is authoritative, always current, and
   * cannot be contradicted by a stale sentence on a marketing page.
   */
  nmls: {
    id: '2900672',
    /** Where anyone can verify the ID and see the live licence status. */
    verifyUrl: 'https://www.nmlsconsumeraccess.org/',
  },
  legal: {
    /*
     * Deliberately states the registration rather than a licence status. If a
     * licence is granted in a state, the NMLS record shows it the day it
     * happens; a sentence here would have to be remembered and updated, and
     * would be wrong in the meantime. Being wrong in either direction matters:
     * claiming a licence you do not hold is what regulators act on, and
     * disclaiming one you do hold costs you customers.
     */
    licence:
      'XpressTend Financial Services is registered in the Nationwide Multistate Licensing System, NMLS ID 2900672. Current licence status for each state is published at nmlsconsumeraccess.org.',
  },
  /**
   * App availability.
   *
   * `released` is the single switch the UI reads. While it is false both
   * platforms show as coming soon and neither link is rendered, so there is no
   * way to reach a build from the public site. Flip it to true when the apps
   * are genuinely ready and the buttons come back with no other change.
   *
   * The URLs are kept rather than deleted so flipping the switch is all it
   * takes. androidApk points at the rolling GitHub release; iosTestFlight is
   * the TestFlight public link, created in App Store Connect under Users and
   * Access → TestFlight → public link.
   */
  appLinks: {
    released: false,
    androidApk: 'https://github.com/wardere83/xpresstend/releases/latest/download/xpresstend.apk',
    iosTestFlight: '',
  },
} as const
