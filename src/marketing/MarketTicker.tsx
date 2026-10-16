import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { reducedMotionQuery } from '../accessibility/motion'
import { useI18n } from '../i18n'
import { readPassage } from './siteContent'
import './market-ticker.css'

const QUOTE_ORIGIN = 'https://xpresstend-market.shrill-king-ef4e.workers.dev'
// Match the market document's exact frame-ancestors policy in api/src/headers.ts.
const APP_ORIGINS = new Set([
  'https://xpresstend.com',
  'https://www.xpresstend.com',
  'https://xpresstend.shrill-king-ef4e.workers.dev',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5179',
])

export function MarketTicker() {
  const { lang } = useI18n()
  const frame = useRef<HTMLIFrameElement>(null)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(() => reducedMotionQuery().matches)
  const [ready, setReady] = useState(false)
  const stopped = paused || reduced
  const frameOrigin = QUOTE_ORIGIN
  const canEmbed = APP_ORIGINS.has(window.location.origin)
  const sendMotion = useCallback(
    () =>
      frame.current?.contentWindow?.postMessage(
        { type: 'xpresstend:market-motion', paused: stopped },
        frameOrigin,
      ),
    [frameOrigin, stopped],
  )
  useEffect(() => {
    const query = reducedMotionQuery()
    const changed = () => setReduced(query.matches)
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  }, [])
  useEffect(sendMotion, [sendMotion])
  useEffect(() => {
    const loaded = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === frameOrigin &&
        event.data?.type === 'xpresstend:market-ready'
      ) {
        setReady(true)
        sendMotion()
      }
    }
    window.addEventListener('message', loaded)
    return () => window.removeEventListener('message', loaded)
  }, [frameOrigin, sendMotion])
  const name = readPassage(
    [
      'U.S. Dollar Index',
      'Índice del dólar estadounidense',
      'Índice do dólar americano',
      'مؤشر الدولار الأمريكي',
    ],
    lang,
  )
  const reference = readPassage(
    [
      'USDX reference · Pepperstone CFD',
      'Referencia USDX · CFD de Pepperstone',
      'Referência USDX · CFD da Pepperstone',
      'مرجع USDX · عقد فروقات Pepperstone',
    ],
    lang,
  )
  const action = readPassage(
    stopped
      ? [
          'Play ticker',
          'Reproducir cotizaciones',
          'Reproduzir cotações',
          'تشغيل الشريط',
        ]
      : [
          'Pause ticker',
          'Pausar cotizaciones',
          'Pausar cotações',
          'إيقاف الشريط مؤقتًا',
        ],
    lang,
  )
  return (
    <section className="market-ticker" aria-label={name} data-ready={ready}>
      <div className="market-ticker-label">
        <strong>{name}</strong>
        <span>{reference}</span>
      </div>
      {canEmbed ? (
        <iframe
          ref={frame}
          title={`${name} — TradingView`}
          src={`${frameOrigin}/dollar-index.html?lang=${lang === 'pt-BR' ? 'pt' : lang}`}
          className="market-ticker-frame"
          onLoad={sendMotion}
          referrerPolicy="strict-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <a
          className="market-ticker-fallback"
          href="https://www.tradingview.com/symbols/PEPPERSTONE-USDX/"
          target="_blank"
          rel="noopener noreferrer"
        >
          USDX · TradingView
        </a>
      )}
      <button
        type="button"
        className="market-ticker-pause"
        aria-label={action}
        aria-pressed={stopped}
        disabled={reduced || !canEmbed}
        onClick={() => setPaused(!paused)}
      >
        {stopped ? (
          <Play size={14} aria-hidden="true" />
        ) : (
          <Pause size={14} aria-hidden="true" />
        )}
      </button>
    </section>
  )
}
