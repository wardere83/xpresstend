import type { MouseEvent } from 'react'

/**
 * In-page anchor scrolling for a `HashRouter` app.
 *
 * A plain `<a href="#id">` would change `location.hash` to `#id`, which
 * `HashRouter` reads as a *route*, not a scroll target — since no route
 * named `id` exists, the catch-all route immediately redirects back to `/`
 * and the click appears to do nothing. This intercepts the click instead
 * and scrolls the target element into view directly, so the router's hash
 * is never touched.
 */
export function scrollToSection(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
