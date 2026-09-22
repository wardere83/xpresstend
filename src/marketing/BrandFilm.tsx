import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useBrandCopy } from './brandCopy'

const media = `${import.meta.env.BASE_URL}media/`

/**
 * The brand film.
 *
 * An ambient loop rather than something to be watched once: muted, looping,
 * inline, and with no controls at all. No controls is what actually removes the
 * audio, not just the `muted` attribute — a control bar carries a volume
 * slider, so anyone could have turned the sound on. Without it there is no
 * route to audio, which is the behaviour wanted here and the same thing Apple
 * does with the video on its own front page.
 *
 * `preload="metadata"` rather than `none`, because it has to start by itself;
 * and rather than `auto`, so a phone on cellular does not fetch the whole file
 * before the page is even scrolled to it.
 */
export function BrandFilm() {
  const copy = useBrandCopy()
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  /*
   * Someone who has asked their system not to animate things should not be
   * handed a looping video. They get the poster and a play button instead, so
   * the film is still available, just not imposed. Checked at runtime rather
   * than in CSS because it decides whether to autoplay, not how to style.
   */
  const [reduceMotion, setReduceMotion] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(q.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    q.addEventListener('change', onChange)
    return () => q.removeEventListener('change', onChange)
  }, [])

  const play = async () => {
    if (!video.current) return
    try {
      await video.current.play()
      setPlaying(true)
    } catch {
      // Autoplay refused. The poster and the button stay, so it is still
      // reachable on a tap.
      setPlaying(false)
    }
  }

  return (
    <section className="brand-film" id="brand-film" aria-labelledby="film-title">
      <div className="brand-section-heading">
        <h2 id="film-title">{copy.filmTitle}</h2>
        <span className="brand-eyebrow">{copy.filmLabel}</span>
      </div>
      <div className="brand-cinema">
        <video
          ref={video}
          /* No controls, ever: a control bar is a volume slider. */
          playsInline
          muted
          loop
          autoPlay={!reduceMotion}
          preload="metadata"
          poster={`${media}closer-poster.webp`}
          aria-label={copy.play}
          aria-describedby="film-description"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        >
          <source src={`${media}closer.mp4`} type="video/mp4" />
          {/* No captions track: with no audio there is nothing to caption, and
              with no controls there would be no way to switch them on. The
              content of the film is described for screen readers below. */}
        </video>
        {/* Shown only when the film is not running, which on a normal visit is
            never: either reduced motion is on, or the browser blocked
            autoplay. */}
        {!playing && !failed && (
          <button
            type="button"
            className="brand-film-play"
            onClick={() => void play()}
            aria-label={copy.play}
          >
            <Play size={26} fill="currentColor" aria-hidden="true" />
          </button>
        )}
        {failed && (
          <a className="brand-film-fallback" href={`${media}closer.mp4`}>
            {copy.watch} ↗
          </a>
        )}
      </div>
      <p className="sr-only" id="film-description">
        {copy.filmDescription}
      </p>
    </section>
  )
}
