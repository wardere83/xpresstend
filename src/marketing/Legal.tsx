import { brand } from '../config/brand'
import { Contents, H, Q, Shell } from './PageShell'

/**
 * Privacy policy and support pages.
 *
 * Apple requires a reachable Privacy Policy URL and Support URL before an app
 * can be submitted, and both must describe what the software actually does.
 * The policy below is written from the real schema: the fields the API stores,
 * why, and what never leaves the device. It is deliberately specific rather
 * than boilerplate, because a generic policy that misdescribes a money product
 * is worse than none.
 *
 * English only. This is a legal document and a mistranslation carries real
 * consequence, so it should be translated by someone qualified rather than by
 * the same process as the interface copy.
 */
const UPDATED = '2 September 2026'

export function Privacy() {
  return (
    <Shell
      title="Privacy Policy"
      description="What XpressTend collects, why, what never reaches us, how long records are kept, and the rights you have over your data."
      updated={UPDATED}
    >
      <p>
        This policy explains what XpressTend collects, why, and what we do with it. It
        describes the service as it actually works today.
      </p>

      {/* The disclosure stays: it is the one statement here that has to be
          true whatever the company's licensing status, and it is exactly what a
          prospective banking or wallet partner looks for. It reads from the
          single source in brand.ts rather than restating it, so the day
          transfers go live this sentence changes with everywhere else. */}
      <div className="rounded-xl bg-canvas p-4 text-[13px]">
        <strong>Operating status.</strong> {brand.legal.operatingStatus} No card or bank
        account is charged. {brand.legal.licence}
      </div>

      <H>What we collect</H>
      <p><strong>When you create an account:</strong> your name, email address, and optionally a
      phone number, along with the country and language you choose.</p>
      <p><strong>When you add a recipient:</strong> their name, country, how they receive money,
      and where relevant a phone number, bank name, or your relationship to them. You are
      providing another person's details, so please only add people who expect to hear from you.</p>
      <p><strong>When you send:</strong> the amount, currencies, fee, exchange rate, and the
      status of the transfer, kept as a permanent record of the transaction.</p>
      <p><strong>Automatically:</strong> your IP address and browser or device identifier, recorded
      with sign-ins and with actions that change money or access. We keep this to detect fraud
      and to reconstruct what happened if a transfer is disputed.</p>

      <H>What never reaches us</H>
      <p>
        <strong>Your fingerprint or face.</strong> Biometric unlock is handled entirely by your
        phone. iOS and Android tell the app only whether the check passed. The biometric data
        itself never leaves your device and we never receive, store, or see it.
      </p>
      <p>
        <strong>Your password.</strong> We store only a slow one-way hash, combined with a secret
        held separately from the database. We cannot read your password or recover it for you.
      </p>

      <H>Why we keep it</H>
      <p>To operate your account and carry out transfers you ask for; to keep an accurate record
      of money movement; to meet anti-money-laundering and record-keeping obligations that apply
      to money transmission; and to investigate fraud or a disputed transfer.</p>

      <H>Who else sees it</H>
      {/* The categories of recipient, not the suppliers by name. A named
          supplier list on a public page is a map of the infrastructure for
          anyone who wants one, and it goes stale the day a contract changes.
          The disclosure a reader is owed is what kind of party sees their
          data and why, which is preserved in full — and the current list is
          offered on request, which is where a regulator or a partner's
          privacy team would expect to obtain it. */}
      <p>Our own staff, limited to what their role requires, with every action recorded against a
      named person. Beyond that, the infrastructure and hosting providers that operate the platform
      on our behalf under contract, and, once the service handles real money, banking, payout,
      identity-verification, and sanctions-screening partners as required to complete a transfer and
      to comply with the law. Every one of them is bound to use your information only to provide
      their service to us. We do not sell your information, and we do not share it for advertising.
      A current list of the providers we use is available on request at{' '}
      <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>.</p>

      <H>How long we keep it</H>
      <p>Transaction records and the audit trail are retained for at least five years after a
      transfer, which is the standard retention period for money-transmission records. Account
      details are kept while your account is open and for that same period afterwards.</p>

      <H>Your choices</H>
      <p>You can ask for a copy of your data, ask us to correct it, or ask us to close your
      account, by writing to <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>.
      Records we are legally required to retain will be kept even after an account is closed.</p>

      <H>Children</H>
      <p>XpressTend is not intended for anyone under 18 and we do not knowingly collect their
      information.</p>

      <H>Changes</H>
      <p>If this policy changes materially we will say so in the app before the change takes
      effect.</p>

      <H>Contact</H>
      <p>
        {brand.name}, {brand.hq.city}, {brand.hq.state}<br />
        <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>
      </p>
    </Shell>
  )
}

