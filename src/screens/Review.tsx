import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, Lock, ScanFace, ShieldCheck } from 'lucide-react'
import { PrimaryButton, ScreenHeader, SummaryRow } from '../components/ui'
import { useI18n } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { maskedWallet, usd } from '../lib/format'
import { confirmWithBiometrics, isNative, outcomeFeedback, tapFeedback } from '../native/capabilities'
import { corridorName } from '../data/mock'

type Verification = 'face' | 'pin'

export function Review() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { recipient, corridor, quote, commit } = useTransfer()

  const [method, setMethod] = useState<Verification>('face')
  const [stage, setStage] = useState<'idle' | 'verifying' | 'pin'>('idle')
  const [pin, setPin] = useState('')

  const complete = () => {
    // The one moment worth a distinct buzz: the money has moved.
    void outcomeFeedback('success')
    commit()
    navigate('/success', { replace: true })
  }

  useEffect(() => {
    if (stage !== 'verifying') return

    // On a device this is a real Face ID / fingerprint prompt before money
    // moves. In the browser there is nothing to ask, so the demo stands in with
    // a short pause rather than pretending to have verified anything.
    if (!isNative) {
      const id = window.setTimeout(complete, 1400)
      return () => window.clearTimeout(id)
    }

    let cancelled = false
    void confirmWithBiometrics(t('review.confirmReason')).then((ok) => {
      if (cancelled) return
      if (ok) complete()
      else {
        void outcomeFeedback('warning')
        setStage('pin')
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  useEffect(() => {
    if (pin.length < 4) return
    const id = window.setTimeout(complete, 450)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const start = () => {
    void tapFeedback('medium')
    setStage(method === 'face' ? 'verifying' : 'pin')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('review.title')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
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
              { id: 'face' as const, label: t('review.faceId'), icon: ScanFace },
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
      {stage === 'verifying' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-ink-900/70 backdrop-blur-sm">
          <div className="animate-pop-in flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-8">
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <ScanFace size={40} strokeWidth={1.8} />
            </span>
            <p className="text-[14px] font-bold text-ink-900">{t('review.verifying')}</p>
          </div>
        </div>
      )}

      {/* PIN pad */}
      {stage === 'pin' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => {
              setStage('idle')
              setPin('')
            }}
            className="absolute inset-0 bg-black/40"
          />
          <div className="animate-fade-up relative rounded-t-[28px] bg-white px-6 pt-5 pb-8">
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-ink-200" />
            <p className="text-center text-[14px] font-bold text-ink-900">{t('review.pin')}</p>
            <div className="my-5 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded-full transition ${
                    i < pin.length ? 'bg-brand-600' : 'bg-ink-200'
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) =>
                key === '' ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      key === 'del'
                        ? setPin((p) => p.slice(0, -1))
                        : setPin((p) => (p.length < 4 ? p + key : p))
                    }
                    aria-label={key === 'del' ? 'Delete' : key}
                    className="grid h-14 place-items-center rounded-2xl bg-canvas text-[20px] font-bold text-ink-900 transition active:scale-95 hover:bg-brand-50"
                  >
                    {key === 'del' ? <Delete size={20} /> : key}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
