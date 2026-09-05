import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Mic, Receipt, User, Users } from 'lucide-react'
import { useT } from '../i18n'

const items = [
  { to: '/app', icon: Home, key: 'nav.home' as const, end: true },
  { to: '/recipients', icon: Users, key: 'nav.recipients' as const, end: false },
  { to: '/activity', icon: Receipt, key: 'nav.activity' as const, end: false },
  { to: '/profile', icon: User, key: 'nav.profile' as const, end: false },
]

export function BottomNav() {
  const t = useT()
  const navigate = useNavigate()

  const left = items.slice(0, 2)
  const right = items.slice(2)

  const renderItem = ({ to, icon: Icon, key, end }: (typeof items)[number]) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition ${
          isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
          <span>{t(key)}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <nav className="relative shrink-0 border-t border-ink-200/70 bg-white pb-[max(env(safe-area-inset-bottom),6px)]">
      <div className="flex items-end px-2">
        {left.map(renderItem)}

        <div className="flex w-16 justify-center">
          <button
            type="button"
            onClick={() => navigate('/voice')}
            aria-label={t('nav.speak')}
            className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-float)] ring-4 ring-white transition active:scale-95"
          >
            <Mic size={23} strokeWidth={2.3} />
          </button>
        </div>

        {right.map(renderItem)}
      </div>
    </nav>
  )
}
