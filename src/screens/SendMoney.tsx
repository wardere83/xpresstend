import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownUp, ChevronRight, Lock } from 'lucide-react'
import { Avatar, PrimaryButton, ScreenHeader } from '../components/ui'
import { useI18n, useMirrorClass } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { useAccountData } from '../state/AccountData'
import { hueFor } from '../lib/view'
import { amount as fmtAmount, rate as fmtRate } from '../lib/format'

export function SendMoney() {
  const { t } = useI18n()
  const mirror = useMirrorClass()
  const navigate = useNavigate()
  const { recipients: mine, loading, error: accountError } = useAccountData()
  const { recipient, setRecipientId, corridor, quote, amountUsd, setAmountUsd, availableError, quoteReady, quoteLoading } = useTransfer()
  const [raw, setRaw] = useState(String(amountUsd || ''))
  const [pickerOpen, setPickerOpen] = useState(false)
  const parsed = Number(raw) || 0
  const amountError = parsed <= 0 || !/^\d+(?:\.\d{0,2})?$/.test(raw)
    ? 'Enter a positive amount with up to two decimal places.'
    : availableError

  const onAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setRaw(cleaned)
    setAmountUsd(Number(cleaned) || 0)
  }

  if (loading || accountError || mine.length === 0) {
    return <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('send.title')} onBack={() => navigate(-1)} />
      <div className="px-4 py-6">
        <p role={accountError ? 'alert' : undefined} className="mb-4 text-[14px] text-ink-700">
          {loading ? 'Loading your recipients…' : accountError ?? 'Add a recipient before creating a test transfer.'}
        </p>
        {!loading && !accountError && <PrimaryButton onClick={() => navigate('/recipients')}>{t('recipients.add')}</PrimaryButton>}
      </div>
    </div>
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('send.title')} onBack={() => navigate(-1)} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <button type="button" onClick={() => setPickerOpen(true)}
          className="card flex w-full items-center gap-3 p-3.5 text-start transition active:scale-[0.99]">
          <Avatar name={recipient.name} hue={recipient.hue} size={42} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-bold text-ink-900">{recipient.name}</span>
            <span className="block truncate text-[12px] text-ink-500"><bdi>{recipient.phone}</bdi> · <bdi>{recipient.wallet}</bdi></span>
          </span>
          <span className="text-[12px] font-semibold text-brand-600">{t('send.changeRecipient')}</span>
          <ChevronRight size={16} className={`text-ink-500 ${mirror}`} />
        </button>

        <p className="mt-5 mb-2 text-[13px] font-bold text-ink-700">{t('send.from')}</p>
        <div className="card p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[22px]" aria-hidden="true">🇺🇸</span>
            <span className="text-[13px] font-bold text-ink-700"><bdi>USD · US Dollar</bdi></span>
          </div>
          <div className="mt-2 flex items-baseline gap-1" dir="ltr">
            <span className="text-[26px] font-semibold text-ink-900">$</span>
            <input value={raw} onChange={(e) => onAmountChange(e.target.value)} inputMode="decimal"
              aria-label={t('field.youSend')}
              className="w-full min-w-0 bg-transparent text-[30px] font-semibold tracking-tight text-ink-900 outline-none" />
          </div>
          <p className="mt-1 text-[12px] text-ink-500">Test funding only. No bank or card will be charged.</p>
        </div>

        <div className="relative -my-2 flex justify-center">
          <span className="grid h-9 w-9 place-items-center rounded-full border-4 border-canvas bg-brand-600 text-white"><ArrowDownUp size={15} strokeWidth={2.4} /></span>
        </div>

        <p className="mt-3 mb-2 text-[13px] font-bold text-ink-700">{t('send.toGets')}</p>
        <div className="card p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[22px]" aria-hidden="true">{corridor.flag}</span>
            <span className="text-[13px] font-bold text-ink-700">
              <bdi>{corridor.currency ? <>{corridor.currency} · {corridor.currencyName}</> : 'Choose a recipient for a test quote'}</bdi>
            </span>
          </div>
          <p className="mt-2 text-[30px] font-semibold tracking-tight text-ink-900"><bdi>{quoteReady ? fmtAmount(quote.recipientLocal) : '—'}</bdi></p>
          <p className="mt-1 text-[12px] text-ink-500">{t('field.estimated')}</p>
        </div>

        {quoteReady && corridor.currency !== 'USD' && <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-[12px] font-semibold text-brand-700">{t('field.exchangeRate')}</span>
          <span className="text-[12px] font-bold text-brand-700"><bdi>1 USD = {fmtRate(corridor.rate)} {corridor.currency}</bdi></span>
        </div>}

        {amountError && <p className="mt-3 rounded-xl bg-alert-soft px-4 py-3 text-[12px] font-semibold text-alert">{amountError}</p>}

        <p className="mt-6 mb-2 text-[13px] font-bold text-ink-700">{t('field.paymentMethod')}</p>
        <div className="card px-4 py-4 text-[13px] text-ink-700">Payment methods are unavailable. This test will not charge a bank or card.</div>

        <div className="mt-6">
          <PrimaryButton disabled={!!amountError || !quoteReady} onClick={() => navigate('/review')}>
            {quoteLoading ? 'Getting a test quote…' : t('common.continue')}
          </PrimaryButton>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-ink-500"><Lock size={12} />{t('common.secure')}</p>
        </div>
      </div>

      {pickerOpen && <div className="absolute inset-0 z-40 flex flex-col justify-end">
        <button type="button" aria-label={t('common.close')} onClick={() => setPickerOpen(false)} className="absolute inset-0 bg-brand-600/40" />
        <div className="animate-fade-up relative max-h-[70%] overflow-y-auto no-scrollbar rounded-t-[28px] bg-white pb-6">
          <div className="sticky top-0 bg-white px-4 pt-4 pb-2">
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ink-200" />
            <h2 className="text-[15px] font-bold text-ink-900">{t('send.chooseRecipient')}</h2>
          </div>
          <ul>{mine.map((r) => <li key={r.id}>
            <button type="button" onClick={() => { setRecipientId(r.id); setPickerOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-brand-50/70">
              <Avatar name={r.full_name} hue={hueFor(r.full_name)} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ink-900">{r.full_name}</span>
                <span className="block truncate text-[12px] text-ink-500">{r.relationship ?? r.country} · <bdi>{r.phone ?? r.bank_name ?? ''}</bdi></span>
              </span>
              {r.id === recipient.id && <span aria-hidden="true" className="text-brand-600">✓</span>}
            </button>
          </li>)}</ul>
        </div>
      </div>}
    </div>
  )
}
