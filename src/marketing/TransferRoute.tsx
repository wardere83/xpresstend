import { useEffect, useState } from 'react'
import { CORRIDORS } from './pricing'

/** ISO-3166 alpha-2 -> flag emoji, via the regional indicator symbol block. */
function flagOf(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

/**
 * The interactive banner: one origin, fanning out to every corridor that is
 * actually live today.
 *
 * This is deliberately drawn from `CORRIDORS`, the same table the calculator
 * above quotes from, rather than a separately art-directed list — a banner
 * that shows a country the product cannot yet send to is a promise the site
 * is making on the product's behalf. Five corridors is what is live, so five
 * lines are drawn.
 *
 * The paths are plain SVG, and the drift along them is native SMIL
 * (`animateMotion`), not a JS animation loop — nothing here needs to spend a
 * frame budget. `prefers-reduced-motion` removes the motion elements outright
 * rather than relying on a CSS override, since SMIL does not answer to
 * `animation-duration`.
 */
export function TransferRoute() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    setReduced(!!mq?.matches)
    const onChange = () => setReduced(!!mq?.matches)
    mq?.addEventListener?.('change', onChange)
    return () => mq?.removeEventListener?.('change', onChange)
  }, [])

  const destinations = CORRIDORS.slice(0, 5)
  // Evenly spaced rows, matching the grid below: (i + 0.5) / n * 100.
  const ys = destinations.map((_, i) => ((i + 0.5) / destinations.length) * 100)
  const curves = ys.map((y) => `M 3,50 Q 50,${(50 + y) / 2} 97,${y}`)

  return (
    <section
      aria-label="Live send corridors"
      className="relative overflow-hidden border-y border-brand-800 bg-brand-600"
    >
      {/* Two soft turquoise blooms rather than one — a single radial glow reads
          like a spotlight, two overlapping ones read like depth. Both sit well
          outside the content column so they never compete with the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-brand-300/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-10 md:gap-8 md:py-14">
        {/* Origin */}
        <div className="flex flex-col items-start gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            Sending from
          </span>
          <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span aria-hidden="true" className="text-lg leading-none">
              {flagOf('US')}
            </span>
            <span className="text-[13px] font-semibold text-white">United States</span>
          </span>
        </div>

        {/* The routes */}
        <div className="relative hidden h-40 min-w-0 md:block" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            {curves.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="var(--color-brand-400)"
                strokeOpacity={0.28}
                strokeWidth={1.1}
                strokeDasharray="0.4 3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {!reduced &&
              curves.map((d, i) => (
                <circle key={i} r={1.1} fill="var(--color-brand-400)">
                  <animateMotion
                    path={d}
                    dur={`${3.6 + i * 0.5}s`}
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.08;0.85;1"
                    dur={`${3.6 + i * 0.5}s`}
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
          </svg>
        </div>

        {/* Destinations */}
        <div className="grid gap-2.5" style={{ gridTemplateRows: `repeat(${destinations.length}, 1fr)` }}>
          {destinations.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 ring-1 ring-white/10 transition-colors hover:bg-white/10"
            >
              <span aria-hidden="true" className="text-base leading-none">
                {flagOf(c.receive_country)}
              </span>
              <span className="text-[12.5px] font-medium text-brand-100">{c.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
