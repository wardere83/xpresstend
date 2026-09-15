import { Apple, Download } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'

/**
 * App download.
 *
 * Android points at a rolling GitHub release, whose assets download without a
 * login. Actions artifacts would have needed one, so they cannot sit behind a
 * public button.
 *
 * iOS joins through TestFlight once a public link is configured on the brand;
 * until then the card stays honest about the beta being invite-only.
 */
const APK_URL = brand.appLinks.androidApk

export function GetTheApp() {
  const t = useT()
  const testflight = brand.appLinks.iosTestFlight

  return (
    <section id="get-the-app" className="border-t border-ink-200/70 bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight">{t('app.title')}</h2>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-500">{t('app.body')}</p>

          <ul className="mt-6 space-y-2.5">
            {(['app.point1', 'app.point2', 'app.point3'] as const).map((key) => (
              <li key={key} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-700">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <a
            href={APK_URL}
            className="flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-ink-200/70 transition hover:ring-brand-400"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <Download size={22} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-ink-900">{t('app.android')}</span>
              <span className="block text-[12px] leading-snug text-ink-500">{t('app.androidNote')}</span>
            </span>
          </a>

          {testflight ? (
            <a
              href={testflight}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-ink-200/70 transition hover:ring-brand-400"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <Apple size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-ink-900">{t('app.ios')}</span>
                <span className="block text-[12px] leading-snug text-ink-500">{t('app.iosBetaNote')}</span>
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-ink-200/70 opacity-70">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-200 text-ink-500">
                <Apple size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-ink-900">{t('app.ios')}</span>
                <span className="block text-[12px] leading-snug text-ink-500">{t('app.iosNote')}</span>
              </span>
            </div>
          )}

          {/* No icon: a smartphone outline at footnote size reads as a
              missing-glyph box, not as an icon. */}
          <p className="pt-1 text-[11px] leading-relaxed text-ink-500">{t('app.sideloadNote')}</p>
        </div>
      </div>
    </section>
  )
}
