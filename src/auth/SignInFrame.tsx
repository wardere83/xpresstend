import { useId, type ReactNode } from 'react'
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
          <stop stopColor="#358f83" stopOpacity=".55" />
          <stop offset="1" stopColor="#358f83" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-meteor`}>
          <stop stopColor="#368d80" stopOpacity="0" />
          <stop offset="1" stopColor="#267e70" />
        </linearGradient>
      </defs>
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
            strokeWidth=".6"
            opacity=".5"
          />
        )
      })}
      {stars.map((star) => {
        const p = point(star)
        return (
          <g key={star.id} data-star={star.id}>
            <circle cx={p.x} cy={p.y} r={star.r * 4} fill={`url(#${id}-glow)`} />
            <circle cx={p.x} cy={p.y} r={star.r * 0.45} fill="#267d70" />
            <path
              d={`M${p.x - star.r * 1.5} ${p.y}h${star.r * 3} M${p.x} ${p.y - star.r * 1.5}v${star.r * 3}`}
              stroke="#398c7d"
              strokeWidth=".55"
            />
          </g>
        )
      })}
      <g className="signin-meteor signin-meteor-one">
        <path d="M10 15 L95 65" stroke={`url(#${id}-meteor)`} strokeWidth="1.4" />
        <circle cx="95" cy="65" r="1.5" fill="#277d70" />
      </g>
      <g className="signin-meteor signin-meteor-two">
        <path d="M190 10 L265 55" stroke={`url(#${id}-meteor)`} strokeWidth="1.2" />
        <circle cx="265" cy="55" r="1.3" fill="#277d70" />
      </g>
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
  return (
    <div className={`signin-page ${className}`}>
      <div className="signin-sky">
        <Constellation />
      </div>
      <div className={`signin-content${wide ? ' signin-content-wide' : ''}`}>
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
