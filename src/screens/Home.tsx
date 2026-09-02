import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  Bell,
  ChevronRight,
  Headphones,
  Landmark,
  Menu,
  MessageCircleMore,
  Mic,
  ShieldCheck,
  Signal,
  Smartphone,
  TrendingUp,
} from 'lucide-react'
import { Logo } from '../components/AppLayout'
import { Avatar, IconTile, SectionTitle, Waveform } from '../components/ui'
import { useMirrorClass, useT } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { getRecipient, user } from '../data/mock'
import { useAuth } from '../auth/AuthContext'
import { formatDate, rate, usd } from '../lib/format'
import type { TranslationKey } from '../i18n/en'
import type { DeliveryMethod } from '../state/TransferContext'

const services: {
  key: TranslationKey
  icon: typeof Smartphone
  hue: number
  method: DeliveryMethod
}[] = [
  { key: 'service.mobileMoney', icon: Smartphone, hue: 262, method: 'mobile' },
  { key: 'service.bankTransfer', icon: Landmark, hue: 152, method: 'bank' },
  { key: 'service.cashPickup', icon: Banknote, hue: 28, method: 'cash' },
  { key: 'service.airtime', icon: Signal, hue: 205, method: 'airtime' },
]

const quickActions: {
  titleKey: TranslationKey
  subKey: TranslationKey
  icon: typeof Smartphone
  hue: number
  to: string
}[] = [
  { titleKey: 'quick.help', subKey: 'quick.helpSub', icon: MessageCircleMore, hue: 262, to: '/help' },
  { titleKey: 'quick.rates', subKey: 'quick.ratesSub', icon: TrendingUp, hue: 152, to: '/rates' },
  { titleKey: 'quick.refer', subKey: 'quick.referSub', icon: ShieldCheck, hue: 250, to: '/refer' },
  { titleKey: 'quick.support', subKey: 'quick.supportSub', icon: Headphones, hue: 205, to: '/support' },
]

export function Home() {
  const { user: account } = useAuth()
  const t = useT()
  const mirror = useMirrorClass()
  const navigate = useNavigate()
  const { history, corridor, setDeliveryMethod, setRecipientId } = useTransfer()
  const latest = history[0]
  const latestRecipient = latest ? getRecipient(latest.recipientId) : null
  const favourites = ['r1', 'r2', 'r3'].map(getRecipient)

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label={t('nav.profile')}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition hover:bg-black/5"
        >
          <Menu size={22} strokeWidth={2.2} />
        </button>
        <Logo />
        <button
          type="button"
          onClick={() => navigate('/activity')}
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-full text-ink-700 transition hover:bg-black/5"
        >
          <Bell size={21} strokeWidth={2.1} />
          <span className="absolute top-1 end-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-rose-500 px-[3px] text-[9px] font-bold text-white">
            2
          </span>
        </button>
      </div>

      <div className="px-4 pb-8">
        {/* Greeting */}
        <div className="mt-2 mb-4">
          <h1 className="text-[22px] leading-tight font-extrabold text-ink-900">
            {t('home.greeting', { name: account?.firstName ?? user.firstName })} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">{t('home.subtitle')}</p>
        </div>

        {/* Voice hero */}
        <button
          type="button"
          onClick={() => navigate('/voice')}
          className="relative w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-5 pt-5 pb-6 text-center shadow-[var(--shadow-float)] transition active:scale-[0.99]"
        >
          <span
            className="pointer-events-none absolute -top-16 -end-10 h-40 w-40 rounded-full bg-white/10"
            aria-hidden="true"
          />
          <span className="block text-[16px] font-bold text-white">{t('home.voiceTitle')}</span>
          <span className="mt-1 block text-[12px] text-white/75">{t('home.voiceSubtitle')}</span>
          <span className="mt-4 mb-4 block">
            <Waveform color="rgba(255,255,255,0.5)" height={30} />
          </span>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white shadow-lg">
            <Mic size={26} className="text-brand-600" strokeWidth={2.3} />
          </span>
        </button>

        {/* Send money */}
        <section className="card mt-4 p-4">
          <button
            type="button"
            onClick={() => navigate('/send')}
            className="mb-4 flex w-full items-center justify-between text-start"
          >
            <span>
              <span className="block text-[15px] font-bold text-ink-900">{t('home.sendMoney')}</span>
              <span className="block text-[12px] text-ink-500">{t('home.sendMoneySub')}</span>
            </span>
            <ChevronRight size={18} className={`text-ink-400 ${mirror}`} />
          </button>

          <div className="grid grid-cols-4 gap-2">
            {services.map(({ key, icon: Icon, hue, method }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDeliveryMethod(method)
                  navigate('/send')
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl py-1 transition active:scale-95"
              >
                <IconTile hue={hue}>
                  <Icon size={22} strokeWidth={2} />
                </IconTile>
                <span className="text-center text-[10.5px] leading-tight font-semibold text-ink-700">
                  {t(key)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent transaction */}
        <section className="card mt-4 p-4">
          <SectionTitle
            title={t('home.recentTransaction')}
            action={t('common.viewAll')}
            onAction={() => navigate('/activity')}
          />
          {latest && latestRecipient ? (
            <button
              type="button"
              onClick={() => navigate('/activity')}
              className="flex w-full items-center gap-3 text-start"
            >
              <Avatar name={latestRecipient.name} hue={latestRecipient.hue} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-ink-900">
                  {latestRecipient.name}
                </span>
                <span className="block text-[12px] text-ink-500">{formatDate(latest.date)}</span>
              </span>
              <span className="text-end">
                <span className="block text-[14px] font-extrabold text-ink-900">
                  <bdi>{usd(latest.amountUsd)}</bdi>
                </span>
                <span className="block text-[12px] font-semibold text-emerald-600">
                  {t(latest.status === 'completed' ? 'common.completed' : 'common.pending')}
                </span>
              </span>
            </button>
          ) : (
            <p className="text-[13px] text-ink-500">{t('home.noTransactions')}</p>
          )}
        </section>

        {/* Recipients */}
        <section className="card mt-4 p-4">
          <SectionTitle
            title={t('home.recipients')}
            action={t('common.viewAll')}
            onAction={() => navigate('/recipients')}
          />
          <ul className="space-y-1">
            {favourites.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientId(r.id)
                    navigate('/send')
                  }}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-1.5 text-start transition hover:bg-brand-50/70"
                >
                  <Avatar name={r.name} hue={r.hue} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-ink-900">{r.name}</span>
                    <span className="block text-[12px] text-ink-500">
                      <bdi>{r.phone}</bdi>
                    </span>
                  </span>
                  <ChevronRight size={17} className={`text-ink-400 ${mirror}`} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Quick actions */}
        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold text-ink-900">{t('home.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ titleKey, subKey, icon: Icon, hue, to }) => (
              <button
                key={titleKey}
                type="button"
                onClick={() => navigate(to)}
                className="card flex flex-col items-center gap-2 p-4 text-center transition active:scale-[0.98]"
              >
                <IconTile hue={hue} size={46}>
                  <Icon size={21} strokeWidth={2} />
                </IconTile>
                <span className="text-[13px] font-bold text-ink-900">{t(titleKey)}</span>
                <span className="text-[11px] leading-snug text-ink-500">{t(subKey)}</span>
              </button>
            ))}
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-400">
          <bdi>
            1 USD = {rate(corridor.rate)} {corridor.currency}
          </bdi>
        </p>
      </div>
    </div>
  )
}
