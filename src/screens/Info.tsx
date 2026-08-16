import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Copy,
  Gift,
  Headphones,
  Mail,
  MessageCircleMore,
  Phone,
  TrendingUp,
} from 'lucide-react'
import { PrimaryButton, ScreenHeader, SecondaryButton, Toast } from '../components/ui'
import { brand } from '../config/brand'
import { useI18n } from '../i18n'
import { corridors, TRANSFER_FEE, user } from '../data/mock'
import { rate as fmtRate, usd } from '../lib/format'
import type { TranslationKey } from '../i18n/en'

/* ------------------------------------------------------------------ */
/* Live rates                                                          */
/* ------------------------------------------------------------------ */

export function Rates() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('rates.title')} onBack={() => navigate(-1)} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <div className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3">
          <TrendingUp size={16} className="text-brand-600" />
          <p className="text-[12px] font-semibold text-brand-700">{t('rates.subtitle')}</p>
        </div>

        <ul className="card mt-4 divide-y divide-ink-200/60 overflow-hidden">
          {corridors.map((c) => (
            <li key={c.code} className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-[22px]" aria-hidden="true">
                {c.flag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-ink-900">
                  {lang === 'so' ? c.countrySo : c.country}
                </span>
                <span className="block text-[11.5px] text-ink-500">
                  {t('rates.feeFrom', { fee: usd(TRANSFER_FEE) })}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-[14px] font-extrabold text-ink-900">
                  {fmtRate(c.rate)}
                </span>
                <span className="block text-[11px] text-ink-400">
                  {c.currency} {t('rates.perUsd')}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <PrimaryButton onClick={() => navigate('/send')}>{t('home.sendMoney')}</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Help centre                                                         */
/* ------------------------------------------------------------------ */

const faqs: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'help.q1', a: 'help.a1' },
  { q: 'help.q2', a: 'help.a2' },
  { q: 'help.q3', a: 'help.a3' },
  { q: 'help.q4', a: 'help.a4' },
  { q: 'help.q5', a: 'help.a5' },
]

export function Help() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('help.title')} onBack={() => navigate(-1)} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <p className="text-[13px] text-ink-500">{t('help.subtitle')}</p>

        <ul className="card mt-4 divide-y divide-ink-200/60 overflow-hidden">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-900">{t(f.q)}</span>
                  <ChevronDown
                    size={17}
                    className={`shrink-0 text-ink-400 transition ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="animate-fade-up px-4 pb-4 text-[12.5px] leading-relaxed text-ink-500">
                    {t(f.a, { fee: usd(TRANSFER_FEE) })}
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-5 space-y-3">
          <PrimaryButton onClick={() => navigate('/assistant')}>{t('quick.help')}</PrimaryButton>
          <SecondaryButton onClick={() => navigate('/support')}>{t('help.contact')}</SecondaryButton>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Refer & earn                                                        */
/* ------------------------------------------------------------------ */

export function Refer() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(user.referralCode)
      setToast(t('success.copied'))
    } catch {
      setToast(user.referralCode)
    }
    window.setTimeout(() => setToast(null), 1600)
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('refer.title')} onBack={() => navigate(-1)} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <section className="rounded-[22px] bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-center text-white shadow-[var(--shadow-float)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
            <Gift size={26} />
          </span>
          <p className="mt-4 text-[14px] leading-relaxed text-white/85">{t('refer.subtitle')}</p>
          <p className="mt-5 text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase">
            {t('refer.yourCode')}
          </p>
          <p className="mt-1 text-[24px] font-extrabold tracking-wide">{user.referralCode}</p>
        </section>

        <div className="card mt-4 flex items-center justify-between px-4 py-3.5">
          <span className="text-[13px] text-ink-500">{t('refer.earned')}</span>
          <span className="text-[16px] font-extrabold text-emerald-600">
            {usd(user.referralEarned)}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <PrimaryButton onClick={copy}>
            <span className="flex items-center justify-center gap-2">
              <Copy size={16} />
              {t('refer.copy')}
            </span>
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/recipients')}>{t('refer.invite')}</SecondaryButton>
        </div>
      </div>
      {toast && <Toast message={toast} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Live support                                                        */
/* ------------------------------------------------------------------ */

export function Support() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('support.title')} onBack={() => navigate(-1)} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3.5">
          <Headphones size={18} className="text-brand-600" />
          <p className="text-[12.5px] font-semibold text-brand-700">{t('support.subtitle')}</p>
        </div>

        <div className="card mt-4 divide-y divide-ink-200/60 overflow-hidden">
          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-brand-50/70"
          >
            <MessageCircleMore size={19} className="text-brand-600" />
            <span className="text-[14px] font-semibold text-ink-900">{t('support.chat')}</span>
          </button>
          <a
            href={`tel:${brand.support.phone.replace(/[^\d+]/g, '')}`}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-brand-50/70"
          >
            <Phone size={19} className="text-brand-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink-900">{t('support.call')}</span>
              <span className="block text-[12px] text-ink-500">{brand.support.phone}</span>
            </span>
          </a>
          <a
            href={`mailto:${brand.support.email}`}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-brand-50/70"
          >
            <Mail size={19} className="text-brand-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink-900">
                {t('support.email')}
              </span>
              <span className="block text-[12px] text-ink-500">{brand.support.email}</span>
            </span>
          </a>
        </div>

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-ink-400">
          {brand.name} · {brand.hq.line1}
          <br />
          {brand.hq.city}, {brand.hq.state} {brand.hq.zip}, {brand.hq.country}
          <br />
          {brand.legal.licence}
        </p>
      </div>
    </div>
  )
}
