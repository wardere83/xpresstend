import { useEffect, useId, useRef, useState } from 'react'
import { Apple, ChevronDown, Download, Mail } from 'lucide-react'
import { brand } from '../config/brand'
import { useT } from '../i18n'
import { useBrandCopy } from './brandCopy'

export function DownloadAppMenu() {
  const t = useT()
  const copy = useBrandCopy()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const released = brand.appLinks.released
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div
      className="brand-download-menu"
      ref={ref}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span>{t('nav.downloadApp')}</span>
        <ChevronDown size={13} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="brand-download-popover" id={id} data-unreleased={!released}>
          {released ? (
            <a href={brand.appLinks.androidApk} onClick={() => setOpen(false)}>
              <Download size={17} />
              <span>
                {copy.android}
                <small>.apk</small>
              </span>
            </a>
          ) : (
            <span aria-disabled="true">
              <Download size={17} />
              <span>
                {copy.android}
                <small>{copy.androidNote}</small>
              </span>
            </span>
          )}
          {released && brand.appLinks.iosTestFlight ? (
            <a href={brand.appLinks.iosTestFlight} onClick={() => setOpen(false)}>
              <Apple size={17} />
              <span>
                {copy.ios}
                <small>TestFlight</small>
              </span>
            </a>
          ) : (
            <span aria-disabled="true">
              <Apple size={17} />
              <span>
                {copy.ios}
                <small>{copy.iosNote}</small>
              </span>
            </span>
          )}
          {/*
            The one live action while both are unreleased. Without it the menu
            is a dead end, and someone who came looking for the app has no way
            to say so.
          */}
          {!released ? (
            <a
              href={`mailto:${brand.support.email}?subject=${encodeURIComponent('Tell me when the app is ready')}`}
              onClick={() => setOpen(false)}
            >
              <Mail size={17} />
              <span>{copy.notifyMe}</span>
            </a>
          ) : null}
        </div>
      )}
    </div>
  )
}
