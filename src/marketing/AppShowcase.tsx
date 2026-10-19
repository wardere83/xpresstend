import { AppPreview } from './AppPreview'
import { AppTour } from './AppTour'
import { useAppTourCopy } from './appTourCopy'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useCorporateCopy } from './corporateCopy'
import { useBrandCopy } from './brandCopy'
import './phone-frame.css'

const tabs = ['send', 'people', 'activity'] as const
export function AppShowcase({ onExplore }: { onExplore: () => void }) {
  const copy = useBrandCopy()
  const tourCopy = useAppTourCopy()
  const [tour, setTour] = useState(true)
  const section = useRef<HTMLElement>(null)
  const [touchEngaged, setTouchEngaged] = useState(false)
  useEffect(() => {
    const release = (event: Event) => {
      if (event.target instanceof Node && !section.current?.contains(event.target))
        setTouchEngaged(false)
    }
    const releaseOnFocus = (event: FocusEvent) => {
      // A tap on non-focusable copy can focus the nearest focusable ancestor
      // (main or body). That fallback still belongs to the inside interaction.
      if (event.target instanceof Node && section.current && event.target.contains(section.current))
        return
      release(event)
    }
    const useKeyboard = () => setTouchEngaged(false)
    document.addEventListener('pointerdown', release, true)
    document.addEventListener('focusin', releaseOnFocus, true)
    document.addEventListener('keydown', useKeyboard, true)
    return () => {
      document.removeEventListener('pointerdown', release, true)
      document.removeEventListener('focusin', releaseOnFocus, true)
      document.removeEventListener('keydown', useKeyboard, true)
    }
  }, [])
  const corporate = useCorporateCopy()
  const [active, setActive] = useState<(typeof tabs)[number]>('send')
  const details = {
    send: [copy.sendTitle, copy.sendBody],
    people: [copy.peopleTitle, copy.peopleBody],
    activity: [copy.activityTitle, copy.activityBody],
  }
  return (
    <section
      ref={section}
      className="brand-experience brand-width"
      data-phone-engaged={touchEngaged}
      onPointerDownCapture={(event) => {
        if (event.pointerType === 'touch' || event.pointerType === 'pen')
          setTouchEngaged(true)
      }}
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
              onClick={() => {
                setActive(tab)
                setTour(false)
              }}
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
                  setTour(false)
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
        <button
          className="brand-text-link brand-tour-replay"
          aria-pressed={tour}
          onClick={() => setTour((current) => !current)}
        >
          {tour ? tourCopy.screen : tourCopy.watch}
        </button>
        <button className="brand-text-link" onClick={onExplore}>
          {corporate.demoAction} <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="brand-device-stage">
        <div className="brand-device-orbit" aria-hidden="true" />
        <div className="brand-device">
          <div className="brand-device-island" aria-hidden="true" />
          {tour ? <AppTour /> : <AppPreview screen={active} />}
        </div>
        <div className="brand-device-caption">
          XpressTend<span>{copy.connected}</span>
        </div>
      </div>
    </section>
  )
}
