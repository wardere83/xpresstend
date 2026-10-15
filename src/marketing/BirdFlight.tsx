import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './bird.css'

type Point = { x: number; y: number }
type Flight = { width: number; height: number; start: Point; end: Point; letter: string }
type Phase = 'waiting' | 'flying' | 'perched'

function lastLetter(heading: HTMLElement): { range: Range; letter: string } | null {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  for (const node of nodes.reverse()) {
    // A letter together with its combining marks, so Arabic tanween stays whole.
    const matches = [...node.data.matchAll(/\p{L}\p{M}*/gu)]
    const match = matches.at(-1)
    if (!match) continue
    const range = document.createRange()
    range.setStart(node, match.index)
    range.setEnd(node, match.index + match[0].length)
    return { range, letter: match[0] }
  }
  return null
}

function flightFrames(flight: Flight, initialTilt = 0, initialOpacity = 0.1): Keyframe[] {
  const { start, end } = flight
  const direction = start.x > end.x ? -1 : 1
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const rise = Math.min(65, Math.max(28, distance * 0.13))
  const first = { x: start.x + (end.x - start.x) * 0.28, y: Math.max(26, start.y - rise) }
  const second = { x: end.x - direction * Math.min(65, distance * 0.2), y: Math.max(24, end.y - rise) }
  return Array.from({ length: 61 }, (_, index) => {
    const t = index / 60
    const u = 1 - t
    const x = u ** 3 * start.x + 3 * u ** 2 * t * first.x + 3 * u * t ** 2 * second.x + t ** 3 * end.x
    const y = u ** 3 * start.y + 3 * u ** 2 * t * first.y + 3 * u * t ** 2 * second.y + t ** 3 * end.y
    // The bird levels out as it approaches its perch.
    const tilt = Math.sin(t * Math.PI) * direction * 10 + initialTilt * u ** 2
    return {
      offset: t,
      transform: `translate(${x}px, ${y}px) rotate(${tilt}deg)`,
      opacity: Math.min(1, t * 12 + initialOpacity),
    }
  })
}

