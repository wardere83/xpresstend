import { type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Status bar                                                          */
/* ------------------------------------------------------------------ */

export function StatusBar({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const color = tone === 'dark' ? 'text-white' : 'text-ink-900'
  return (
    <div
      className={`flex shrink-0 items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold ${color}`}
      aria-hidden="true"
    >
      <span className="tracking-tight">9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0L8 11.2Z" />
          <path
            d="M3.1 6.1a7 7 0 0 1 9.8 0"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M.9 3.6a10.2 10.2 0 0 1 14.2 0"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect
            x="0.6"
            y="0.6"
            width="21"
            height="10.8"
            rx="3"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.2"
          />
          <rect x="2.2" y="2.2" width="17.8" height="7.6" rx="1.8" fill="currentColor" />
          <path
            d="M23.2 4.2v3.6a2 2 0 0 0 0-3.6Z"
            fill="currentColor"
            fillOpacity="0.5"
          />
        </svg>
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({
  name,
  hue,
  size = 44,
  ring = false,
}: {
  name: string
  hue: number
  size?: number
  ring?: boolean
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none ${
        ring ? 'ring-2 ring-white/70' : ''
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(140deg, hsl(${hue} 72% 62%), hsl(${(hue + 28) % 360} 68% 46%))`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Screen header                                                       */
/* ------------------------------------------------------------------ */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  tone = 'light',
}: {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  right?: ReactNode
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'
  return (
    <header
      className={`flex shrink-0 items-center gap-2 px-4 pt-1 pb-3 ${dark ? 'text-white' : 'text-ink-900'}`}
    >
      <div className="w-9">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className={`grid h-9 w-9 place-items-center rounded-full transition ${
              dark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1 text-center">
        <h1 className="truncate text-[17px] leading-tight font-bold">{title}</h1>
        {subtitle && <div className="mt-0.5 text-[12px] opacity-70">{subtitle}</div>}
      </div>
      <div className="flex w-9 justify-end">{right}</div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-semibold text-brand-600 hover:text-brand-700"
        >
          {action}
        </button>
      )}
    </div>
  )
}

export function SummaryRow({
  label,
  value,
  strong = false,
  tone = 'light',
  icon,
}: {
  label: ReactNode
  value: ReactNode
  strong?: boolean
  tone?: 'light' | 'dark'
  icon?: ReactNode
}) {
  const dark = tone === 'dark'
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className={`text-[13px] ${dark ? 'text-white/60' : 'text-ink-500'}`}>{label}</span>
      <span
        className={`flex items-center gap-1.5 text-right text-[13px] ${
          strong ? 'font-extrabold' : 'font-semibold'
        } ${dark ? 'text-white' : 'text-ink-900'}`}
      >
        {value}
        {icon}
      </span>
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl bg-brand-600 px-5 py-4 text-[15px] font-bold text-white shadow-[var(--shadow-float)] transition active:scale-[0.99] hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border border-brand-200 bg-white px-5 py-3.5 text-[15px] font-bold text-brand-600 transition active:scale-[0.99] hover:bg-brand-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
}: {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
        onClick ? 'transition hover:bg-brand-50/60' : ''
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-ink-900">{title}</span>
        {subtitle && <span className="block truncate text-[12px] text-ink-500">{subtitle}</span>}
      </span>
      {right ?? (onClick ? <ChevronRight size={18} className="shrink-0 text-ink-400" /> : null)}
    </Tag>
  )
}

/** Tinted rounded-square icon tile used by the service grid and quick actions. */
export function IconTile({
  children,
  hue,
  size = 52,
}: {
  children: ReactNode
  hue: number
  size?: number
}) {
  return (
    <span
      className="grid place-items-center rounded-2xl"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 88% 96%)`,
        color: `hsl(${hue} 72% 45%)`,
      }}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Voice waveform                                                      */
/* ------------------------------------------------------------------ */

const BAR_HEIGHTS = [10, 18, 26, 14, 30, 20, 34, 16, 24, 12, 28, 18, 32, 14, 22, 10, 26, 16, 30, 12]

export function Waveform({
  active = true,
  color = 'rgba(255,255,255,0.85)',
  height = 34,
}: {
  active?: boolean
  color?: string
  height?: number
}) {
  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      style={{ height }}
      aria-hidden="true"
    >
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h}px`,
            background: color,
            transformOrigin: 'center',
            animation: active ? `bar-bounce ${0.9 + (i % 5) * 0.13}s ease-in-out ${i * 0.05}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */

export function Toast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex justify-center px-6">
      <div className="animate-fade-up rounded-full bg-ink-900/90 px-4 py-2 text-[13px] font-semibold text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}
