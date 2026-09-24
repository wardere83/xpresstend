import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { Contents, Facts, H, NeedsFact, Shell } from './PageShell'
import { CORRIDORS as PRICED } from './pricing'

/**
 * The pages a company is assessed from rather than sold from.
 *
 * Everything stated here is drawn from what the system actually does — the
 * limits are the ones compliance.ts enforces, the headers are the ones the
 * Worker sets, the ledger description is how money.ts and ledger.ts work. A
 * claim that cannot be traced to code or to a public register is not made,
 * because these pages are read by people whose job is to check.
 */

/** The corridors served, named from the same table the calculator prices from. */
const CORRIDORS = PRICED.map((c) => c.label).join(', ')

/** Written once, shown wherever a reader needs to know where things stand. */
function OperatingStatus() {
  return (
    <div className="rounded-xl bg-canvas p-4 ring-1 ring-ink-200">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
        Operating status
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">{brand.legal.operatingStatus}</p>
    </div>
  )
}

export function Company() {
  return (
    <Shell
      title="Company"
      description={`${brand.legalName} is a cross-border payments company in ${brand.hq.city}, ${brand.hq.state}. Company facts, corridors served, registration and contact details.`}
      intro={`${brand.legalName} is a cross-border payments company based in ${brand.hq.city}, ${brand.hq.state}, building a remittance service for people sending money to family abroad.`}
    >
      <Contents
        items={[
          { id: 'what', label: 'What we do' },
          { id: 'facts', label: 'Company facts' },
          { id: 'corridors', label: 'Corridors' },
          { id: 'approach', label: 'How we are building it' },
          { id: 'status', label: 'Where things stand' },
          { id: 'contact', label: 'Contact' },
        ]}
      />

      <H id="what">What we do</H>
      <p>
        XpressTend moves money from the United States to families abroad. A sender chooses a
        recipient and an amount, sees the fee and the amount that will arrive before committing, and
        can follow the transfer through to payout. The product is offered on the web and as iOS and
        Android applications built from the same codebase.
      </p>
      <p>
        Dollars sent arrive as dollars on every corridor we price. The fee is 0.99% of the amount
        sent, quoted in full before a transfer is created and re-priced on the server when it is,
        so the price shown is the price charged.
      </p>

      <H id="facts">Company facts</H>
      <Facts
        rows={[
          { k: 'Legal name', v: brand.legalName },
          {
            k: 'Entity type',
            v: brand.formation.type || <NeedsFact what="entity type as filed" />,
          },
          {
            k: 'State of formation',
            v: brand.formation.state || <NeedsFact what="state of formation" />,
          },
          {
            k: 'Year formed',
            v: brand.formation.year || <NeedsFact what="year of formation" />,
          },
          {
            k: 'Registered office',
            v: brand.hq.line1 ? (
              `${brand.hq.line1}, ${brand.hq.city}, ${brand.hq.state} ${brand.hq.zip}, ${brand.hq.country}`
            ) : (
              <>
                {brand.hq.city}, {brand.hq.state}, {brand.hq.country} —{' '}
                <NeedsFact what="street address and ZIP" />
              </>
            ),
          },
          {
            k: 'NMLS ID',
            v: (
              <a
                className="underline"
                href={brand.nmls.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {brand.nmls.id} — verify at NMLS Consumer Access
              </a>
            ),
          },
          { k: 'Corridors priced', v: CORRIDORS },
          { k: 'Settlement currency', v: 'USD to USD on every corridor' },
          { k: 'Languages supported', v: 'English, Somali, Spanish, Portuguese, Arabic' },
          {
            k: 'General enquiries',
            v: <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>,
          },
        ]}
      />

      <H id="corridors">Corridors</H>
      <p>
        We price {CORRIDORS}. Each corridor is a row in the same table the public rate calculator
        and the product both read, so a quote on the website and a quote inside the app cannot
        disagree.
      </p>

      <H id="approach">How we are building it</H>
      {/*
        High level by design. This section describes the shape of the system
        and the properties it guarantees — it names no supplier, no platform
        and no component a reader could use to map our infrastructure. What a
        partner needs from this page is the engineering posture; the rest is
        for a diligence call under NDA.

        Every claim below is a property the code actually has. "Sophisticated"
        that is not also true is the one thing this audience punishes, because
        each of these is demonstrable in a screen-share and an invented one
        would be found in the first ten minutes.
      */}
      <p>
        XpressTend is built as a single distributed service deployed close to the people using it,
        rather than as an interface calling a distant core. The customer application, the public
        site and the transaction engine are one system, which removes an entire class of
        cross-boundary failure and keeps the path between a sender tapping an amount and a priced,
        recorded transaction as short as the network allows. In remittances, responsiveness is not
        a nicety: it is the difference between a sender who completes and a sender who reconsiders.
      </p>
      <p>
        <strong className="text-ink-900">Money is held in a ledger, not in a balance column.</strong>{' '}
        Every movement is recorded as balanced double-entry postings in integer minor units under
        arbitrary-precision arithmetic — no floating-point value touches an amount anywhere in the
        system. Balances are derived from those postings rather than stored, so they cannot silently
        drift, and a trial balance can be re-proved on demand. Each transfer's postings are written
        atomically and exactly once: a retry, a timeout or a crash mid-flight cannot produce a
        double posting or a transfer marked paid with no accounting behind it.
      </p>
      <p>
        <strong className="text-ink-900">Pricing is authoritative, not advisory.</strong> Every quote
        is recalculated by the server at the moment a transfer is created, so the figure a customer
        agreed is the figure the ledger records and no modified client can buy a better rate than
        the corridor allows. Reference rates are refreshed on a schedule, stored as scaled integers
        rather than decimals, and screened on arrival: a rate that moves implausibly against the
        last accepted value is rejected rather than used, so a bad upstream feed cannot price real
        transfers. Fees round up and recipient amounts round down, so rounding never quietly
        promises a recipient more than the transfer funds.
      </p>
      <p>
        <strong className="text-ink-900">Controls execute; they are not merely described.</strong>{' '}
        Verification tiers, per-transfer, daily and monthly ceilings, velocity limits and sanctions
        screening run server-side on every transfer against the account's own history, and each
        outcome — including a clear one — is written to an append-only record. Staff permissions are
        role-based, privileged actions are attributable to a named person, and nothing in the system
        updates or deletes an audit entry. A money transmitter is judged on whether the controls it
        publishes are the controls that actually run; ours answer "show me" with a query rather than
        a description.
      </p>
      <p>
        <strong className="text-ink-900">One product across every surface.</strong> Web, iOS and
        Android are built from a single codebase, so a control, a correction or a disclosure ships
        everywhere at once and cannot be right on one platform and stale on another. Five languages
        ship, including full right-to-left support, because the people this service is for do not
        all read English.
      </p>
      <p>
        The <Link className="underline" to="/security">security and platform</Link> page sets out the
        protections in more detail, and the{' '}
        <Link className="underline" to="/compliance">compliance</Link> page sets out exactly what is
        checked and recorded.
      </p>

      <H id="status">Where things stand</H>
      <OperatingStatus />
      <p>
        We are in active conversations with banking and payout partners. If that is you, the{' '}
        <Link className="underline" to="/partners">partnerships</Link> page sets out what is built
        and what we are looking for.
      </p>

      <H id="contact">Contact</H>
      <p>
        General enquiries:{' '}
        <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>
        {' · '}
        <a className="underline" href={`tel:${brand.support.phone.replace(/[^+\d]/g, '')}`}>
          {brand.support.phone}
        </a>
        . Partnership and institutional enquiries are handled through the{' '}
        <Link className="underline" to="/partners">partnerships</Link> page.
      </p>
    </Shell>
  )
}

export function Compliance() {
  return (
    <Shell
      title="Compliance"
      description="XpressTend's NMLS registration, verification tiers and enforced transaction limits, sanctions screening, records and audit, and consumer disclosure."
      intro="How XpressTend is registered, what is checked before a transfer is allowed, and what is recorded. Written for banking partners, payout partners and regulators."
    >
      <Contents
        items={[
          { id: 'registration', label: 'Registration' },
          { id: 'status', label: 'Operating status' },
          { id: 'identity', label: 'Customer identification' },
          { id: 'limits', label: 'Transaction limits' },
          { id: 'screening', label: 'Sanctions screening' },
          { id: 'records', label: 'Records and audit' },
          { id: 'consumer', label: 'Consumer disclosure' },
          { id: 'contact', label: 'Compliance contact' },
        ]}
      />

      <H id="registration">Registration</H>
      <p>{brand.legal.licence}</p>
      <p>
        An NMLS ID identifies a company's record in the Nationwide Multistate Licensing System. It
        is not itself a licence: licences are granted state by state and recorded against that ID.
        We therefore point to the register rather than describing our own licence status, because
        the register is authoritative, current, and cannot be contradicted by a stale sentence on a
        website.{' '}
        <a
          className="underline"
          href={brand.nmls.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Verify NMLS ID {brand.nmls.id}
        </a>
        .
      </p>

      <H id="status">Operating status</H>
      <OperatingStatus />

      <H id="identity">Customer identification</H>
      <p>
        Every account carries a verification tier. Tier 0 — an account that has not completed
        identity verification — cannot create a transfer at all; the limit is zero and the attempt
        is refused rather than queued. Higher tiers raise the ceilings set out below. Verification
        results are recorded against the account.
      </p>

      <H id="limits">Transaction limits</H>
      <p>
        Limits are enforced on the server when a transfer is created, against the account's own
        history, not merely published. Cancelled and failed transfers do not consume an allowance.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <caption className="sr-only">Transaction limits by verification tier</caption>
          <thead>
            <tr className="border-b border-ink-200 text-left text-ink-900">
              <th scope="col" className="py-2 pr-4 font-semibold">Tier</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Per transfer</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Daily</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Monthly</th>
              <th scope="col" className="py-2 font-semibold">Transfers / 24h</th>
            </tr>
          </thead>
          <tbody className="text-ink-700">
            <tr className="border-b border-ink-200/60">
              <th scope="row" className="py-2 pr-4 text-left font-normal">0 — unverified</th>
              <td className="py-2 pr-4" colSpan={4}>No transfers permitted</td>
            </tr>
            <tr className="border-b border-ink-200/60">
              <th scope="row" className="py-2 pr-4 text-left font-normal">1</th>
              <td className="py-2 pr-4">$1,000</td>
              <td className="py-2 pr-4">$2,000</td>
              <td className="py-2 pr-4">$10,000</td>
              <td className="py-2">5</td>
            </tr>
            <tr className="border-b border-ink-200/60">
              <th scope="row" className="py-2 pr-4 text-left font-normal">2</th>
              <td className="py-2 pr-4">$5,000</td>
              <td className="py-2 pr-4">$10,000</td>
              <td className="py-2 pr-4">$50,000</td>
              <td className="py-2">10</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal">3</th>
              <td className="py-2 pr-4">$20,000</td>
              <td className="py-2 pr-4">$50,000</td>
              <td className="py-2 pr-4">$200,000</td>
              <td className="py-2">20</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H id="screening">Sanctions screening</H>
      <p>
        Every transfer is screened before it can proceed, and the result — including a clear
        result — is written to a screening record against that transfer. A match holds the transfer
        for review rather than failing it silently.
      </p>
      <p>
        The screening list in the current build is a local demonstration list, not a licensed
        sanctions feed. We state that plainly rather than dressing it up: the control, the record
        and the hold behaviour are real and running, and the integration point for a licensed
        provider is a single module. Selecting that provider is part of the onboarding work we are
        doing now with prospective partners.
      </p>

      <H id="records">Records and audit</H>
      <p>
        Transfers, screening results, verification checks and staff actions are written to an audit
        log as they happen. Releasing a payout is restricted to compliance and owner roles and is
        always recorded against a named person. Staff access is role-based across viewer, agent,
        compliance and owner, and disabling an account revokes its live sessions rather than only
        preventing the next sign-in.
      </p>
      <p>
        Balances are not stored as figures that could drift. They are derived from double-entry
        ledger postings, where every posting must net to zero within its currency, and a trial
        balance can be re-proved on demand. The answer to "show me" is a query.
      </p>

      <H id="consumer">Consumer disclosure</H>
      <p>
        The fee, the amount the recipient receives and the delivery method are shown before a
        transfer is confirmed, and repeated on the receipt. Fees round up and recipient amounts
        round down, so rounding never quietly promises a recipient more than the transfer funds.
        Our <Link className="underline" to="/privacy">privacy policy</Link> describes what is
        stored and why, written from the actual schema.
      </p>

      <H id="contact">Compliance contact</H>
      <p>
        Regulators and partner compliance teams can reach us at{' '}
        <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>.
        We will route the enquiry to the responsible person and respond in writing.
      </p>
    </Shell>
  )
}

export function Security() {
  return (
    <Shell
      title="Security and platform"
      description="XpressTend's architecture, response headers, credential and session handling, money representation, access control and responsible disclosure."
      intro="How the service is built, how money is represented, and what protects the data. Written for technical and security reviewers."
    >
      <Contents
        items={[
          { id: 'architecture', label: 'Architecture' },
          { id: 'transport', label: 'Transport and headers' },
          { id: 'accounts', label: 'Accounts and sessions' },
          { id: 'money', label: 'How money is represented' },
          { id: 'access', label: 'Access control' },
          { id: 'apps', label: 'Mobile applications' },
          { id: 'disclosure', label: 'Responsible disclosure' },
        ]}
      />

      <H id="architecture">Architecture</H>
      <p>
        The website, the API and the customer application are one service running at the edge, with
        a SQL datastore. Serving the front end and the API from a single origin is what allows the
        response headers below to apply to the markup as well as the API — a static host cannot set
        them — and it removes cross-origin credential handling entirely, because the application
        and the API share an origin.
      </p>

      <H id="transport">Transport and headers</H>
      <p>Every response carries:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>A Content Security Policy with <code>script-src 'self'</code> and no inline script, <code>object-src 'none'</code> and <code>frame-ancestors 'none'</code></li>
        <li>HTTP Strict Transport Security, one year, including subdomains, preload</li>
        <li><code>X-Frame-Options: DENY</code> alongside the CSP directive, for engines predating CSP 2</li>
        <li><code>X-Content-Type-Options: nosniff</code></li>
        <li><code>Referrer-Policy: strict-origin-when-cross-origin</code></li>
        <li>A Permissions Policy denying camera, geolocation and payment</li>
        <li><code>Cross-Origin-Opener-Policy: same-origin</code></li>
      </ul>

      <H id="accounts">Accounts and sessions</H>
      <p>
        Passwords are hashed with PBKDF2 over chained rounds, seeded by a server-held pepper that is
        not stored in the database, so a leaked table cannot be attacked offline with the table
        alone. The effective iteration count is recorded per row and can be raised later without
        invalidating existing credentials. Sessions are server-side records that can be revoked
        individually or in bulk, which is what makes disabling an account take effect immediately.
      </p>
      <p>
        Rate limiting is applied to authentication routes. Account recovery burns its token on use
        rather than relying on expiry alone, and invalid, expired, used and revoked tokens are
        deliberately indistinguishable to the caller.
      </p>

      <H id="money">How money is represented</H>
      <p>
        Amounts are integer minor units in arbitrary-precision arithmetic. No floating-point value
        touches a monetary amount anywhere in the system. Balances are derived from double-entry
        postings rather than stored, every posting must net to zero within its currency, and a
        trial balance is re-provable on demand.
      </p>
      <p>
        Quotes are re-priced on the server when a transfer is created, so a modified client payload
        cannot buy a better rate than the corridor allows. Fees round up and recipient amounts round
        down, so rounding never costs the business money nor promises a recipient more than the
        margin funds.
      </p>

      <H id="access">Access control</H>
      <p>
        Staff roles are viewer, agent, compliance and owner. Releasing a payout is restricted to
        compliance and owner. Two structural guards prevent the console being locked from inside it:
        nobody may change their own role or status, and the last active owner cannot be demoted or
        disabled. Staff are added by invitation, which creates an account that cannot be signed into
        until the invitee sets their own password, rather than by an administrator choosing someone
        else's credentials.
      </p>

      <H id="apps">Mobile applications</H>
      <p>
        The iOS and Android applications run the same build the web service serves, so the product
        is written and reviewed once. Platform behaviour is real platform API rather than a web
        imitation: a biometric lock over balances and history that re-locks after time in the
        background, biometric confirmation on a transfer with a PIN fallback, and native handling of
        the status bar, the back button and network state.
      </p>

      <H id="disclosure">Responsible disclosure</H>
      <p>
        If you believe you have found a vulnerability, write to{' '}
        <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>{' '}
        with enough detail to reproduce it. We will acknowledge, keep you updated while we
        investigate, and credit you if you would like to be credited. Please give us a reasonable
        opportunity to fix an issue before disclosing it publicly.
      </p>
    </Shell>
  )
}

export function Partners() {
  return (
    <Shell
      title="Partnerships"
      description="What XpressTend has built, what needs a banking or payout partner, the diligence materials available, and how to start a conversation."
      intro="What is built, what we are looking for, and how to start a conversation. For banking partners, payout partners and infrastructure providers."
    >
      <Contents
        items={[
          { id: 'built', label: 'What is already built' },
          { id: 'looking', label: 'What we are looking for' },
          { id: 'diligence', label: 'Diligence materials' },
          { id: 'contact', label: 'Start a conversation' },
        ]}
      />

      <H id="built">What is already built</H>
      <p>
        The product is complete through the full send journey and running: accounts, recipients,
        quoting, transfer creation, the compliance checks described on the{' '}
        <Link className="underline" to="/compliance">compliance</Link> page, a staff operations
        console with role-based access and an audit trail, and a double-entry ledger that balances.
        Web, iOS and Android are one codebase. Five languages ship, including right-to-left Arabic.
      </p>
      <p>
        What is not built is the part that needs a partner: the regulated rail. Payment capture
        moves a transfer to a compliance hold and writes the ledger without charging or releasing
        anything, so the surrounding system is exercised end to end while no customer funds move.
      </p>

      <H id="looking">What we are looking for</H>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong className="text-ink-900">A sponsor bank or licensed payment partner</strong> for
          US-originated transfers.
        </li>
        <li>
          <strong className="text-ink-900">Payout partners</strong> on the corridors we price:{' '}
          {CORRIDORS}. Mobile wallet, bank deposit and cash pickup.
        </li>
        <li>
          <strong className="text-ink-900">A licensed KYC and sanctions screening provider.</strong>{' '}
          The control, the record and the hold behaviour already run; the provider plugs into a
          single module.
        </li>
        <li>
          <strong className="text-ink-900">Card acquiring and account funding</strong> for the
          sending side.
        </li>
      </ul>

      <H id="diligence">Diligence materials</H>
      <p>
        The <Link className="underline" to="/compliance">compliance</Link> and{' '}
        <Link className="underline" to="/security">security</Link> pages are written for review and
        describe controls that are running rather than planned. We can walk a technical or
        compliance team through the ledger, the limit enforcement and the audit trail directly, and
        provide further documentation under NDA on request.
      </p>

      <H id="contact">Start a conversation</H>
      <p>
        Write to{' '}
        <a
          className="underline"
          href={`mailto:${brand.support.email}?subject=Partnership%20enquiry`}
        >
          {brand.support.email}
        </a>{' '}
        with the organisation you represent and the area above that fits. Tell us what you would
        need to see to progress and we will send it. We answer partnership enquiries in writing,
        usually within two business days.
      </p>
      <p>
        {brand.legalName} · {brand.hq.city}, {brand.hq.state}, {brand.hq.country} ·{' '}
        <a className="underline" href={`tel:${brand.support.phone.replace(/[^+\d]/g, '')}`}>
          {brand.support.phone}
        </a>
      </p>
    </Shell>
  )
}
