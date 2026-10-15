import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import './sign-in.css'

// Orion's principal stars, mapped from right ascension (hours) and declination (degrees).
// Catalog reference: https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=betelgeuse
// Reversing RA follows a sky chart viewed from Earth; these are not random decorative points.
const stars = [
  { id: 'betelgeuse', ra: 5.9195, dec: 7.407, r: 3.8 },
  { id: 'bellatrix', ra: 5.4189, dec: 6.35, r: 3.1 },
  { id: 'mintaka', ra: 5.5334, dec: -0.299, r: 2.8 },
  { id: 'alnilam', ra: 5.6036, dec: -1.202, r: 3.1 },
  { id: 'alnitak', ra: 5.6793, dec: -1.943, r: 3.1 },
  { id: 'saiph', ra: 5.7959, dec: -9.67, r: 3.1 },
  { id: 'rigel', ra: 5.2423, dec: -8.202, r: 4.1 },
]
const point = (star: (typeof stars)[number]) => ({
  x: 75 + (6.1 - star.ra) * 150 * Math.cos((star.dec * Math.PI) / 180),
  y: 35 + (10 - star.dec) * 10,
})
// Principal-star halo bounds define the visible chart, independently of the surrounding starfield.
const bounds = stars.reduce(
  (box, star) => {
    const p = point(star),
      radius = star.r * 2.5
    return {
      left: Math.min(box.left, p.x - radius),
      right: Math.max(box.right, p.x + radius),
      top: Math.min(box.top, p.y - radius),
      bottom: Math.max(box.bottom, p.y + radius),
    }
  },
  { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
)
const edges = [
  [0, 1],
  [0, 4],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [2, 6],
  [5, 6],
]
export function Constellation() {
  const id = useId().replace(/:/g, '')
  const belt = point(stars[3])
  const route = [0, 1, 2, 3, 4, 5, 6, 2, 3, 4, 0]
    .map((index, step) => {
      const p = point(stars[index])
      return `${step ? 'L' : 'M'}${p.x} ${p.y}`
    })
    .join(' ')
  return (
    <svg
      className="signin-constellation"
      viewBox="0 0 380 300"
      aria-hidden="true"
      focusable="false"
      data-star-pattern="orion"
    >
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#eafff8" stopOpacity=".95" />
          <stop offset=".14" stopColor="#3c9c89" stopOpacity=".72" />
          <stop offset=".4" stopColor="#2d8878" stopOpacity=".16" />
          <stop offset="1" stopColor="#2d8878" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-meteor`} x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#4bd1d3" stopOpacity="0" />
          <stop offset=".6" stopColor="#3c9c89" stopOpacity=".35" />
          <stop offset="1" stopColor="#146c5b" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>
      <g className="signin-starfield" fill="#4d8c80">
        {[
          [54, 49],
          [89, 108],
          [144, 37],
          [180, 80],
          [231, 58],
          [247, 141],
          [193, 191],
          [79, 227],
          [228, 253],
          [128, 269],
          [268, 212],
          [59, 166],
        ].map(([x, y], index) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={index % 3 === 0 ? '.65' : '.4'}
            opacity={index % 2 === 0 ? '.42' : '.26'}
          />
        ))}
      </g>
      {edges.map(([a, b]) => {
        const p = point(stars[a]),
          q = point(stars[b])
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="#7baea4"
            strokeWidth=".55"
            opacity=".48"
          />
        )
      })}
      <path
        className="signin-connection-loop signin-connection-glow"
        d={route}
        pathLength="1"
        fill="none"
        stroke="#3d9b86"
        strokeWidth="2.2"
        filter={`url(#${id}-soft)`}
      />
      <path
        className="signin-connection-loop"
        d={route}
        pathLength="1"
        fill="none"
        stroke="#236f5f"
        strokeWidth=".85"
      />
      {stars.map((star, index) => {
        const p = point(star)
        return (
          <g key={star.id} data-star={star.id}>
            <circle
              className="signin-star-halo"
              style={{ animationDelay: `${index * -0.7}s` }}
              cx={p.x}
              cy={p.y}
              r={star.r * 2.5}
              fill={`url(#${id}-glow)`}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={star.r * 0.44}
              fill="#237662"
              opacity=".9"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={star.r * 0.19}
              fill={star.id === 'betelgeuse' ? '#fff4dc' : '#f1fffb'}
            />
          </g>
        )
      })}
      {['one', 'two'].map((meteor) => (
        <g key={meteor} className={`signin-meteor signin-meteor-${meteor}`}>
          <path
            d={`M${belt.x - 140} ${belt.y - 11} L${belt.x} ${belt.y}`}
            stroke={`url(#${id}-meteor)`}
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d={`M${belt.x - 72} ${belt.y - 5.7} L${belt.x} ${belt.y}`}
            stroke="#4cae94"
            strokeWidth="2.4"
            opacity=".36"
            filter={`url(#${id}-soft)`}
          />
          <circle
            className="signin-meteor-head"
            cx={belt.x}
            cy={belt.y}
            r="1.7"
            fill="#146c5b"
          />
          <circle cx={belt.x} cy={belt.y} r=".65" fill="#eafff7" />
        </g>
      ))}
    </svg>
  )
}
export function SignInFrame({
  children,
  className = '',
  wide = false,
}: {
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  const frame = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (wide) return
    const host = frame.current,
      body = content.current
    if (!host || !body) return
    let disposed = false
    const align = () => {
      if (disposed) return
      const email = body.querySelector<HTMLInputElement>(
        'form input[type="email"]',
      )
      const submit = email?.form?.querySelector<HTMLButtonElement>(
        'button[type="submit"]',
      )
      const svg = host.querySelector<SVGSVGElement>('.signin-constellation')
      if (!svg) return
      // Recovery views reuse this frame, so restore CSS placement before checking controls.
      for (const property of ['width', 'height', 'top', 'left', 'right'])
        svg.style.removeProperty(property)
      if (
        !email ||
        !submit ||
        !email.form?.querySelector('input[type="password"]')
      )
        return
      // Read the responsive CSS placement before applying a uniform, form-relative scale.
      const page = host.getBoundingClientRect(),
        original = svg.getBoundingClientRect()
      const top = email.getBoundingClientRect().top,
        bottom = submit.getBoundingClientRect().bottom
      if (bottom <= top || !original.width) return
      const scale = (bottom - top) / (bounds.bottom - bounds.top)
      const previousScale = original.width / 380
      const shift = new DOMMatrixReadOnly(getComputedStyle(svg).transform).m41
      const middle = (bounds.left + bounds.right) / 2
      let left =
        original.left - page.left + middle * (previousScale - scale) - shift
      // Preserve the desktop position while keeping all principal stars visible on phones.
      if ((bounds.right - bounds.left) * scale <= page.width - 24) {
        left = Math.max(
          12 - bounds.left * scale - shift,
          Math.min(left, page.width - 12 - bounds.right * scale - shift),
        )
      }
      svg.style.width = `${380 * scale}px`
      svg.style.height = 'auto'
      svg.style.top = `${top - page.top - bounds.top * scale}px`
      svg.style.left = `${left}px`
      svg.style.right = 'auto'
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(host)
    observer.observe(body)
    const directionObserver = new MutationObserver(align)
    directionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    })
    window.addEventListener('resize', align)
    void document.fonts.ready.then(align)
    return () => {
      disposed = true
      observer.disconnect()
      directionObserver.disconnect()
      window.removeEventListener('resize', align)
    }
  }, [wide])
  return (
    <div ref={frame} className={`signin-page ${className}`}>
      <div className="signin-sky">
        <Constellation />
      </div>
      <div
        ref={content}
        className={`signin-content${wide ? ' signin-content-wide' : ''}`}
      >
        <header className="signin-header">
          <Link to="/" aria-label="XpressTend">
            <Logo height={40} />
          </Link>
          <LanguageSwitcher />
        </header>
        {children}
      </div>
    </div>
  )
}
