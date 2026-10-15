import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { brand } from '../config/brand'
import { useT, type TranslationKey } from '../i18n'
import { BottomNav } from './BottomNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo as BrandLogo } from './Logo'
import { StatusBar } from './ui'
import { isNative } from '../native/capabilities'

const NAV_ROUTES = ['/app', '/recipients', '/activity', '/profile']
const DARK_ROUTES = ['/success']

const SCREEN_LINKS: { to: string; labelKey: TranslationKey }[] = [
  { to: '/app', labelKey: 'nav.home' },
  { to: '/assistant', labelKey: 'chat.title' },
  { to: '/send', labelKey: 'send.title' },
  { to: '/review', labelKey: 'review.title' },
  { to: '/success', labelKey: 'success.title' },
  { to: '/recipients', labelKey: 'recipients.title' },
  { to: '/activity', labelKey: 'activity.title' },
  { to: '/profile', labelKey: 'profile.title' },
  { to: '/rates', labelKey: 'rates.title' },
  { to: '/help', labelKey: 'help.title' },
]

function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  // 28px matches the height of the mark this replaced, so the app chrome keeps
  // its existing rhythm. The dark variant is used on the navy sidebar.
  return <BrandLogo tone={tone} height={28} />
}

export { Logo }

function Sidebar() {
  const t = useT()
  return (
    <aside className="hidden w-72 shrink-0 flex-col justify-between py-10 lg:flex xl:w-80">
      <div>
        <Logo tone="dark" />
        <p className="mt-6 text-[28px] leading-[1.15] font-semibold text-white">
          {t('marketing.heroTitle')}
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
              {t(link.labelKey)}
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

  /*
   * On the web at desktop widths the product is presented inside a phone
   * mockup beside a navy sidebar. In the native apps there is real hardware
   * around the screen, so the mockup would be a phone drawn inside a phone
   * (or, on an iPad, a small fake handset floating on a navy page). Native
   * therefore always gets the full-bleed layout, whatever the width.
   */
  const mockup = !isNative

  return (
    <div
      className={`min-h-[100dvh] bg-canvas ${
        mockup ? 'lg:bg-[radial-gradient(120%_120%_at_15%_0%,#18313B_0%,#0B252F_70%,#0B252F_100%)]' : ''
      }`}
    >
      <div
        className={`mx-auto flex min-h-[100dvh] items-center gap-12 px-0 ${mockup ? 'max-w-6xl lg:px-8' : ''}`}
      >
        {mockup ? <Sidebar /> : null}

        <main className="flex flex-1 justify-center">
          <div
            /*
             * The top inset is what keeps content out from under the notch.
             * viewport-fit=cover is set so the web view fills the screen, which
             * means the app has to inset itself; the bottom was handled and the
             * top was not, so on a real handset the first row of every screen
             * sat under the Dynamic Island. Zeroed at lg, where the shell is a
             * mockup on a desktop page and there is no hardware to avoid.
             */
            className={`relative flex h-[100dvh] w-full flex-col overflow-hidden pt-[env(safe-area-inset-top)] ${
              mockup
                ? 'lg:h-[min(844px,calc(100dvh-64px))] lg:w-[390px] lg:rounded-[44px] lg:pt-0 lg:shadow-[0_40px_90px_-30px_rgba(11,37,47,0.65)] lg:ring-8 lg:ring-brand-600/80'
                : ''
            } ${tone === 'dark' ? 'bg-brand-950' : 'bg-canvas'}`}
          >
            {/*
              A drawn status bar reading 9:41 with painted signal and battery
              glyphs. It belongs to the desktop phone mockup and nowhere else:
              on an actual device it renders directly beneath the real one, so
              the app shipped showing two status bars and the wrong time. Hidden
              below lg, and never rendered in the native shell at all.
            */}
            {isNative ? null : (
              <div className="hidden lg:block">
                <StatusBar tone={tone} />
              </div>
            )}
            <Outlet />
            {showNav && <BottomNav />}
          </div>
        </main>
      </div>
    </div>
  )
}
