import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  Mail,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { reducedMotionQuery } from '../accessibility/motion'
import { useAppTourCopy } from './appTourCopy'
import { demoPeople } from './demoPeople'
import './app-tour.css'
const stages = [
  'signin',
  'document',
  'selfie',
  'checks',
  'ready',
  'home',
  'send',
  'review',
  'complete',
] as const
const duration = [3200, 3400, 3200, 3400, 2600, 2800, 3600, 3400, 3600]
/** A local, illustrated product walkthrough; it never collects identity data or calls account APIs. */
export function AppTour() {
  const copy = useAppTourCopy()
  const { lang, dir } = useI18n()
  const root = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reduced, setReduced] = useState(() => reducedMotionQuery().matches)
  const [visible, setVisible] = useState(false)
  const [foreground, setForeground] = useState(!document.hidden)
  useEffect(() => {
    const query = reducedMotionQuery()
    const change = () => setReduced(query.matches)
    query.addEventListener('change', change)
    const visibility = () => setForeground(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    )
    if (root.current) observer.observe(root.current)
    return () => {
      observer.disconnect()
      query.removeEventListener('change', change)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  const playing = !paused && !focused && !reduced && visible && foreground
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(
      () => setStep((s) => (s + 1) % stages.length),
      duration[step],
    )
    return () => window.clearTimeout(timer)
  }, [playing, step])
  const stage = stages[step]
  const usd = (n: number) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' }).format(
      n,
    )
  const advance = () => {
    setPaused(true)
    setStep((s) => (s + 1) % stages.length)
  }
  const action =
    stage === 'signin'
      ? copy.signin
      : stage === 'document'
        ? copy.capture
        : stage === 'selfie'
          ? copy.selfie
          : stage === 'ready'
            ? copy.continue
            : stage === 'home'
              ? copy.send
              : stage === 'send'
                ? copy.review
                : stage === 'review'
                  ? copy.confirm
                  : copy.next
  const summary = (
    <dl className="tour-summary">
      <div>
        <dt>{copy.recipient}</dt>
        <dd>{demoPeople[1].name}</dd>
      </div>
      <div>
        <dt>{copy.amount}</dt>
        <dd>{usd(125.5)}</dd>
      </div>
      <div>
        <dt>{copy.fee}</dt>
        <dd>{usd(0.99)}</dd>
      </div>
      <div>
        <dt>{copy.total}</dt>
        <dd>{usd(126.49)}</dd>
      </div>
    </dl>
  )
  return (
    <div
      ref={root}
      className="app-tour"
      dir={dir}
      data-tour-step={stage}
      data-playing={playing}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
      role="group"
      aria-label={copy.label}
    >
      <div className="app-preview-top">
        <strong>XpressTend</strong>
        <span>{copy.demo}</span>
      </div>
      <div className="tour-screen" key={stage}>
        <div className="tour-progress" aria-hidden="true">
          {stages.map((s, i) => (
            <span key={s} data-current={i === step} data-done={i < step} />
          ))}
        </div>
        <p className="tour-step-name">
          {String(step + 1).padStart(2, '0')} / 09
        </p>
        <h3>{copy[stage]}</h3>
        <div className="tour-illustration" aria-hidden="true">
          {stage === 'signin' && (
            <>
              <p>{copy.signinBody}</p>
              <div className="tour-field">
                <Mail size={16} />
                <span>sam@example.com</span>
              </div>
              <div className="tour-field">
                <LockKeyhole size={16} />
                <span>••••••••••</span>
              </div>
            </>
          )}
          {stage === 'document' && (
            <>
              <p>{copy.documentBody}</p>
              <div className="tour-id">
                <span>{copy.sampleId}</span>
                <div>
                  <UserRound size={44} />
                  <strong>
                    Sam Erikson<small>•••• 4821</small>
                  </strong>
                </div>
                <i />
                <i />
                <div className="tour-scan" />
              </div>
            </>
          )}
          {stage === 'selfie' && (
            <>
              <p>{copy.selfieBody}</p>
              <div className="tour-face">
                <UserRound size={96} strokeWidth={1.1} />
                <ScanFace
                  className="tour-face-frame"
                  size={164}
                  strokeWidth={0.7}
                />
                <span className="tour-scan" />
              </div>
            </>
          )}
          {stage === 'checks' && (
            <>
              <p>{copy.checksBody}</p>
              <div className="tour-checks">
                {[copy.identity, copy.liveness, copy.sanctions].map((label) => (
                  <div key={label}>
                    <Check size={17} />
                    <span>
                      {label}
                      <small>{copy.passed}</small>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {stage === 'ready' && (
            <>
              <div className="tour-seal">
                <ShieldCheck size={55} strokeWidth={1.2} />
              </div>
              <p>{copy.readyBody}</p>
            </>
          )}
          {stage === 'home' && (
            <>
              <p>{copy.homeBody}</p>
              <div className="tour-home-card">
                <span>{copy.send}</span>
                <ArrowRight size={23} />
                <strong>{demoPeople[1].name}</strong>
                <small>{copy.recipient}</small>
              </div>
            </>
          )}
          {stage === 'send' && (
            <>
              <p className="tour-recipient">
                {copy.recipient}
                <strong>
                  <span>FB</span>
                  {demoPeople[1].name}
                </strong>
              </p>
              <div className="tour-amount">
                <span>{copy.amount}</span>
                <strong>{usd(125.5)}</strong>
                <small>USD</small>
              </div>
            </>
          )}
          {stage === 'review' && (
            <>
              <p>{copy.reviewBody}</p>
              {summary}
            </>
          )}
          {stage === 'complete' && (
            <>
              <div className="tour-seal">
                <Check size={45} />
              </div>
              <strong className="tour-receipt-amount">{usd(125.5)}</strong>
              <p>{demoPeople[1].name}</p>
              <p>{copy.completeBody}</p>
            </>
          )}
        </div>
        {stage !== 'checks' && stage !== 'complete' && (
          <button className="tour-action" onClick={advance}>
            {action}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
      <p className="tour-disclosure">{copy.sample}</p>
      <p className="sr-only" role="status">
        {paused ? `${step + 1} / 09 · ${copy[stage]}` : ''}
      </p>
      <div className="tour-controls">
        <button
          onClick={() => setPaused((p) => !p)}
          disabled={reduced}
          aria-label={reduced ? copy.motion : paused ? copy.play : copy.pause}
          title={reduced ? copy.motion : paused ? copy.play : copy.pause}
        >
          {paused || reduced ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button onClick={advance} aria-label={copy.next} title={copy.next}>
          <ArrowRight size={17} />
        </button>
        <button
          onClick={() => {
            setStep(0)
            setPaused(false)
          }}
          aria-label={copy.restart}
          title={copy.restart}
        >
          <RotateCcw size={16} />
        </button>
        <span aria-hidden="true">{String(step + 1).padStart(2, '0')} / 09</span>
      </div>
    </div>
  )
}
