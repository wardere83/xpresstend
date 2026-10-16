import { reducedMotionQuery } from '../accessibility/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './bird.css'

type Point = { x: number; y: number }
type Flight = {
  width: number
  height: number
  start: Point
  end: Point
  letter: string
}
type Phase = 'waiting' | 'flying' | 'perched'

function perchLetter(
  heading: HTMLElement,
): { range: Range; letter: string } | null {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
  const letters: { range: Range; letter: string; top: number }[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    // A letter together with its combining marks, so Arabic tanween stays whole.
    for (const match of node.data.matchAll(/\p{L}\p{M}*/gu)) {
      const range = document.createRange()
      range.setStart(node, match.index)
      range.setEnd(node, match.index + match[0].length)
      const box = range.getBoundingClientRect()
      if (box.width && box.height)
        letters.push({ range, letter: match[0], top: box.top })
    }
  }
  // Perching on a later line would put the dove over the words above it.
  // The final letter of the first visible line is also the final letter of a single-line heading.
  const firstLine = Math.min(...letters.map((letter) => letter.top))
  return (
    letters.filter((letter) => Math.abs(letter.top - firstLine) < 1).at(-1) ??
    null
  )
}

function flightFrames(
  flight: Flight,
  initialTilt = 0,
  initialOpacity = 0.1,
): Keyframe[] {
  const { start, end } = flight
  const direction = start.x > end.x ? -1 : 1
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const rise = Math.min(65, Math.max(28, distance * 0.13))
  const first = {
    x: start.x + (end.x - start.x) * 0.28,
    y: Math.max(26, start.y - rise),
  }
  const second = {
    x: end.x - direction * Math.min(65, distance * 0.2),
    y: Math.max(24, end.y - rise),
  }
  return Array.from({ length: 61 }, (_, index) => {
    const t = index / 60
    const u = 1 - t
    const x =
      u ** 3 * start.x +
      3 * u ** 2 * t * first.x +
      3 * u * t ** 2 * second.x +
      t ** 3 * end.x
    const y =
      u ** 3 * start.y +
      3 * u ** 2 * t * first.y +
      3 * u * t ** 2 * second.y +
      t ** 3 * end.y
    // The bird levels out as it approaches its perch.
    const tilt = Math.sin(t * Math.PI) * direction * 10 + initialTilt * u ** 2
    return {
      offset: t,
      transform: `translate(${x}px, ${y}px) rotate(${tilt}deg)`,
      opacity: Math.min(1, t * 12 + initialOpacity),
    }
  })
}

/** One decorative flight from the river to the end of the nearby heading's first line. */
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
      const anchor = perchLetter(heading)
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
      const end = {
        x: glyph.left - box.left + glyph.width * 0.5,
        y: glyph.top - box.top + glyphTop,
      }
      const center = {
        x: source.left - box.left + source.width / 2,
        y: source.top - box.top + source.height / 2,
      }
      const distance = Math.hypot(end.x - center.x, end.y - center.y) || 1
      const start = {
        x: center.x + ((end.x - center.x) / distance) * source.width * 0.41,
        y: center.y + ((end.y - center.y) / distance) * source.height * 0.41,
      }
      const next = {
        width: box.width,
        height: box.height,
        start,
        end,
        letter: anchor.letter,
      }
      if (JSON.stringify(latestFlight.current) === JSON.stringify(next)) return
      // Preserve the visible point before React changes the overlay viewBox.
      const matrix = animation.current && traveller.current?.getScreenCTM()
      if (matrix) {
        const point = new DOMPoint(0, 0).matrixTransform(matrix)
        positionBeforeGeometry.current = { x: point.x, y: point.y }
      }
      setFlight((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      )
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
    const motion = reducedMotionQuery()
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
    const fly = (
      geometry: Flight,
      duration: number,
      initialTilt = 0,
      initialOpacity = 0.1,
    ) => {
      cancel()
      const current = element.animate(
        flightFrames(geometry, initialTilt, initialOpacity),
        {
          duration,
          easing: 'cubic-bezier(.3,.05,.55,1)',
          fill: 'forwards',
        },
      )
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
      const screen =
        positionBeforeGeometry.current ??
        new DOMPoint(0, 0).matrixTransform(travellerMatrix)
      positionBeforeGeometry.current = null
      const point = new DOMPoint(screen.x, screen.y).matrixTransform(
        overlayMatrix.inverse(),
      )
      const style = getComputedStyle(element)
      const matrix = new DOMMatrix(style.transform)
      const tilt = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
      const remaining =
        Number(current.effect?.getTiming().duration) -
        Number(current.currentTime ?? 0)
      if (!(remaining > 0)) {
        perch()
        return
      }
      fly(
        { ...geometry, start: { x: point.x, y: point.y } },
        remaining,
        tilt,
        Number(style.opacity),
      )
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
        const distance = Math.hypot(
          geometry.end.x - geometry.start.x,
          geometry.end.y - geometry.start.y,
        )
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
      data-artwork="white-dove"
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
            <path
              className="xt-bird-far-wing"
              d="M3-24 C4-37 12-49 24-56 C25-50 21-42 17-36 C24-41 30-43 33-40 C29-31 17-24 7-20 Z"
            />
            <path
              className="xt-bird-tail"
              d="M14-18 C23-20 30-17 36-12 L31-9 L34-6 C24-5 17-8 11-12 Z"
            />
            <path
              className="xt-bird-feet"
              d="M-3-10 L-4-1 M-8 0 H0 M5-10 L5-1 M2 0 H9"
            />
            <path
              className="xt-bird-body"
              d="M-18-28 C-10-32-5-29 0-26 C10-30 21-25 22-18 C23-11 15-7 6-7 C-4-6-12-10-17-15 C-21-20-22-24-18-28 Z"
            />
            <circle className="xt-bird-head" cx="-18" cy="-28" r="8" />
            <path className="xt-bird-beak" d="M-25-30 L-33-26 L-25-24 Z" />
            <circle className="xt-bird-eye" cx="-21" cy="-29" r="1.3" />
            <circle cx="-21.35" cy="-29.4" r=".36" fill="#fff" />
            <path
              className="xt-bird-folded-wing"
              d="M-5-23 C3-27 15-24 17-18 C14-12 4-10-5-23 Z"
            />
            <path
              className="xt-bird-folded-feathers"
              d="M1-21 Q8-17 14-17 M-1-18 Q5-14 10-14"
            />
            <path
              className="xt-bird-flight-wing"
              d="M1-23 C9-34 12-49 18-58 C23-55 24-48 21-41 C26-46 30-47 32-43 C32-38 26-30 20-25 C14-20 7-19 1-23 Z"
            />
            <path
              className="xt-bird-flight-feathers"
              d="M6-25 Q17-35 19-47 M10-24 Q23-32 27-41"
            />
          </g>
        </g>
      )}
    </svg>
  )
}
