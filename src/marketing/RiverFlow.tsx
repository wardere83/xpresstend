import { useEffect, useId, useRef, useState } from 'react'
import './river.css'

/** A circular river habitat photograph, with a subtle visible current overlay. */
export function RiverFlow() {
  const id = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let visible = false
    const update = () => setActive(visible && document.visibilityState === 'visible')
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return (
    <svg
      ref={ref}
      className="xt-river"
      viewBox="0 0 240 240"
      data-active={active}
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
        <linearGradient id={`${id}-depth`} x1="20" y1="30" x2="215" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#20565f" />
          <stop offset="0.48" stopColor="#2d7880" />
          <stop offset="1" stopColor="#164d57" />
        </linearGradient>
      </defs>
      <circle className="xt-river-outer-ring" cx="120" cy="120" r="107" />
      <g clipPath={`url(#${id}-circle)`}>
        <image
          className="xt-river-photo"
          href={`${import.meta.env.BASE_URL}media/river-habitat.webp`}
          x="20"
          y="20"
          width="200"
          height="200"
          preserveAspectRatio="xMidYMid slice"
        />
        <g className="xt-river-currents">
          <path
            className="xt-river-motion xt-river-current"
            pathLength="100"
            d="M65 24 C40 70 95 80 115 120 S165 160 183 218"
          />
          <path
            className="xt-river-motion xt-river-current"
            pathLength="100"
            d="M80 20 C58 65 109 83 125 116 S182 163 196 218"
          />
        </g>
      </g>
      <circle className="xt-river-rim" cx="120" cy="120" r="100" />
    </svg>
  )
}
