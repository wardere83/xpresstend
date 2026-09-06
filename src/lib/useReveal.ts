import { useEffect, useRef, useState } from 'react'

/**
 * Fires once, the first time the element crosses into the viewport, and never
 * un-fires — a marketing page should not replay its own entrance every time
 * someone scrolls up past a section. Honours prefers-reduced-motion by
 * starting visible, since index.css already collapses animation durations to
 * ~0 for that preference; the extra guard here just skips the layout cost of
 * ever being invisible in the first place.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [visible])

  return { ref, visible }
}
