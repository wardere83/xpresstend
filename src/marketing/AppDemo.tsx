import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, Home, Send, Users, Clock3 } from 'lucide-react'
import './app-demo.css'
import '../admin/staff-console.css'

type Tab = 'home' | 'send' | 'people' | 'activity'
const people = [
  { name: 'Alex Demo', country: 'Kenya' },
  { name: 'Sam Demo', country: 'Somalia' },
]

/** An isolated, local-only product tour. It never calls account or transfer APIs. */
export function AppDemo() {
  const [tab, setTab] = useState<Tab>('home')
  const [amount, setAmount] = useState('100')
  const [recipient, setRecipient] = useState(people[0].name)
  const [stage, setStage] = useState<'edit' | 'review' | 'done'>('edit')
  const [completed, setCompleted] = useState<{ recipient: string; amountMinor: number } | null>(null)
  const [error, setError] = useState('')
  const amountMinor = /^\d{1,6}(\.\d{1,2})?$/.test(amount) ? Math.round(Number(amount) * 100) : 0
  const usd = (minor: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(minor / 100)
  function start() {
    setTab('send')
    setStage('edit')
    setError('')
  }
  function review(event: FormEvent) {
    event.preventDefault()
    if (amountMinor < 100 || amountMinor > 1000000) {
      setError('Enter a sample amount between $1 and $10,000.')
      return
    }
    setError('')
    setStage('review')
  }
  return (
    <main className="demo-site" lang="en" dir="ltr">
      <aside className="demo-intro">
        <Link to="/" className="demo-back">
          <ArrowLeft size={16} /> Back to website
        </Link>
        <div>
          <p className="demo-eyebrow">XpressTend / Interactive demo</p>
          <h1>
            Your next move.
            <br />
            Within reach.
          </h1>
          <p>
            Explore the app, choose a sample recipient and walk through a transfer. Everything in this tour
            stays on this screen.
          </p>
          <Link to="/register" className="demo-primary">
            Create your account <ArrowUpRight size={17} />
          </Link>
        </div>
        <p className="demo-disclosure">
          Sample data only. No account is created, no money moves, and sample amounts are not a live quote.
        </p>
      </aside>
      <section className="demo-phone" aria-label="Interactive app demo">
        <header className="demo-top">
          <Link to="/" aria-label="Exit demo">
            <ArrowLeft size={19} />
          </Link>
          <strong>XpressTend</strong>
          <span>Demo</span>
        </header>
        <div className="demo-content">
          {tab === 'home' && (
            <>
              <p className="demo-eyebrow">Welcome to your preview</p>
              <h2>
                Money moves.
                <br />
                Connection stays.
              </h2>
              <p className="demo-muted">Try the journey with sample data.</p>
              <button className="demo-send-card" onClick={start}>
                <span>
                  Send money<small>Explore a sample transfer</small>
                </span>
                <ArrowUpRight />
              </button>
              <div className="demo-mini-grid">
                <button onClick={() => setTab('people')}>
                  <Users />
                  <strong>Your people</strong>
                  <small>Choose a recipient</small>
                </button>
                <button onClick={() => setTab('activity')}>
                  <Clock3 />
                  <strong>Your activity</strong>
                  <small>Follow the journey</small>
                </button>
              </div>
              <section className="demo-note">
                <strong>Clear at every step.</strong>
                <p>See the recipient, amount and fee before completing the demo.</p>
              </section>
            </>
          )}
          {tab === 'send' && (
            <>
              <h2>
                {stage === 'edit' ? 'Send money' : stage === 'review' ? 'Review your demo' : 'Demo complete'}
              </h2>
              {stage === 'edit' ? (
                <form onSubmit={review} className="demo-form">
                  <label>
                    Recipient
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
                    Sample amount (USD)
                    <input
                      className="demo-field"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                    />
                  </label>
                  <p className="demo-muted">
                    Illustrative USD amounts. This is not a live exchange-rate quote.
                  </p>
                  {error && <p role="alert">{error}</p>}
                  <button className="demo-primary" type="submit">
                    Review demo transfer <ArrowUpRight size={17} />
                  </button>
                </form>
              ) : stage === 'review' ? (
                <>
                  <dl className="demo-summary">
                    <div>
                      <dt>Recipient</dt>
                      <dd>{recipient}</dd>
                    </div>
                    <div>
                      <dt>Sample amount</dt>
                      <dd>{usd(amountMinor)}</dd>
                    </div>
                    <div>
                      <dt>Sample fee</dt>
                      <dd>$0.99</dd>
                    </div>
                    <div>
                      <dt>Illustrative total</dt>
                      <dd>{usd(amountMinor + 99)}</dd>
                    </div>
                  </dl>
                  <p className="demo-muted">Completing this tour does not submit a transfer or charge you.</p>
                  <button
                    className="demo-primary"
                    onClick={() => {
                      setStage('done')
                      setCompleted({ recipient, amountMinor })
                    }}
                  >
                    Complete demo
                  </button>
                  <button className="demo-secondary" onClick={() => setStage('edit')}>
                    Edit sample details
                  </button>
                </>
              ) : (
                <>
                  <div className="demo-check">
                    <Check size={30} />
                  </div>
                  <p className="demo-muted">
                    You explored a sample transfer to {recipient}. No money was sent.
                  </p>
                  <button className="demo-primary" onClick={() => setTab('activity')}>
                    View demo activity
                  </button>
                  <Link className="demo-secondary" to="/register">
                    Create a real account
                  </Link>
                </>
              )}
            </>
          )}
          {tab === 'people' && (
            <>
              <h2>Your people</h2>
              <p className="demo-muted">Sample recipients for this tour.</p>
              {people.map((person) => (
                <button
                  key={person.name}
                  className="demo-person"
                  onClick={() => {
                    setRecipient(person.name)
                    start()
                  }}
                >
                  <span className="demo-avatar">{person.name[0]}</span>
                  <span>
                    <strong>{person.name}</strong>
                    <small>{person.country} · Sample recipient</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </>
          )}
          {tab === 'activity' && (
            <>
              <h2>Your activity</h2>
              <p className="demo-muted">This timeline contains demo activity only.</p>
              {completed ? (
                <article className="demo-note">
                  <strong>Demo explored · {usd(completed.amountMinor)}</strong>
                  <p>{completed.recipient} · No money sent</p>
                  <span className="demo-status">Demo complete</span>
                </article>
              ) : (
                <section className="demo-note">
                  <strong>Your tour starts here.</strong>
                  <p>Walk through a sample transfer to see its activity.</p>
                  <button className="demo-secondary" onClick={start}>
                    Try a demo transfer
                  </button>
                </section>
              )}
            </>
          )}
        </div>
        <p className="demo-mobile-disclosure">Interactive demo · Sample data · No money moves</p>
        <nav className="demo-bottom" aria-label="Demo app navigation">
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
              <span>{title}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  )
}
