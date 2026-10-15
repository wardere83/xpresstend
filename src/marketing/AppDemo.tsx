import { useI18n } from '../i18n'
import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Home,
  Send,
  Users,
  Clock3,
} from 'lucide-react'
import { demoPeople as people } from './demoPeople'
import './app-demo.css'
import '../admin/staff-console.css'
type Tab = 'home' | 'send' | 'people' | 'activity'
/** An isolated, local-only product tour. It never calls account or transfer APIs. */
export function AppDemo() {
  const p = useInterfaceCopy()
  const { lang, dir } = useI18n()
  const [tab, setTab] = useState<Tab>('home')
  const content = useRef<HTMLDivElement>(null)
  const firstScreen = useRef(true)
  const [amount, setAmount] = useState('100')
  const [recipient, setRecipient] = useState<string>(people[0].name)
  const [stage, setStage] = useState<'edit' | 'review' | 'done'>('edit')
  const [completed, setCompleted] = useState<{
    recipient: string
    amountMinor: number
  } | null>(null)
  const [error, setError] = useState('')
  const amountMinor = /^\d{1,6}(\.\d{1,2})?$/.test(amount)
    ? Math.round(Number(amount) * 100)
    : 0
  const usd = (minor: number) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' }).format(
      minor / 100,
    )
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0
    if (firstScreen.current) {
      firstScreen.current = false
      return
    }
    content.current
      ?.querySelector<HTMLElement>('h2')
      ?.focus({ preventScroll: true })
  }, [tab, stage])
  function start() {
    setTab('send')
    setStage('edit')
    setError('')
  }
  function review(event: FormEvent) {
    event.preventDefault()
    if (amountMinor < 100 || amountMinor > 1000000) {
      setError(p('Enter a sample amount between $1 and $10,000.'))
      return
    }
    setError('')
    setStage('review')
  }
  return (
    <main className="demo-site" lang={lang} dir={dir}>
      <aside className="demo-intro">
        <Link to="/" className="demo-back">
          <ArrowLeft size={16} />
          {p('Back to website')}
        </Link>
        <div>
          <p className="demo-eyebrow">{p('XpressTend / Interactive demo')}</p>
          <h1>
            {p('Your next move.')}
            <br />
            {p('Within reach.')}
          </h1>
          <p>
            {p(
              'Explore the app, choose a sample recipient and walk through a transfer. Everything in this tour stays on this screen.',
            )}
          </p>
          <Link to="/register" className="demo-primary">
            {p('Create your account')}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <p className="demo-disclosure">
          {p(
            'Sample data only. No account is created, no money moves, and sample amounts are not a live quote.',
          )}
        </p>
      </aside>
      <section className="demo-phone" aria-label={p('Interactive app demo')}>
        <header className="demo-top">
          <Link to="/" aria-label={p('Exit demo')}>
            <ArrowLeft size={19} />
          </Link>
          <strong>XpressTend</strong>
          <span>{p('Demo')}</span>
        </header>
        <div className="demo-content" ref={content}>
          <div
            className="demo-screen"
            key={`${tab}-${tab === 'send' ? stage : 'view'}`}
          >
            {tab === 'home' && (
              <>
                <p className="demo-eyebrow">{p('Welcome to your preview')}</p>
                <h2 tabIndex={-1}>
                  {p('Money moves.')}
                  <br />
                  {p('Connection stays.')}
                </h2>
                <p className="demo-muted">
                  {p('Try the journey with sample data.')}
                </p>
                <button className="demo-send-card" onClick={start}>
                  <span>
                    {p('Send money')}
                    <small>{p('Explore a sample transfer')}</small>
                  </span>
                  <ArrowUpRight />
                </button>
                <div className="demo-mini-grid">
                  <button onClick={() => setTab('people')}>
                    <Users />
                    <strong>{p('Your people')}</strong>
                    <small>{p('Choose a recipient')}</small>
                  </button>
                  <button onClick={() => setTab('activity')}>
                    <Clock3 />
                    <strong>{p('Your activity')}</strong>
                    <small>{p('Follow the journey')}</small>
                  </button>
                </div>
                <section className="demo-note">
                  <strong>{p('Clear at every step.')}</strong>
                  <p>
                    {p(
                      'See the recipient, amount and fee before completing the demo.',
                    )}
                  </p>
                </section>
              </>
            )}
            {tab === 'send' && (
              <>
                <h2 tabIndex={-1}>
                  {stage === 'edit'
                    ? p('Send money')
                    : stage === 'review'
                      ? p('Review your demo')
                      : p('Demo complete')}
                </h2>
                <ol className="demo-progress">
                  {(['edit', 'review', 'done'] as const).map((step, index) => (
                    <li
                      key={step}
                      aria-current={stage === step ? 'step' : undefined}
                      data-complete={
                        index < ['edit', 'review', 'done'].indexOf(stage)
                      }
                    >
                      <span aria-hidden="true">
                        {index < ['edit', 'review', 'done'].indexOf(stage) ? (
                          <Check size={14} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <strong>
                        {p(
                          step === 'edit'
                            ? 'Send'
                            : step === 'review'
                              ? 'Review your demo'
                              : 'Demo complete',
                        )}
                      </strong>
                    </li>
                  ))}
                </ol>
                {stage === 'edit' ? (
                  <form onSubmit={review} className="demo-form">
                    <label>
                      {p('Recipient')}
                      <select
                        className="demo-field"
                        value={recipient}
                        onChange={(event) => setRecipient(event.target.value)}
                      >
                        {people.map((person) => (
                          <option key={person.name}>{person.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {p('Sample amount (USD)')}
                      <input
                        className="demo-field"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => {
                          setAmount(event.target.value)
                          if (error) setError('')
                        }}
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                          error
                            ? 'demo-amount-note demo-amount-error'
                            : 'demo-amount-note'
                        }
                        autoComplete="off"
                      />
                    </label>
                    <p className="demo-muted" id="demo-amount-note">
                      {p(
                        'Illustrative USD amounts. This is not a live exchange-rate quote.',
                      )}
                    </p>
                    <div
                      className="demo-estimate"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <span>
                        {p('Sample fee')}
                        <strong>{usd(99)}</strong>
                      </span>
                      <span>
                        {p('Illustrative total')}
                        <strong>
                          {amountMinor >= 100 && amountMinor <= 1000000
                            ? usd(amountMinor + 99)
                            : '—'}
                        </strong>
                      </span>
                    </div>
                    {error && (
                      <p id="demo-amount-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button className="demo-primary" type="submit">
                      {p('Review demo transfer')}
                      <ArrowUpRight size={17} />
                    </button>
                  </form>
                ) : stage === 'review' ? (
                  <>
                    <dl className="demo-summary">
                      <div>
                        <dt>{p('Recipient')}</dt>
                        <dd>{recipient}</dd>
                      </div>
                      <div>
                        <dt>{p('Sample amount')}</dt>
                        <dd>{usd(amountMinor)}</dd>
                      </div>
                      <div>
                        <dt>{p('Sample fee')}</dt>
                        <dd>{usd(99)}</dd>
                      </div>
                      <div>
                        <dt>{p('Illustrative total')}</dt>
                        <dd>{usd(amountMinor + 99)}</dd>
                      </div>
                    </dl>
                    <p className="demo-muted">
                      {p(
                        'Completing this tour does not submit a transfer or charge you.',
                      )}
                    </p>
                    <button
                      className="demo-primary"
                      onClick={() => {
                        setStage('done')
                        setCompleted({ recipient, amountMinor })
                      }}
                    >
                      {p('Complete demo')}
                    </button>
                    <button
                      className="demo-secondary"
                      onClick={() => setStage('edit')}
                    >
                      {p('Edit sample details')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="demo-check">
                      <Check size={30} />
                    </div>
                    <p className="demo-muted">
                      {p(
                        'You explored a sample transfer to {recipient}. No money was sent.',
                        { recipient },
                      )}
                    </p>
                    <button
                      className="demo-primary"
                      onClick={() => setTab('activity')}
                    >
                      {p('View demo activity')}
                    </button>
                    <Link className="demo-secondary" to="/register">
                      {p('Create a real account')}
                    </Link>
                  </>
                )}
              </>
            )}
            {tab === 'people' && (
              <>
                <h2 tabIndex={-1}>{p('Your people')}</h2>
                <p className="demo-muted">
                  {p('Sample recipients for this tour.')}
                </p>
                {people.map((person) => (
                  <button
                    key={person.name}
                    className="demo-person"
                    onClick={() => {
                      setRecipient(person.name)
                      start()
                    }}
                  >
                    <span className="demo-avatar">
                      {person.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <span>
                      <strong>{person.name}</strong>
                      <small>
                        {new Intl.DisplayNames([lang], { type: 'region' }).of(
                          person.country,
                        )}{' '}
                        · {p('Sample recipient')}
                      </small>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </>
            )}
            {tab === 'activity' && (
              <>
                <h2 tabIndex={-1}>{p('Your activity')}</h2>
                <p className="demo-muted">
                  {p('This timeline contains demo activity only.')}
                </p>
                {completed ? (
                  <article className="demo-note">
                    <strong>
                      {p('Demo explored')} · {usd(completed.amountMinor)}
                    </strong>
                    <p>
                      {completed.recipient} · {p('No money sent')}
                    </p>
                    <span className="demo-status">{p('Demo complete')}</span>
                  </article>
                ) : (
                  <section className="demo-note">
                    <strong>{p('Your tour starts here.')}</strong>
                    <p>
                      {p('Walk through a sample transfer to see its activity.')}
                    </p>
                    <button className="demo-secondary" onClick={start}>
                      {p('Try a demo transfer')}
                    </button>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
        <p className="demo-mobile-disclosure">
          {p('Interactive demo \u00B7 Sample data \u00B7 No money moves')}
        </p>
        <nav className="demo-bottom" aria-label={p('Demo app navigation')}>
          {(
            [
              { key: 'home', title: 'Home', Icon: Home },
              { key: 'send', title: 'Send', Icon: Send },
              { key: 'people', title: 'People', Icon: Users },
              { key: 'activity', title: 'Activity', Icon: Clock3 },
            ] as const
          ).map(({ key, title, Icon }) => (
            <button
              key={key}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => {
                setTab(key)
                if (key === 'send') {
                  setStage('edit')
                  setError('')
                }
              }}
            >
              <Icon size={20} />
              <span>{p(title)}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  )
}
