import { useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useBrandCopy } from './brandCopy'

const media = `${import.meta.env.BASE_URL}media/`

export function BrandFilm() {
  const copy = useBrandCopy()
  const video = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [failed, setFailed] = useState(false)

  const play = async () => {
    if (!video.current) return
    try {
      await video.current.play()
      setStarted(true)
    } catch {
      // Native controls remain available when browser playback is blocked.
      setStarted(true)
    }
  }

  return (
    <section
      className="brand-film brand-width"
      id="brand-film"
      aria-labelledby="film-title"
    >
      <div className="brand-section-heading">
        <h2 id="film-title">{copy.filmTitle}</h2>
        <span className="brand-eyebrow">{copy.filmLabel}</span>
      </div>
      <div className="brand-cinema">
        <video
          ref={video}
          controls={started}
          playsInline
          muted
          preload="none"
          poster={`${media}closer-poster.webp`}
          aria-label={copy.play}
          aria-describedby="film-description"
          onPlay={() => setStarted(true)}
          onError={() => setFailed(true)}
        >
          <source src={`${media}closer.mp4`} type="video/mp4" />
          <track
            kind="captions"
            src={`${media}closer.en.vtt`}
            srcLang="en"
            label="English"
          />
        </video>
        {!started && !failed && (
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
