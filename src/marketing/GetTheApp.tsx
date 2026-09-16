import { Apple, ArrowUpRight, Download, Globe2 } from 'lucide-react'
import { brand } from '../config/brand'
import { useBrandCopy } from './brandCopy'

export function GetTheApp({ onExplore }: { onExplore: () => void }) {
  const copy = useBrandCopy()
  const ios = brand.appLinks.iosTestFlight
  return (
    <section
      className="brand-download brand-width"
      id="get-the-app"
      aria-labelledby="download-title"
    >
      <div className="brand-download-orbit" aria-hidden="true">
        <Globe2 strokeWidth={0.4} />
        <span />
      </div>
      <div className="brand-download-content">
        <p className="brand-eyebrow">XpressTend</p>
        <h2 className="brand-display" id="download-title">
          {copy.downloadTitle}
        </h2>
        <p className="brand-body">{copy.downloadBody}</p>
        <div className="brand-download-buttons">
          <a href={brand.appLinks.androidApk}>
            <Download size={23} />
            <span>
              {copy.android}
              <small>{copy.androidNote}</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
          <a
            href={
              ios || `mailto:${brand.support.email}?subject=iPhone%20access`
            }
            {...(ios ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <Apple size={24} />
            <span>
              {copy.ios}
              <small>{ios ? 'TestFlight' : copy.iosNote}</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
        </div>
        <button type="button" className="brand-text-link" onClick={onExplore}>
          {copy.web} <ArrowUpRight size={16} />
        </button>
        <details className="brand-install-help">
          <summary>{copy.installHelp}</summary>
          <p>{copy.installBody}</p>
        </details>
      </div>
    </section>
  )
}
