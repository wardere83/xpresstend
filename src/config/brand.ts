/**
 * Single source of truth for company identity.
 * Change `name` here and it updates the logo, page title copy, assistant name,
 * receipt reference prefix and footer everywhere in the app.
 */

/**
 * The registered entity, used wherever the company is named formally rather
 * than worn as a product: the corporate footer, the policies, and the company,
 * compliance and security pages.
 *
 * Declared above the object so the sentences below can be composed from it
 * rather than repeating it. The previous version spelled the name out again
 * inside `legal.licence`, which is how a rename leaves one page disagreeing
 * with another about what the company is called.
 */
const LEGAL_NAME = 'XpressTend Financial Services LLC'

/**
 * Marks a fact that has not been confirmed from a primary source.
 *
 * These render visibly on the page. That is the point: an unfilled field is
 * meant to be impossible to miss and to be filled before the site is shown to
 * anyone, whereas a plausible guess in its place would be read as fact by the
 * one audience that checks. Nothing here may be invented — a registered
 * address, a formation state or a licence number is either documented or it is
 * one of these.
 */
export const NEEDS_FACT = '[NEEDS FACT]' as const

export const brand = {
  name: 'XpressTend',
  legalName: LEGAL_NAME,
  assistantName: 'Xpress Assistant',
  /** Prefix used on transfer reference IDs, e.g. XPT-8457-2391-2024 */
  referencePrefix: 'XPT',
  /** Canonical English tagline. The UI reads the translated
   *  marketing.heroTitle key instead, so this is for non-UI use. */
  tagline: 'Closer with every transfer!',
  /**
   * The canonical public origin, matching the Worker's custom domain and the
   * CNAME. Social cards need absolute URLs, so this is what they are built on.
   */
  site: 'https://xpresstend.com',
  hq: {
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    /**
     * Street address and ZIP of the registered office.
     *
     * Empty, and shown as an unfilled field rather than approximated. A bank's
     * onboarding team reconciles the address on a website against the one on
     * the NMLS record and the formation documents; a city alone is incomplete,
     * and a street invented to look complete is a discrepancy in their file.
     */
    line1: '',
    zip: '',
  },
  support: {
    phone: '+1 (206) 331-9867',
    email: 'support@xpresstend.com',
    hours: '24/7',
  },
  /**
   * Corporate formation. Unfilled until read off the filed documents: the
   * state and year a company was formed are checkable public record, so a
   * guess here is a guess that gets caught.
   */
  formation: {
    state: '',
    year: '',
    /** Entity type as filed, e.g. "Limited liability company". */
    type: '',
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
    licence: `${LEGAL_NAME} is registered in the Nationwide Multistate Licensing System, NMLS ID 2900672. Current licence status for each state is published at nmlsconsumeraccess.org.`,
    /*
     * Where the company actually is, in one sentence.
     *
     * The audience for this is a bank's onboarding team, a payout partner and a
     * state examiner, all of whom will establish the answer in minutes whatever
     * the site says. A company that states it plainly reads as one that knows
     * its own position; a company found to have implied more reads as one whose
     * other representations now need checking too. The second is the expensive
     * outcome, and it is the one that overstating buys.
     *
     * This is the only place the status is written. When transfers go live it
     * changes here and everywhere it is shown changes with it.
     */
    operatingStatus:
      'XpressTend is completing state money transmitter licensing and banking partner onboarding. Customer transfers are not yet being processed, and XpressTend does not hold or move customer funds.',
  },
  /**
   * App availability.
   *
   * `released` is the single switch the UI reads. While it is false neither
   * platform renders a link, so there is no way to reach a build from the
   * public site. Flip it to true when the apps are published and the buttons
   * come back with no other change.
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
