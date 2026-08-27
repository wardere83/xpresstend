import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import familyStill from '../assets/brand/join-family.jpg'

/**
 * The panel beside the sign-up form.
 *
 * It plays public/media/join-family.mp4 when that file exists and falls back to
 * a still otherwise, so real footage can be dropped in without touching this
 * component. The video is muted, looped and inline, which is what browsers
 * require before they will autoplay anything, and it carries no audio track by
 * design: a page that starts making noise during sign-up loses people.
 */
const VIDEO_SRC = `${import.meta.env.BASE_URL}media/join-family.mp4`

export function JoinMedia() {
  const t = useT()
  const [hasVideo, setHasVideo] = useState(false)

  useEffect(() => {
    let cancelled = false
    // HEAD first: pointing <video> at a missing file logs a console error and
    // leaves a broken element behind on some engines.
    fetch(VIDEO_SRC, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        if (!cancelled && res.ok && type.startsWith('video/')) setHasVideo(true)
      })
      .catch(() => {
        /* No video published yet; the still stands in. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative hidden overflow-hidden rounded-[28px] bg-ink-900 lg:block">
      {hasVideo ? (
        <video
          className="h-full w-full object-cover"
          poster={familyStill}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={t('join.mediaAlt')}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      ) : (
        <img src={familyStill} alt={t('join.mediaAlt')} className="h-full w-full object-cover" />
      )}

      {/* Scrim so the caption stays legible whatever the frame underneath does. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-transparent p-7 pt-16">
        <p className="text-[19px] font-extrabold leading-snug text-white">{t('join.mediaTitle')}</p>
        <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed text-white/80">{t('join.mediaBody')}</p>
      </div>
    </div>
  )
}
