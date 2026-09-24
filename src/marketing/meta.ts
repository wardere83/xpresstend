import { useEffect } from 'react'
import { brand } from '../config/brand'

/**
 * Per-page document title and description.
 *
 * The site is a single HTML document, so without this every route shares the
 * one <title> and the one description in web/index.html. A reader with six tabs
 * open from a diligence session sees six identical ones, a forwarded link
 * previews as the home page whatever it points at, and search engines index the
 * set as one page. A dependency for this would be a dependency to manage
 * forever; the whole job is four attribute writes.
 *
 * Reverts to the document's own values on unmount, so leaving a formal page for
 * the marketing page restores the marketing title rather than stranding the
 * last one set.
 */
export function useDocumentMeta({
  title,
  description,
}: {
  /** Page name alone. The company name is appended here. */
  title: string
  description: string
}) {
  useEffect(() => {
    const previousTitle = document.title
    const full = `${title} | ${brand.name}`
    document.title = full

    // og:title and og:description track the page too, so a link pasted into a
    // chat from a formal page previews as that page.
    const targets: [string, string][] = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', full],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', full],
      ['meta[name="twitter:description"]', description],
    ]
    const restore = targets.map(([selector, value]) => {
      const el = document.querySelector<HTMLMetaElement>(selector)
      const previous = el?.content ?? null
      if (el) el.content = value
      return () => {
        if (el && previous !== null) el.content = previous
      }
    })

    return () => {
      document.title = previousTitle
      restore.forEach((undo) => undo())
    }
  }, [title, description])
}
