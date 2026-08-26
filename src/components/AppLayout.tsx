import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { BottomNav } from './BottomNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { StatusBar } from './ui'

const NAV_ROUTES = ['/app', '/recipients', '/activity', '/profile']
const DARK_ROUTES = ['/success']

const SCREEN_LINKS: { to: string; label: string }[] = [
  { to: '/app', label: 'Home' },
  { to: '/voice', label: 'Voice Assistant' },
  { to: '/assistant', label: 'AI Assistant chat' },
  { to: '/send', label: 'Send Money' },
  { to: '/review', label: 'Review & Confirm' },
  { to: '/success', label: 'Transfer complete' },
  { to: '/recipients', label: 'Recipients' },
  { to: '/activity', label: 'Activity' },
  { to: '/profile', label: 'Profile' },
  { to: '/rates', label: 'Live rates' },
  { to: '/help', label: 'Help Center' },
]

function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
        <svg width="16" height="16" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M10 34h9l4-11 6 21 6-25 5 15h14"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={`text-[17px] font-extrabold tracking-tight ${
          tone === 'dark' ? 'text-white' : 'text-ink-900'
        }`}
      >
        {brand.name}
      </span>
    </span>
  )
}

export { Logo }

function Sidebar() {
  const t = useT()
  return (
    <aside className="hidden w-72 shrink-0 flex-col justify-between py-10 lg:flex xl:w-80">
      <div>
        <Logo tone="dark" />
        <p className="mt-6 text-[28px] leading-[1.15] font-extrabold text-white">
          {brand.tagline}
        </p>
        <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/70">{t('shell.hint')}</p>

        <nav className="mt-8 space-y-0.5">
          <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-white/40 uppercase">
            {t('shell.screens')}
          </p>
          {SCREEN_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-10 space-y-4">
        <LanguageSwitcher tone="dark" drop="up" />
        <p className="text-[12px] leading-relaxed text-white/50">
          {t('shell.hq')}
          <br />
          {brand.legal.licence}
        </p>
      </div>
    </aside>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const showNav = NAV_ROUTES.includes(pathname)
  const tone: 'light' | 'dark' = DARK_ROUTES.includes(pathname) ? 'dark' : 'light'

  return (
    <div className="min-h-[100dvh] bg-canvas lg:bg-[radial-gradient(120%_120%_at_15%_0%,#3a1795_0%,#1a0740_55%,#12042e_100%)]">
      <div className="mx-auto flex min-h-[100dvh] max-w-6xl items-center gap-12 px-0 lg:px-8">
        <Sidebar />

        <main className="flex flex-1 justify-center">
          <div
            className={`relative flex h-[100dvh] w-full flex-col overflow-hidden lg:h-[min(844px,calc(100dvh-64px))] lg:w-[390px] lg:rounded-[44px] lg:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.65)] lg:ring-8 lg:ring-black/80 ${
              tone === 'dark' ? 'bg-brand-950' : 'bg-canvas'
            }`}
          >
            <StatusBar tone={tone} />
            <Outlet />
            {showNav && <BottomNav />}
          </div>
        </main>
      </div>
    </div>
  )
}