/**
 * Support centre.
 *
 * Built out to cover what a remittance customer actually contacts a provider
 * about, in roughly the order they contact about it: where is my money, why is
 * it taking longer, can I cancel, what will it cost, what do you need from me.
 * Those are the questions every established provider answers, and a support
 * page that omits them reads as a product nobody has operated yet.
 *
 * Two sections exist because a money transmitter is expected to have them
 * rather than because customers enjoy reading them. Complaints names the state
 * regulator and the federal one, with the route to each. Your rights sets out
 * the cancellation window, the receipt and the error-resolution period that
 * federal law gives anyone sending money abroad. A prospective banking or
 * wallet partner looks for both, and their absence is noticed.
 *
 * The test-mode disclosure stays throughout. Nothing here promises a transfer
 * the product does not currently make.
 */
const SUPPORT_SECTIONS = [
  { id: 'contact', label: 'Contact us' },
  { id: 'sending', label: 'Sending money' },
  { id: 'tracking', label: 'Tracking and delays' },
  { id: 'changes', label: 'Cancelling and refunds' },
  { id: 'recipients', label: 'Recipients and payout' },
  { id: 'account', label: 'Your account' },
  { id: 'verification', label: 'Identity verification' },
  { id: 'fraud', label: 'Fraud and scams' },
  { id: 'rights', label: 'Your rights when you send' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'security', label: 'Reporting a security issue' },
]

