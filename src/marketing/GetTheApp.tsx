import { Apple, Download, Smartphone } from 'lucide-react'
import { useT } from '../i18n'

/**
 * App download.
 *
 * Android points at a rolling GitHub release, whose assets download without a
 * login. Actions artifacts would have needed one, so they cannot sit behind a
 * public button.
 *
 * iOS is honest about not being available: a build exists and compiles, but
 * installing on a device needs an Apple Developer account and signing, so
 * there is nothing to hand out yet.
 */
const APK_URL = 'https://github.com/wardere83/xpresstend/releases/latest/download/xpresstend.apk'

export function GetTheApp() {
  const t = useT()

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

          <div className="flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-ink-200/70 opacity-70">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-200 text-ink-500">
              <Apple size={22} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-ink-900">{t('app.ios')}</span>
              <span className="block text-[12px] leading-snug text-ink-500">{t('app.iosNote')}</span>
            </span>
          </div>

          <p className="flex items-start gap-2 pt-1 text-[11px] leading-relaxed text-ink-500">
            <Smartphone size={13} className="mt-0.5 shrink-0" />
            {t('app.sideloadNote')}
          </p>
        </div>
      </div>
    </section>
  )
}
