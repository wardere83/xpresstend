import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { PrimaryButton, ScreenHeader, SummaryRow } from '../components/ui'
import { useI18n } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { maskedWallet, usd } from '../lib/format'
import { outcomeFeedback, tapFeedback } from '../native/capabilities'
import { corridorName } from '../data/mock'

type Verification = 'face' | 'pin'

export function Review() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { recipient, corridor, quote, commit, commitError } = useTransfer()

  const [method, setMethod] = useState<Verification>('face')
  const [stage, setStage] = useState<'idle' | 'verifying' | 'pin'>('idle')

  /**
   * Records the transfer, then shows the receipt.
   *
   * For a signed-in customer this actually creates it, so a failure must not
   * land on the success screen: it returns to the summary with the reason.
   */
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /**
   * Sends the transfer.
   *
   * Authorisation happens on the server, which requires the account password:
   * a valid session alone cannot spend from an account. The previous PIN pad
   * accepted any four digits and the browser path completed on a timer, so
   * neither authorised anything.
   */
  const complete = async (secret: string) => {
    setBusy(true)
    setAuthError(null)
    try {
      await commit(secret)
      void outcomeFeedback('success')
      navigate('/success', { replace: true })
    } catch (err) {
      void outcomeFeedback('error')
      const message = err instanceof Error ? err.message : ''
      setAuthError(/password/i.test(message) ? message : t('review.authFailed'))
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const start = () => {
    void tapFeedback('medium')
    setStage('pin')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('review.title')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        {commitError ? (
          <p role="alert" className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            {commitError}
          </p>
        ) : null}

        {/* Summary */}
        <section className="card p-4">
          <h2 className="mb-1 text-[15px] font-bold text-ink-900">{t('field.summary')}</h2>
          <SummaryRow label={t('field.youSend')} value={usd(quote.amountUsd)} />
          <SummaryRow label={t('field.fee')} value={usd(quote.fee)} />
          <div className="my-1 border-t border-ink-200/70" />
          <SummaryRow label={t('field.total')} value={usd(quote.totalUsd)} strong />
          <div className="my-1 border-t border-ink-200/70" />
          <SummaryRow label={t('field.recipientGets')} value={usd(quote.recipientUsd)} strong />
          <SummaryRow label={t('field.to')} value={recipient.name} />
          <SummaryRow
            label={t('field.mobileWallet')}
            value={<bdi>{maskedWallet(recipient.wallet, recipient.last4)}</bdi>}
          />
          <SummaryRow
            label={t('field.country')}
            value={`${corridor.flag} ${corridorName(corridor, lang)}`}
          />
          <SummaryRow label={t('field.delivery')} value={t('common.instant')} />
        </section>

        {/* Important */}
        <section className="mt-5">
          <h3 className="mb-1.5 text-[14px] font-bold text-ink-900">{t('review.important')}</h3>
          <p className="text-[12.5px] leading-relaxed text-ink-500">{t('review.importantBody')}</p>
        </section>

        {/* Security */}
        <section className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <h3 className="text-[13.5px] font-bold text-amber-900">{t('review.securityCheck')}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-800/90">
                {t('review.securityBody')}
              </p>
            </div>
          </div>
        </section>

        {/* Verification choice */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(
            [
              { id: 'pin' as const, label: t('review.pin'), icon: Lock },
            ]
          ).map(({ id, label, icon: Icon }) => {
            const active = method === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-[14px] font-bold transition ${
                  active
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-200 bg-white text-ink-500 hover:bg-canvas'
                }`}
              >
                <Icon size={18} strokeWidth={2.1} />
                {label}
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          <PrimaryButton onClick={start} disabled={stage === 'verifying'}>
            {stage === 'verifying'
              ? t('review.verifying')
              : t('review.send', { amount: usd(quote.totalUsd) })}
          </PrimaryButton>
        </div>
      </div>

      {/* Face ID overlay */}
      {stage === 'pin' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-ink-900/40">
          <div className="rounded-t-[26px] bg-white px-5 pb-8 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <Lock size={16} className="text-brand-600" />
              <h2 className="text-[15px] font-bold text-ink-900">{t('review.authorise')}</h2>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-ink-500">
              {t('review.enterPassword')}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void complete(password)
              }}
            >
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-canvas px-4 py-3.5 text-[15px] text-ink-900 outline-none ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
              />
              {authError ? (
                <p role="alert" className="mt-3 text-[13px] font-medium text-red-600">{authError}</p>
              ) : null}
              <div className="mt-5 flex gap-2">
                <PrimaryButton type="submit" disabled={busy || password.length === 0}>
                  {busy ? t('common.sending') : t('review.authorise')}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => { setStage('idle'); setPassword(''); setAuthError(null) }}
                  className="rounded-full border border-ink-200 px-5 text-[14px] font-semibold text-ink-700"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
