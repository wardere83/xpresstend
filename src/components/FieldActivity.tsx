import { useEffect } from 'react'

/** Animate only the field being edited; never inspect or retain its contents. */
export function FieldActivity() {
  useEffect(() => {
    const timers = new Map<HTMLElement, number>()
    const clear = (field: HTMLElement) => {
      window.clearTimeout(timers.get(field))
      timers.delete(field)
      field.removeAttribute('data-entry-active')
    }
    const input = (event: Event) => {
      const field = event.target
      if (!(field instanceof HTMLElement) || !field.matches('.staff-console input:not([type=checkbox]):not([type=radio]), .staff-console textarea, .staff-console select, .demo-field')) return
      if (document.activeElement !== field) return
      clear(field)
      field.setAttribute('data-entry-active', 'true')
      timers.set(field, window.setTimeout(() => clear(field), 2600))
    }
    const blur = (event: FocusEvent) => { if (event.target instanceof HTMLElement) clear(event.target) }
    const hide = () => { if (document.hidden) for (const field of timers.keys()) clear(field) }
    document.addEventListener('input', input)
    document.addEventListener('focusout', blur)
    document.addEventListener('visibilitychange', hide)
    return () => {
      document.removeEventListener('input', input)
      document.removeEventListener('focusout', blur)
      document.removeEventListener('visibilitychange', hide)
      for (const field of timers.keys()) clear(field)
    }
  }, [])
  return null
}
