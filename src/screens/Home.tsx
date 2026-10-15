import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Headphones, MessageCircleMore, User } from 'lucide-react'
import { Logo } from '../components/AppLayout'
import { Avatar, SectionTitle } from '../components/ui'
import { useMirrorClass, useT } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { useAccountData } from '../state/AccountData'
import { hueFor } from '../lib/view'
import { useAuth } from '../auth/AuthContext'
import { useFormats } from '../lib/format'
export function Home() {
  const { formatDate, usd } = useFormats()
  const p = useInterfaceCopy()
  const { user: account } = useAuth()
  const { recipients, transfers, loading, error } = useAccountData()
  const { setRecipientId } = useTransfer()
  const t = useT()
  const mirror = useMirrorClass()
  const navigate = useNavigate()
  const latest = transfers[0]
  const favourites = recipients.slice(0, 3).map((recipient) => ({
    id: recipient.id,
    name: recipient.full_name,
    detail: recipient.phone ?? recipient.bank_name ?? recipient.country,
    hue: hueFor(recipient.full_name),
  }))
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="product-home-top">
        <Logo />
        <button type="button" onClick={() => navigate('/profile')} aria-label={t('nav.profile')}>
          <User size={18} strokeWidth={1.6} />
        </button>
      </div>
      <div className="product-home-content">
        {error && (
          <p role="alert" className="mb-3 text-sm text-alert">
            {p(error)}
          </p>
        )}
        <div className="product-home-greeting">
          <h1>
            {t('home.greeting', { name: account?.firstName ?? '' })} <span aria-hidden="true">👋</span>
          </h1>
          <p>{t('home.subtitle')}</p>
        </div>
        <section className="product-send-card">
          <button type="button" onClick={() => navigate('/send')}>
            <span>
              <strong>{t('home.sendMoney')}</strong>
              <small>{t('home.sendMoneySub')}</small>
            </span>
            <span className="product-send-arrow">
              <ArrowUpRight size={21} />
            </span>
          </button>
          <p className="px-4 pb-4 text-[12px] text-ink-500">
            {p('Test transfers only. Bank, wallet, cash pickup, and airtime delivery are unavailable.')}
          </p>
        </section>

        <section className="product-home-section card p-4">
          <SectionTitle
            title={t('home.recentTransaction')}
            action={t('common.viewAll')}
            onAction={() => navigate('/activity')}
          />
          {latest ? (
            <button
              type="button"
              onClick={() => navigate('/activity')}
              className="flex w-full items-center gap-3 text-start"
            >
              <Avatar name={latest.recipient_name} hue={hueFor(latest.recipient_name)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-ink-900">
                  {latest.recipient_name}
                </span>
                <span className="block text-[12px] text-ink-500">{formatDate(latest.created_at)}</span>
              </span>
              <span className="text-end">
                <span className="block text-[14px] font-semibold text-ink-900">
                  <bdi>{usd(latest.send_amount_minor / 100)}</bdi>
                </span>
                <span className="flex items-center justify-end gap-1.5 text-[12px] font-semibold text-ink-500">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${latest.status === 'completed' ? 'bg-ok' : 'bg-wait'}`}
                    aria-hidden="true"
                  />
                  {p(latest.status.replaceAll('_', ' '))}
                </span>
              </span>
            </button>
          ) : (
            <p className="text-[13px] text-ink-500">
              {loading ? p('Loading your account\u2026') : t('home.noTransactions')}
            </p>
          )}
        </section>

        <section className="product-home-section card p-4">
          <SectionTitle
            title={t('home.recipients')}
            action={t('common.viewAll')}
            onAction={() => navigate('/recipients')}
          />
          {favourites.length === 0 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-ink-500">
                {loading ? 'Loading your recipients…' : t('recipients.empty')}
              </p>
              <button
                className="text-sm font-semibold text-brand-600"
                onClick={() => navigate('/recipients')}
              >
                {t('recipients.add')}
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {favourites.map((recipient) => (
                <li key={recipient.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientId(recipient.id)
                      navigate('/send')
                    }}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-1.5 text-start transition hover:bg-brand-50/70"
                  >
                    <Avatar name={recipient.name} hue={recipient.hue} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-ink-900">
                        {recipient.name}
                      </span>
                      <span className="block text-[12px] text-ink-500">
                        <bdi>{recipient.detail}</bdi>
                      </span>
                    </span>
                    <ChevronRight size={17} className={`text-ink-500 ${mirror}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="product-home-tools" aria-label={t('home.quickActions')}>
          <button type="button" onClick={() => navigate('/help')}>
            <MessageCircleMore size={17} strokeWidth={1.6} />
            <span>{t('quick.help')}</span>
          </button>
          <button type="button" onClick={() => navigate('/support')}>
            <Headphones size={17} strokeWidth={1.6} />
            <span>{t('quick.support')}</span>
          </button>
        </section>
      </div>
    </div>
  )
}