/** One decorative flight from the river to the final letter of the nearby heading. */
export function BirdFlight({ title }: { title: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const traveller = useRef<SVGGElement>(null)
  const flown = useRef(false)
  const latestFlight = useRef<Flight | null>(null)
  const animation = useRef<Animation | null>(null)
  const positionBeforeGeometry = useRef<Point | null>(null)
  const retarget = useRef<(() => void) | null>(null)
  const [flight, setFlight] = useState<Flight | null>(null)
  const [phase, setPhase] = useState<Phase>('waiting')
  const [active, setActive] = useState(false)

  useEffect(() => {
    const section = ref.current?.closest<HTMLElement>('.corporate-partners')
    const heading = section?.querySelector<HTMLElement>('#partners-heading')
    const river = section?.querySelector<SVGSVGElement>('.xt-river')
    if (!section || !heading || !river) return
    let disposed = false
    const measure = () => {
      if (disposed) return
      const anchor = lastLetter(heading)
      if (!anchor) return
      const box = section.getBoundingClientRect()
      const glyph = anchor.range.getBoundingClientRect()
      const source = river.getBoundingClientRect()
      if (!box.width || !glyph.width || !source.width) return
      const style = getComputedStyle(heading)
      const context = document.createElement('canvas').getContext('2d')
      if (context)
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const metrics = context?.measureText(anchor.letter)
      const glyphTop =
        metrics &&
        Number.isFinite(metrics.fontBoundingBoxAscent) &&
        Number.isFinite(metrics.actualBoundingBoxAscent)
          ? metrics.fontBoundingBoxAscent - metrics.actualBoundingBoxAscent
          : glyph.height * 0.24
      const end = { x: glyph.left - box.left + glyph.width * 0.5, y: glyph.top - box.top + glyphTop }
      const center = {
        x: source.left - box.left + source.width / 2,
        y: source.top - box.top + source.height / 2,
      }
      const distance = Math.hypot(end.x - center.x, end.y - center.y) || 1
      const start = {
        x: center.x + ((end.x - center.x) / distance) * source.width * 0.41,
        y: center.y + ((end.y - center.y) / distance) * source.height * 0.41,
      }
      const next = { width: box.width, height: box.height, start, end, letter: anchor.letter }
      if (JSON.stringify(latestFlight.current) === JSON.stringify(next)) return
      // Preserve the visible point before React changes the overlay viewBox.
      const matrix = animation.current && traveller.current?.getScreenCTM()
      if (matrix) {
        const point = new DOMPoint(0, 0).matrixTransform(matrix)
        positionBeforeGeometry.current = { x: point.x, y: point.y }
      }
      setFlight((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(section)
    observer.observe(heading)
    observer.observe(river)
    measure()
    void document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => {
      disposed = true
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', measure)
    }
  }, [title])

  useLayoutEffect(() => {
    latestFlight.current = flight
    retarget.current?.()
  }, [flight])

  const ready = flight !== null
  useEffect(() => {
    const element = traveller.current
    const section = ref.current?.closest<HTMLElement>('.corporate-partners')
    if (!element || !section || !ready) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    const cancel = () => {
      if (animation.current) {
        animation.current.onfinish = null
        animation.current.cancel()
      }
      animation.current = null
    }
    const perch = () => {
      flown.current = true
      cancel()
      positionBeforeGeometry.current = null
      setPhase('perched')
    }
    const fly = (geometry: Flight, duration: number, initialTilt = 0, initialOpacity = 0.1) => {
      cancel()
      const current = element.animate(flightFrames(geometry, initialTilt, initialOpacity), {
        duration,
        easing: 'cubic-bezier(.3,.05,.55,1)',
        fill: 'forwards',
      })
      animation.current = current
      current.onfinish = () => {
        if (animation.current === current) perch()
      }
      if (!visible || document.visibilityState !== 'visible') current.pause()
    }
    retarget.current = () => {
      const current = animation.current
      const geometry = latestFlight.current
      const overlayMatrix = ref.current?.getScreenCTM()
      const travellerMatrix = element.getScreenCTM()
      if (!current || !geometry || !overlayMatrix || !travellerMatrix) return
      const screen = positionBeforeGeometry.current ?? new DOMPoint(0, 0).matrixTransform(travellerMatrix)
      positionBeforeGeometry.current = null
      const point = new DOMPoint(screen.x, screen.y).matrixTransform(overlayMatrix.inverse())
      const style = getComputedStyle(element)
      const matrix = new DOMMatrix(style.transform)
      const tilt = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
      const remaining = Number(current.effect?.getTiming().duration) - Number(current.currentTime ?? 0)
      if (!(remaining > 0)) {
        perch()
        return
      }
      fly({ ...geometry, start: { x: point.x, y: point.y } }, remaining, tilt, Number(style.opacity))
    }
    const update = () => {
      const running = visible && document.visibilityState === 'visible'
      setActive(running)
      if (motion.matches) {
        perch()
        return
      }
      const geometry = latestFlight.current
      if (!flown.current && !animation.current && running && geometry) {
        setPhase('flying')
        const distance = Math.hypot(geometry.end.x - geometry.start.x, geometry.end.y - geometry.start.y)
        // An unhurried glide: slow enough to follow all the way to its perch.
        fly(geometry, Math.min(14000, Math.max(9000, 5600 + distance * 14)))
      } else if (animation.current) {
        if (running) animation.current.play()
        else animation.current.pause()
      }
    }
    if (flown.current || motion.matches) perch()
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.3
        update()
      },
      { threshold: [0, 0.3] },
    )
    observer.observe(section)
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
      retarget.current = null
      cancel()
    }
  }, [ready])

  const position = flight && (phase === 'waiting' ? flight.start : flight.end)
  const facing = flight && flight.start.x < flight.end.x ? -1 : 1
  return (
    <svg
      ref={ref}
      className="xt-bird"
      viewBox={flight ? `0 0 ${flight.width} ${flight.height}` : undefined}
      aria-hidden="true"
      focusable="false"
      data-phase={phase}
      data-active={active}
      data-letter={flight?.letter}
      data-landing-x={flight?.end.x}
      data-landing-y={flight?.end.y}
    >
      {position && (
        <g
          ref={traveller}
          className="xt-bird-traveller"
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        >
          <g className="xt-bird-art" style={{ scale: `${facing} 1` }}>
            <svg
              className="xt-bird-folded-wing"
              x="-23"
              y="-33"
              width="68"
              height="36"
              viewBox="120 450 600 315"
              overflow="hidden"
            >
              <image href={`${import.meta.env.BASE_URL}media/wagtail-poses.webp`} width="768" height="768" />
            </svg>
            <svg
              className="xt-bird-flight-wing"
              x="-28"
              y="-52"
              width="76"
              height="57"
              viewBox="120 0 600 450"
              overflow="hidden"
            >
              <image href={`${import.meta.env.BASE_URL}media/wagtail-poses.webp`} width="768" height="768" />
            </svg>
          </g>
        </g>
      )}
    </svg>
  )
}
