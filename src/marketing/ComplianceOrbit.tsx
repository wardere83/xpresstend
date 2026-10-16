import { useId, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useI18n } from '../i18n'
import { readPassage } from './siteContent'
import './compliance-orbit.css'

/** Independent orbital motion surrounds a stationary, softly flowing core. */
export function ComplianceOrbit() {
  const id = useId().replace(/:/g, '')
  const { lang } = useI18n()
  const [paused, setPaused] = useState(false)
  const label = readPassage(
    paused
      ? [
          'Play animation',
          'Reproducir animación',
          'Reproduzir animação',
          'تشغيل الحركة',
        ]
      : [
          'Pause animation',
          'Pausar animación',
          'Pausar animação',
          'إيقاف الحركة مؤقتًا',
        ],
    lang,
  )
  return (
    <div className="compliance-orbit" data-paused={paused}>
      <svg viewBox="0 0 380 380" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-core`} cx="32%" cy="24%" r="80%">
            <stop stopColor="#376f74" />
            <stop offset=".55" stopColor="#16444c" />
            <stop offset="1" stopColor="#0b2b36" />
          </radialGradient>
          <linearGradient id={`${id}-ring`} x2="1" y2="1">
            <stop stopColor="#b5ece1" stopOpacity=".8" />
            <stop offset=".55" stopColor="#66afa6" stopOpacity=".32" />
            <stop offset="1" stopColor="#92d8cb" stopOpacity=".7" />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <circle cx="190" cy="190" r="77" />
          </clipPath>
        </defs>
        {[0, 1, 2].map((ring) => (
          <g
            key={ring}
            className={`compliance-orbit-ring compliance-orbit-ring-${ring + 1}`}
          >
            <ellipse
              cx="190"
              cy="190"
              rx={169 - ring * 13}
              ry={91 + ring * 19}
              fill="none"
              stroke={`url(#${id}-ring)`}
              strokeWidth="1"
            />
            <ellipse
              cx="190"
              cy="190"
              rx={169 - ring * 13}
              ry={91 + ring * 19}
              fill="none"
              stroke="#aeebd9"
              strokeWidth="1.8"
              strokeDasharray="35 810"
              strokeLinecap="round"
              opacity=".7"
            />
            <circle cx={359 - ring * 13} cy="190" r="2.4" fill="#b5eadc" />
          </g>
        ))}
        <circle
          className="compliance-orbit-core"
          cx="190"
          cy="190"
          r="78"
          fill={`url(#${id}-core)`}
          stroke="#77b5b0"
          strokeWidth=".8"
        />
        <g
          clipPath={`url(#${id}-clip)`}
          fill="none"
          stroke="#99d8cc"
          strokeWidth="1"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              className="compliance-core-flow"
              style={{ animationDelay: `${-i * 1.8}s` }}
              d={`M90 ${124 + i * 19} C140 ${96 + i * 19}, 168 ${158 + i * 12}, 210 ${137 + i * 17} S270 ${106 + i * 21}, 300 ${133 + i * 20}`}
            />
          ))}
          <ellipse cx="190" cy="190" rx="37" ry="77" opacity=".15" />
          <path d="M190 112V268" opacity=".1" />
        </g>
      </svg>
      <button
        type="button"
        onClick={() => setPaused(!paused)}
        aria-label={label}
        aria-pressed={paused}
        className="compliance-orbit-toggle"
      >
        {paused ? (
          <Play size={14} aria-hidden="true" />
        ) : (
          <Pause size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
