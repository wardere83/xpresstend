import { useEffect, useId, useRef, useState } from 'react'
import { reducedMotionQuery } from '../accessibility/motion'
import './river.css'

// Restore the original Earth-icon waterways from PR #28, rather than a
// photographic medallion. Current traces follow those same three contours.
const channels = [
  'M215.4 150 H170 A20 20 0 0 0 150 170 V215.4',
  'M70 33.4 V50 A30 30 0 0 0 100 80 A20 20 0 0 1 120 100 C120 111 129 120 140 120 A20 20 0 0 0 160 100 C160 89 169 80 180 80 H211.7',
  'M110 219.5 V180 A20 20 0 0 0 90 160 A20 20 0 0 1 70 140 V130 A20 20 0 0 0 50 110 H20.5',
]

/** The original circular river artwork, with an unhurried current. */
export function RiverFlow() {
  const id = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const motion = reducedMotionQuery()
    let visible = false
    const update = () =>
      setActive(
        visible && document.visibilityState === 'visible' && !motion.matches,
      )
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
    }
  }, [])

  return (
    <svg
      ref={ref}
      className="xt-river"
      viewBox="0 0 240 240"
      data-active={active}
      data-scene="original-waterways"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${id}-circle`}>
          <circle cx="120" cy="120" r="100" />
        </clipPath>
        <radialGradient id={`${id}-land`} cx="48%" cy="40%" r="70%">
          <stop stopColor="#173d46" />
          <stop offset="1" stopColor="#0b252f" />
        </radialGradient>
        <linearGradient
          id={`${id}-depth`}
          x1="20"
          y1="30"
          x2="215"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#20565f" />
          <stop offset="0.48" stopColor="#2d7880" />
          <stop offset="1" stopColor="#164d57" />
        </linearGradient>
      </defs>
      <circle className="xt-river-outer-ring" cx="120" cy="120" r="107" />
      <g clipPath={`url(#${id}-circle)`}>
        <circle cx="120" cy="120" r="100" fill={`url(#${id}-land)`} />
        <g className="xt-river-banks">
          {channels.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>
        <g className="xt-river-water" stroke={`url(#${id}-depth)`}>
          {channels.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>
        <g className="xt-river-currents">
          {channels.map((d, index) => (
            <path
              key={index}
              className="xt-river-motion xt-river-current"
              pathLength="100"
              d={d}
            />
          ))}
        </g>
      </g>
      <circle className="xt-river-rim" cx="120" cy="120" r="100" />
    </svg>
  )
}
