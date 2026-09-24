import { Apple, ArrowUpRight, Download, Globe2 } from 'lucide-react'
import { brand } from '../config/brand'
import { useBrandCopy } from './brandCopy'

export function GetTheApp({ onExplore }: { onExplore: () => void }) {
  const copy = useBrandCopy()
  const released = brand.appLinks.released
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
        {/*
          Both platforms read as in release preparation until
          brand.appLinks.released is true. Rendered as spans rather than
          disabled links, so there is no href for a crawler to follow or a
          reader to right-click and copy: the builds are genuinely not for
          public download yet.
        */}
        <div className="brand-download-buttons" data-unreleased={!released}>
          {released ? (
            <a href={brand.appLinks.androidApk}>
              <Download size={23} />
              <span>
                {copy.android}
                <small>{copy.androidNote}</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
          ) : (
            <span aria-disabled="true">
              <Download size={23} />
              <span>
                {copy.android}
                <small>{copy.androidNote}</small>
              </span>
            </span>
          )}
          {released && ios ? (
            <a href={ios} target="_blank" rel="noreferrer">
              <Apple size={24} />
              <span>
                {copy.ios}
                <small>TestFlight</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
          ) : (
            <span aria-disabled="true">
              <Apple size={24} />
              <span>
                {copy.ios}
                <small>{copy.iosNote}</small>
              </span>
            </span>
          )}
        </div>
        <button type="button" className="brand-text-link" onClick={onExplore}>
          {copy.web} <ArrowUpRight size={16} />
        </button>
        {/* Sideloading instructions are dead copy with no build to install, so
            they wait for the release too. */}
        {released ? (
          <details className="brand-install-help">
            <summary>{copy.installHelp}</summary>
            <p>{copy.installBody}</p>
          </details>
        ) : null}
      </div>
    </section>
  )
}