export function Support() {
  const email = (
    <a className="underline" href={`mailto:${brand.support.email}`}>
      {brand.support.email}
    </a>
  )
  const phone = (
    <a className="underline" href={`tel:${brand.support.phone.replace(/[^+\d]/g, '')}`}>
      {brand.support.phone}
    </a>
  )

  return (
    <Shell
      title="Support"
      description="Answers about sending a transfer, tracking and delays, cancellations, verification, fraud, your rights when you send money abroad, and how to complain."
      updated={UPDATED}
    >
      <p>Questions about a transfer, your account, or the app.</p>

      {/* Stated once, at the top, rather than qualifying thirty answers
          individually. Everything below describes how the service works; this
          is where it currently stands. */}
      <div className="rounded-xl bg-canvas p-4 text-[13px]">
        <strong>Operating status.</strong> {brand.legal.operatingStatus} The answers below
        describe how transfers work and what applies once transfers are live.
      </div>

      <Contents items={SUPPORT_SECTIONS} />

      <H>Contact us</H>
      <p id="contact" className="scroll-mt-24">
        Email {email} — we answer within one business day.
        <br />
        Phone {phone}
        <br />
        Post: {brand.name}, {brand.hq.city}, {brand.hq.state}, {brand.hq.country}
      </p>
      <p>
        Have your transfer reference ready if you are asking about a specific transfer. It
        looks like <span className="font-semibold text-ink-900">{brand.referencePrefix}-0000-0000-0000</span> and
        is on your receipt and in Activity.
      </p>

      <H>Sending money</H>
      <Q q="How do I send a transfer?" id="sending">
        Add a recipient, choose the amount and the payout method, then review the fee, the
        rate and the amount they receive before you confirm. Nothing is charged until you
        confirm with your password.
      </Q>
      <Q q="What does it cost?">
        A fee of 0.99% of the amount you send. It is shown in full before you confirm,
        alongside the total charged and the amount your recipient receives. We add no
        markup to the exchange rate, so that fee is the entire price — there is nothing
        recovered quietly in the rate.
      </Q>
      <Q q="How are exchange rates set?">
        Rates come from live market data and refresh every fifteen minutes. A quote is held
        for sixty minutes; after that it expires and you are re-quoted rather than charged
        at a price that has moved. Transfers to Somalia are paid out in US dollars, so no
        conversion happens and no rate applies.
      </Q>
      <Q q="Is there a minimum or maximum?">
        Yes. The minimum is $10 per transfer. Your maximum depends on how far your identity
        verification has progressed, and the limit that applies to you is shown on the send
        screen. Limits cover a single transfer, a rolling day and a rolling month.
      </Q>
      <Q q="Can I raise my limits?">
        Complete the next verification tier. Email {email} and we will tell you which
        documents are outstanding.
      </Q>
      <Q q="How do I pay?">
        Bank transfer, debit card, or Apple Pay. We do not accept credit cards, cash or
        cryptocurrency.
      </Q>
      <Q q="My payment was declined.">
        Usually the bank declining rather than us: an address mismatch, an international
        block, or insufficient funds. Check with your bank first, then try again. A declined
        payment creates no transfer and charges nothing.
      </Q>

      <H>Tracking and delays</H>
      <Q q="Where is my transfer?" id="tracking">
        Open Activity in the app. Every transfer shows its current status and its reference.
        You can also email {email} with the reference.
      </Q>
      <Q q="What do the statuses mean?">
        <em>Awaiting payment</em> — created, not yet paid for. <em>In review</em> — paid
        and undergoing the compliance checks every transfer receives. <em>Ready for
        payout</em> — cleared and with the payout partner. <em>Completed</em> — collected
        by your recipient. <em>Failed</em> or <em>Cancelled</em> — not delivered, and your
        money returned.
      </Q>
      <Q q="Why is my transfer taking longer than the estimate?">
        The common reasons are a compliance review, a detail that does not match the
        recipient's records, or the payout partner's own banking hours and local holidays.
        Reviews are a legal requirement and we cannot skip one, but we will tell you if we
        need anything from you.
      </Q>
      <Q q="My transfer is in review. What does that mean?">
        Every transfer is screened before release. Most clear without anyone needing to do
        anything. If we need a document or a question answered we will contact you at the
        address on your account, and the transfer waits rather than failing.
      </Q>

      <H>Cancelling and refunds</H>
      {/*
        Deliberately does not claim a self-service cancel button. There is no
        cancel endpoint in the API yet, and the thirty-minute window is a legal
        right rather than something the app currently implements, so the honest
        answer is the route that actually works: contact us. When the endpoint
        exists this becomes "cancel it yourself in Activity".
      */}
      <Q q="Can I cancel a transfer?" id="changes">
        Email {email} or call {phone} with your reference straight away. You have thirty
        minutes from paying to cancel for a full refund, and beyond that we can still stop
        a transfer that has not been paid out. Cancelling from inside the app is not built
        yet, so it goes through us for now.
      </Q>
      <Q q="How long does a refund take?">
        Once a transfer is cancelled the money is returned by the same route it arrived.
        Your bank or card issuer then controls the timing, which is usually three to ten
        business days.
      </Q>
      <Q q="I entered the wrong recipient details.">
        Contact us immediately with your reference. Before payout we can usually correct
        them or cancel. Once money has been collected it cannot be recovered, which is why
        the review screen asks you to check the details.
      </Q>
      <Q q="Do I get a receipt?">
        Yes. One is issued for every transfer, showing the amount, the fee, the rate, the
        amount your recipient receives, and the reference. Receipts stay in Activity so you
        can retrieve them later.
      </Q>

      <H>Recipients and payout</H>
      <Q q="How can my recipient be paid?" id="recipients">
        Mobile money, bank transfer, or cash pickup, depending on the country. The options
        available for a destination are shown when you choose it.
      </Q>
      <Q q="What does my recipient need?">
        For mobile money, the phone number registered to their wallet. For a bank transfer,
        their account details. For cash pickup, government-issued photo identification in
        the same name as the transfer, and the reference.
      </Q>
      <Q q="Does my recipient need the app?">
        No. They do not need an account, the app, or a smartphone.
      </Q>
      <Q q="My recipient says the money has not arrived.">
        Check the status in Activity first. If it shows <em>Sent</em> and they have not
        received it, email {email} with the reference and we will trace it with the payout
        partner.
      </Q>

      <H>Your account</H>
      <Q q="How do I create an account?" id="account">
        Register with your email address and a password. You will need to verify your
        identity before your first transfer.
      </Q>
      {/* Self-service reset exists, so the old answer telling people to email
          us was sending them the long way round. */}
      <Q q="I forgot my password.">
        Use the Forgot password link on the sign in screen and we will email you a link to
        choose a new one. Passwords are stored hashed and cannot be looked up or sent to
        you, so a reset is the only way to regain access. If you are staff and the email
        does not arrive, an owner can issue you a reset link directly.
      </Q>
      <Q q="I forgot which email I registered with.">
        Enter an address you may have used on the Forgot your email link. If it has an
        account we will confirm it by email. For your protection we cannot tell you an
        address you do not already have.
      </Q>
      <Q q="How do I change my name, address or phone number?">
        Email {email}. A name change needs a document showing the new name, because the name
        on your account has to match your identification.
      </Q>
      <Q q="The app asks for Face ID.">
        It is used to unlock the app and to confirm a transfer. Your biometric data stays on
        your phone and is never sent to us.
      </Q>
      <Q q="How do I close my account?">
        Email us and we will close it. Records we are required by law to retain will be
        kept for as long as the law requires.
      </Q>

      <H>Identity verification</H>
      <Q q="Why do you need my identification?" id="verification">
        Federal law requires a money transmitter to verify who its customers are and to
        keep records of transfers. We collect the minimum that allows us to do that.
      </Q>
      <Q q="What documents do you accept?">
        A government-issued photo ID — passport, driver's licence or state ID — and, for
        higher limits, proof of address dated within the last three months. Larger transfers
        may also require evidence of where the funds came from.
      </Q>
      <Q q="How long does verification take?">
        Usually minutes. If a document is unclear or the details do not match we will ask
        for another, which adds a day or so.
      </Q>
      <Q q="My verification was declined.">
        Email {email} and we will tell you what did not match. It is most often a blurred
        photograph, an expired document, or a name spelled differently from your account.
      </Q>

      <H>Fraud and scams</H>
      <Q q="How do I know a message is really from you?" id="fraud">
        We will never ask for your password, a verification code, or your full card number —
        not by email, phone, or text. We will never ask you to send a transfer to resolve a
        problem with your account. If a message does either, it is not from us.
      </Q>
      <Q q="Someone has asked me to send them money. Should I?">
        Only send money to people you know personally. Treat any of these as a scam: a
        romantic interest you have never met, an unexpected prize or inheritance, a job that
        asks you to pay upfront, a caller claiming to be from a government agency or your
        bank, an investment promising guaranteed returns, or anyone insisting you act
        immediately and keep it to yourself.
      </Q>
      <Q q="Can I get my money back if I was scammed?">
        Once a transfer has been collected it cannot be reversed, which is what makes these
        scams attractive to the people running them. Tell us immediately: if it has not yet
        been paid out we will try to stop it.
      </Q>
      <Q q="How do I report fraud?">
        Email {email} with "Fraud" in the subject line, or call {phone}. Report it whether
        or not you went ahead, because it helps us protect other people.
      </Q>

      <H>Your rights when you send</H>
      <p id="rights" className="scroll-mt-24">
        Federal law gives you specific rights when you send money abroad, and they apply
        whatever our own policies say.
      </p>
      <Q q="Disclosures before you pay.">
        Before you confirm, you are entitled to see the exchange rate, every fee, and the
        exact amount your recipient will receive. We show all three on the review screen.
      </Q>
      <Q q="A thirty-minute right to cancel.">
        You may cancel for a full refund within thirty minutes of paying, as long as the
        money has not been collected. Contact us and we will action it; there is no charge
        for cancelling inside that window.
      </Q>
      <Q q="One hundred and eighty days to report an error.">
        If something goes wrong you have 180 days from the promised delivery date to tell
        us. We will investigate and report back within 90 days, and where we are at fault
        we will refund the transfer and the fee.
      </Q>

      <H>Complaints</H>
      <p id="complaints" className="scroll-mt-24">
        If something has gone wrong we would rather hear it from you than not.
      </p>
      <Q q="How do I complain?">
        Email {email} with "Complaint" in the subject line, or write to us at the postal
        address above. Include your transfer reference and what you would like us to do. We
        acknowledge complaints within one business day and aim to resolve them within
        fifteen business days, writing to you if it will take longer.
      </Q>
      <Q q="What if I am not satisfied with your answer?">
        You can escalate to our regulators. In Washington State, the Department of Financial
        Institutions, Division of Consumer Services, at{' '}
        <a className="underline" href="https://dfi.wa.gov/consumers/complaint" target="_blank" rel="noopener noreferrer">
          dfi.wa.gov
        </a>
        . Federally, the Consumer Financial Protection Bureau accepts complaints about
        international money transfers at{' '}
        <a className="underline" href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener noreferrer">
          consumerfinance.gov/complaint
        </a>
        . You do not need our permission and you do not have to come to us first.
      </Q>
      <Q q="How can I check you are who you say you are?">
        {brand.name} is registered in the Nationwide Multistate Licensing System under NMLS
        ID {brand.nmls.id}. You can look us up, and see our current licence status, at{' '}
        <a className="underline" href={brand.nmls.verifyUrl} target="_blank" rel="noopener noreferrer">
          NMLS Consumer Access
        </a>
        .
      </Q>

      <H>Reporting a security issue</H>
      <p id="security" className="scroll-mt-24">
        Email {email} with "Security" in the subject line. Please give us a reasonable
        chance to fix an issue before disclosing it publicly.
      </p>
    </Shell>
  )
}
