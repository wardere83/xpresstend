import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Bell,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  ScrollText,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Avatar, ListRow, ScreenHeader } from '../components/ui'
import { brand } from '../config/brand'
import { useI18n } from '../i18n'
import { user } from '../data/mock'
import { useAuth } from '../auth/AuthContext'
import type { TranslationKey } from '../i18n/en'

const rows: { key: TranslationKey; icon: typeof UserRound; to?: string }[] = [
  { key: 'profile.personal', icon: UserRound },
  { key: 'profile.security', icon: ShieldCheck },
  { key: 'profile.payment', icon: CreditCard, to: '/send' },
  { key: 'profile.notifications', icon: Bell },
  { key: 'profile.help', icon: HelpCircle, to: '/help' },
  { key: 'profile.legal', icon: ScrollText },
]

export function Profile() {
  const { user: account, signOut } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('profile.title')} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <section className="card flex items-center gap-3.5 p-4">
          <Avatar name={account ? `${account.firstName} ${account.lastName}` : user.fullName} hue={user.hue} size={56} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-ink-900">{account ? `${account.firstName} ${account.lastName}` : user.fullName}</p>
            <p className="truncate text-[12px] text-ink-500">
              <bdi>{account?.email ?? user.phone}</bdi>
            </p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
              <BadgeCheck size={12} />
              {t('profile.verified')}
            </p>
          </div>
        </section>

        <p className="mt-2 px-1 text-[11.5px] text-ink-500">
          {t('profile.member', { year: user.memberSince })}
        </p>

        {/* Language */}
        <section className="card mt-4 flex items-center justify-between gap-3 px-4 py-3.5">
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Globe size={18} />
            </span>
            <span className="text-[14px] font-semibold text-ink-900">{t('profile.language')}</span>
          </span>
          <LanguageSwitcher />
        </section>

        <section className="card mt-4 divide-y divide-ink-200/60 overflow-hidden">
          {rows.map(({ key, icon: Icon, to }) => (
            <ListRow
              key={key}
              onClick={() => to && navigate(to)}
              icon={
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-canvas text-ink-500">
                  <Icon size={17} />
                </span>
              }
              title={t(key)}
            />
          ))}
        </section>

        <button
          type="button"
          onClick={async () => {
            if (account) await signOut()
            navigate('/')
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-[14px] font-bold text-rose-600 shadow-[var(--shadow-card)] transition hover:bg-rose-50"
        >
          <LogOut size={16} />
          {t('profile.signOut')}
        </button>

        <footer className="mt-6 space-y-1 text-center text-[11px] leading-relaxed text-ink-500">
          <p className="font-semibold text-ink-500">{brand.name}</p>
          <p>
            <bdi>
              {brand.hq.city}, {brand.hq.state}
            </bdi>
          </p>
          <p>{brand.legal.licence}</p>
          <p>
            <bdi>{brand.support.email}</bdi> · <bdi>{brand.support.phone}</bdi>
          </p>
        </footer>
      </div>
    </div>
  )
}
