import { useEffect, useId, useRef, useState } from 'react'
import { reducedMotionQuery } from '../accessibility/motion'
import './river.css'

/** A circular river habitat photograph, with a subtle visible current overlay. */
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
      data-scene="river-habitat"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${id}-circle`}>
          <circle cx="120" cy="120" r="110" />
        </clipPath>
        <filter id={`${id}-light`}>
          <feGaussianBlur stdDeviation=".3" />
        </filter>
      </defs>
      <circle className="xt-river-outer-ring" cx="120" cy="120" r="117" />
      <g clipPath={`url(#${id}-circle)`}>
        <image
          className="xt-river-photo"
          href={`${import.meta.env.BASE_URL}media/river-habitat.webp`}
          x="10"
          y="10"
          width="220"
          height="220"
          preserveAspectRatio="xMidYMid slice"
        />
        <g className="xt-river-currents" filter={`url(#${id}-light)`}>
          <path
            className="xt-river-motion xt-river-current"
            pathLength="100"
            d="M56 5 C37 45 78 75 110 104 S155 151 183 183 S205 216 232 238"
          />
          <path
            className="xt-river-motion xt-river-current"
            pathLength="100"
            d="M72 5 C49 47 92 79 124 109 S168 151 197 183 S217 213 243 233"
          />
          <path
            className="xt-river-motion xt-river-shimmer"
            pathLength="100"
            d="M45 5 C31 44 67 81 101 113 S147 159 171 193 S189 219 214 239"
          />
        </g>
      </g>
      <circle className="xt-river-rim" cx="120" cy="120" r="110" />
    </svg>
  )
}
