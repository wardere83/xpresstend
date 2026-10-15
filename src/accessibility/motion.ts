export const ACCESSIBILITY_EVENT = 'xpresstend:accessibility'
/** Combine the device preference with the explicit in-app motion setting. */
export function reducedMotionQuery() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const storedReduction = () => {
    try {
      return JSON.parse(localStorage.getItem('xpresstend.accessibility') || 'null')?.motion === 'reduce'
    } catch {
      return false
    }
  }
  const callbacks = new Map<(event: MediaQueryListEvent) => void, () => void>()
  const query = {
    get matches() {
      return (
        media.matches ||
        document.documentElement.dataset.a11yMotion === 'reduce' ||
        (!document.documentElement.dataset.a11yMotion && storedReduction())
      )
    },
    addEventListener(_type: 'change', callback: (event: MediaQueryListEvent) => void) {
      const update = () =>
        callback(new MediaQueryListEvent('change', { matches: query.matches, media: media.media }))
      callbacks.set(callback, update)
      media.addEventListener('change', update)
      window.addEventListener(ACCESSIBILITY_EVENT, update)
    },
    removeEventListener(_type: 'change', callback: (event: MediaQueryListEvent) => void) {
      const update = callbacks.get(callback)
      if (!update) return
      media.removeEventListener('change', update)
      window.removeEventListener(ACCESSIBILITY_EVENT, update)
      callbacks.delete(callback)
    },
  }
  return query
}
