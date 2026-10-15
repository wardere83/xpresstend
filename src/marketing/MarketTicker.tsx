import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { reducedMotionQuery } from '../accessibility/motion'
import { useI18n } from '../i18n'
import { readPassage } from './siteContent'
import './market-ticker.css'

export function MarketTicker() {
  const { lang } = useI18n()
  const frame = useRef<HTMLIFrameElement>(null)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(() => reducedMotionQuery().matches)
  const [ready, setReady] = useState(false)
  const stopped = paused || reduced
  const sendMotion = () =>
    frame.current?.contentWindow?.postMessage(
      { type: 'xpresstend:market-motion', paused: stopped },
      '*',
    )
  useEffect(() => {
    const query = reducedMotionQuery()
    const changed = () => setReduced(query.matches)
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  }, [])
  useEffect(() => {
    sendMotion()
  })
  useEffect(() => {
    const loaded = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === 'null' &&
        event.data?.type === 'xpresstend:market-ready'
      )
        setReady(true)
    }
    window.addEventListener('message', loaded)
    return () => window.removeEventListener('message', loaded)
  }, [])
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
      'DXY reference · CFD',
      'Referencia DXY · CFD',
      'Referência DXY · CFD',
      'مرجع DXY · عقد فروقات',
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
      <iframe
        ref={frame}
        title={`${name} — TradingView`}
        src={`${import.meta.env.BASE_URL}market/dollar-index.html?lang=${lang === 'pt-BR' ? 'pt' : lang}`}
        className="market-ticker-frame"
        onLoad={sendMotion}
        referrerPolicy="strict-origin"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
      <button
        type="button"
        className="market-ticker-pause"
        aria-label={action}
        aria-pressed={stopped}
        disabled={reduced}
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
