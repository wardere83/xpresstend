import { reducedMotionQuery } from '../accessibility/motion'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Pause, Play } from 'lucide-react'
import { brand } from '../config/brand'
import { ContentSections, PageFooter, PageHeader, Q } from './PageShell'
import { useI18n } from '../i18n'
import { readPassage } from './siteContent'
import {
  philanthropyLabels,
  philanthropyThemes,
  philanthropyPage,
  learningTopics,
} from './philanthropyCopy'
import { RiverFlow } from './RiverFlow'
import { BirdFlight } from './BirdFlight'
import { usePageTitle } from './usePageTitle'

const media = `${import.meta.env.BASE_URL}media/`
const FILM_SRC = `${media}community-literacy.mp4`
const FILM_POSTER = `${media}community-literacy-poster.webp`
const enquiry = `mailto:${brand.support.email}?subject=Financial%20Literacy%20enquiry`
// Holds at least 80% navy across the column the words occupy, then clears.
const FILM_SCRIM =
  'linear-gradient(to right, rgb(11 37 47 / 0.95) 0%, rgb(11 37 47 / 0.88) 45%, rgb(11 37 47 / 0.8) 62%, rgb(11 37 47 / 0.12) 90%)'

/**
 * The banner film.
 *
 * It plays public/media/community-literacy.mp4 when that file exists and shows
 * the still banner otherwise, so footage can be added without touching this
 * component (see docs/philanthropy-banner-film.md). Muted, looped and inline,
 * with a pause control because it moves for longer than five seconds.
 */
function useBannerFilm() {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    // HEAD first: pointing <video> at a missing file logs a console error.
    fetch(FILM_SRC, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        if (!cancelled && res.ok && type.startsWith('video/'))
          setAvailable(true)
      })
      .catch(() => {
        /* No film published yet; the still banner stands in. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return available
}

function Banner() {
  const { lang } = useI18n()
  const available = useBannerFilm()
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && reducedMotionQuery().matches,
  )

  useEffect(() => {
    const q = reducedMotionQuery()
    const onChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches)
      if (e.matches) video.current?.pause()
    }
    q.addEventListener('change', onChange)
    return () => q.removeEventListener('change', onChange)
  }, [])

  // A file that answers as video but cannot be decoded falls back to the still.
  const hasFilm = available && !failed

  return (
    <section
      className="relative isolate overflow-hidden bg-xt-navy text-white"
      aria-labelledby="philanthropy-title"
    >
      {hasFilm ? (
        /*
         * On phones the film sits above the words, whole and uncovered. From
         * large screens up it fills the banner behind them.
         */
        <div className="relative lg:static">
          <video
            ref={video}
            className="block aspect-video w-full object-cover lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto lg:h-full"
            poster={FILM_POSTER}
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          >
            <source
              src={FILM_SRC}
              type="video/mp4"
              onError={() => setFailed(true)}
            />
          </video>
          <button
            type="button"
            className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-xt-navy text-white hover:bg-brand-700 focus-visible:shadow-[0_0_0_6px_#0b252f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-xt-turquoise lg:bottom-5 lg:right-5"
            onClick={() => {
              if (playing) video.current?.pause()
              else void video.current?.play().catch(() => {})
            }}
            aria-label={readPassage(
              playing ? philanthropyLabels.pause : philanthropyLabels.play,
              lang,
            )}
          >
            {playing ? (
              <Pause size={18} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={18} fill="currentColor" aria-hidden="true" />
            )}
          </button>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(90%_70%_at_85%_10%,rgba(75,209,211,0.34),transparent_60%),radial-gradient(70%_60%_at_5%_100%,rgba(131,166,176,0.3),transparent_65%)]"
        />
      )}
      {/* Scrim: dense under the words, clear over the rest of the film. */}
      {hasFilm ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden lg:block"
          style={{ backgroundImage: FILM_SCRIM }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-xt-navy via-xt-navy/80 to-xt-navy/30"
        />
      )}

      <div
        className={`mx-auto max-w-5xl px-5 sm:px-8 ${
          hasFilm
            ? 'py-12 sm:py-14 lg:flex lg:min-h-[40rem] lg:flex-col lg:justify-center lg:py-24'
            : 'py-20 sm:py-28 lg:py-36'
        }`}
      >
        <div className={hasFilm ? 'lg:max-w-xl' : undefined}>
          <p className="text-xs font-semibold uppercase tracking-widest text-xt-turquoise">
            {readPassage(philanthropyLabels.title, lang)}
          </p>
          <h1
            id="philanthropy-title"
            className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            XpressTend Financial Literacy
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            {readPassage(philanthropyLabels.intro, lang)}
          </p>
          <ul
            className="mt-9 flex max-w-3xl flex-wrap gap-2.5"
            aria-label={readPassage(philanthropyLabels.themes, lang)}
          >
            {philanthropyThemes.map((theme) => (
              <li
                key={theme[0]}
                className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
              >
                {readPassage(theme, lang)}
              </li>
            ))}
          </ul>
          {hasFilm ? (
            <p className="sr-only">
              {readPassage(philanthropyLabels.film, lang)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function Philanthropy() {
  const { lang, dir } = useI18n()
  const title = readPassage(philanthropyPage.sections[0].title, lang)
  usePageTitle('XpressTend Financial Literacy')
  return (
    <div lang={lang} dir={dir} className="institutional-site">
      <PageHeader />
      <main id="company-content" tabIndex={-1}>
        <Banner />
        <section
          className="philanthropy-nature corporate-partners"
          aria-labelledby="partners-heading"
        >
          <div>
            <p className="institutional-eyebrow">
              {readPassage(philanthropyLabels.title, lang)}
            </p>
            <h2 id="partners-heading">{title}</h2>
            {philanthropyPage.sections[0].paragraphs.map((paragraph, i) => (
              <p key={i}>{readPassage(paragraph, lang)}</p>
            ))}
          </div>
          <div className="philanthropy-habitat">
            <RiverFlow />
          </div>
          <BirdFlight title={title} />
        </section>
        <div className="institutional-body">
          <ContentSections
            page={{
              ...philanthropyPage,
              sections: philanthropyPage.sections.slice(1),
            }}
            extra={(id) =>
              id === 'skills-heading' ? (
                <div className="learning-topics">
                  {learningTopics.map((topic) => (
                    <Q key={topic.title[0]} q={readPassage(topic.title, lang)}>
                      {readPassage(topic.body, lang)}
                    </Q>
                  ))}
                </div>
              ) : id === 'join-heading' ? (
                <a className="philanthropy-contact" href={enquiry}>
                  {readPassage(philanthropyLabels.contact, lang)}
                  <ArrowUpRight size={17} />
                </a>
              ) : null
            }
          />
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
