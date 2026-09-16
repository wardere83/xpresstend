import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useT } from '../i18n'
import { useBrandCopy } from './brandCopy'

const tabs = ['send', 'people', 'activity'] as const
export function AppShowcase({ onExplore }: { onExplore: () => void }) {
  const copy = useBrandCopy()
  const t = useT()
  const [active, setActive] = useState<(typeof tabs)[number]>('send')
  const details = {
    send: [copy.sendTitle, copy.sendBody],
    people: [copy.peopleTitle, copy.peopleBody],
    activity: [copy.activityTitle, copy.activityBody],
  }
  return (
    <section
      className="brand-experience brand-width"
      id="experience"
      aria-labelledby="experience-title"
    >
      <div className="brand-experience-copy">
        <p className="brand-eyebrow">{copy.personal}</p>
        <h2 className="brand-display" id="experience-title">
          {copy.experienceTitle}
        </h2>
        <div className="brand-tabs" role="tablist" aria-label={copy.experience}>
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-${tab}`}
              aria-selected={active === tab}
              aria-controls="experience-panel"
              tabIndex={active === tab ? 0 : -1}
              onClick={() => setActive(tab)}
              onKeyDown={(event) => {
                let next: number | undefined
                if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
                if (event.key === 'ArrowLeft')
                  next = (index + tabs.length - 1) % tabs.length
                if (event.key === 'Home') next = 0
                if (event.key === 'End') next = tabs.length - 1
                if (next !== undefined) {
                  event.preventDefault()
                  setActive(tabs[next])
                  document.getElementById(`tab-${tabs[next]}`)?.focus()
                }
              }}
            >
              {copy[tab]}
            </button>
          ))}
        </div>
        <div
          id="experience-panel"
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          tabIndex={0}
        >
          <h3>{details[active][0]}</h3>
          <p className="brand-body">{details[active][1]}</p>
        </div>
        <button className="brand-text-link" onClick={onExplore}>
          {t('marketing.tryDemo')} <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="brand-device-stage" aria-hidden="true">
        <div className="brand-device-orbit" />
        <div className="brand-device">
          <div className="brand-device-island" />
          <img
            src={`${import.meta.env.BASE_URL}media/app-${active}.webp`}
            width="390"
            height="780"
            loading="lazy"
            alt=""
          />
        </div>
        <div className="brand-device-caption">
          XpressTend<span>{copy.connected}</span>
        </div>
      </div>
    </section>
  )
}
