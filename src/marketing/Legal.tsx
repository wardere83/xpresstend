import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { Logo } from '../components/Logo'

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

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <header className="border-b border-ink-200/70">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <Link to="/" aria-label={brand.name}><Logo height={28} /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-[13px] text-ink-400">Last updated {UPDATED}</p>
        <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-ink-700">{children}</div>
      </main>
      <footer className="border-t border-ink-200/70">
        <div className="mx-auto max-w-3xl px-5 py-8 text-[12px] leading-relaxed text-ink-400">
          <p className="font-semibold text-ink-700">{brand.name}</p>
          <p className="mt-1">{brand.hq.line1}, {brand.hq.city}, {brand.hq.state} {brand.hq.zip}</p>
          <p className="mt-2">
            <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>
          </p>
          <p className="mt-3">{brand.legal.licence}</p>
        </div>
      </footer>
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-[17px] font-bold text-ink-900">{children}</h2>
}

export function Privacy() {
  return (
    <Shell title="Privacy Policy">
      <p>
        This policy explains what XpressTend collects, why, and what we do with it. It
        describes the service as it actually works today.
      </p>

      <div className="rounded-2xl bg-canvas p-4 text-[13px]">
        <strong>XpressTend is currently in private beta.</strong> Payments run in test mode.
        No customer funds are transmitted, and no card or bank account is charged.
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
      <p>Our own staff, limited to what their role requires, with every action recorded against a
      named person. Beyond that, service providers who host the platform (Cloudflare) and, once
      the service handles real money, banking, payout, identity-verification, and sanctions-screening
      partners as required to complete a transfer and to comply with the law. We do not sell your
      information, and we do not share it for advertising.</p>

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
        {brand.name}, {brand.hq.line1}, {brand.hq.city}, {brand.hq.state} {brand.hq.zip}<br />
        <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a>
      </p>
    </Shell>
  )
}

export function Support() {
  return (
    <Shell title="Support">
      <p>Questions about a transfer, your account, or the app.</p>

      <H>Email</H>
      <p>
        <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a><br />
        We answer within one business day.
      </p>

      <H>Post</H>
      <p>{brand.name}<br />{brand.hq.line1}<br />{brand.hq.city}, {brand.hq.state} {brand.hq.zip}<br />
      {brand.hq.country}</p>

      <H>Common questions</H>
      <p><strong>Why can I not send money yet?</strong> New accounts start unverified. You need to
      pass identity verification before a transfer can be sent, and XpressTend is in private beta
      with payments in test mode, so no funds move at present.</p>
      <p><strong>I forgot my password.</strong> Email us and we will help you regain access. Self
      service password reset is not yet available.</p>
      <p><strong>How do I remove my account?</strong> Email us and we will close it. Records we are
      required by law to retain will be kept.</p>
      <p><strong>The app asks for Face ID.</strong> It is used to unlock the app and to confirm a
      transfer. Your biometric data stays on your phone and is never sent to us.</p>

      <H>Reporting a security issue</H>
      <p>Email <a className="underline" href={`mailto:${brand.support.email}`}>{brand.support.email}</a> with
      "Security" in the subject line. Please give us a reasonable chance to fix an issue before
      disclosing it publicly.</p>
    </Shell>
  )
}
