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
          <g className="xt-bird-art" style={{ scale: `${facing * 0.76} 0.76` }}>
            <path
              className="xt-bird-far-wing"
              d="M-3-24 C-7-34-2-46 9-57 Q12-59 13-55 L9-44 L19-53 Q23-54 22-50 L17-39 L26-45 Q30-45 27-40 C20-29 10-22-3-24 Z"
            />
            <path
              className="xt-bird-tail"
              d="M12-19 C21-18 31-15 38-11 Q35-8 30-8 L23-11 L30-6 Q19-6 10-13 Z"
            />
            <path
              className="xt-bird-tail-feathers"
              d="M17-15 L31-11 M17-13 L26-9"
            />
            <path
              className="xt-bird-feet"
              d="M-2-9 L-3-2 L-6 0 M-3-2 L0 0 M5-9 L5-2 L2 0 M5-2 L8 0"
            />
            <path
              className="xt-bird-body"
              d="M-24-29 C-24-34-18-37-14-34 C-10-32-11-28-7-26 C1-22 9-23 15-18 C20-15 20-10 14-8 C7-5-2-7-8-11 C-13-15-14-20-16-23 C-20-22-24-24-24-29 Z"
            />
            <path className="xt-bird-beak" d="M-24-30 L-31-27 L-24-26 Z" />
            <circle className="xt-bird-eye" cx="-20.5" cy="-30.5" r="1" />
            <circle cx="-20.75" cy="-30.8" r=".25" fill="#fff" />
            <path
              className="xt-bird-folded-wing"
              d="M-6-24 C1-26 11-22 16-17 Q18-14 14-12 C7-10-2-15-6-24 Z"
            />
            <path
              className="xt-bird-folded-feathers"
              d="M-2-22 Q4-17 13-15 M-1-19 Q5-14 12-13"
            />
            <path
              className="xt-bird-flight-wing"
              d="M-2-23 C-6-33-2-43 8-55 Q14-62 17-60 Q18-56 12-46 L24-58 Q28-60 27-54 L20-41 L31-51 Q35-53 34-48 L26-36 L35-42 Q39-43 36-38 C26-26 15-18 4-21 Z"
            />
            <path
              className="xt-bird-flight-feathers"
              d="M2-25 Q6-36 13-47 M5-24 Q13-34 21-43 M8-23 Q20-30 28-37"
            />
          </g>
        </g>
      )}
    </svg>
  )
}
