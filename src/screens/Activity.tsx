import { useMemo, useState } from 'react'
import { ArrowUpRight, Clock } from 'lucide-react'
import { Avatar, ScreenHeader } from '../components/ui'
import { useI18n, useMirrorClass } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { getCorridor, getRecipient } from '../data/mock'
import { amount as fmtAmount, formatDate, usd } from '../lib/format'

type Filter = 'all' | 'completed' | 'pending'

export function Activity() {
  const { t } = useI18n()
  const mirror = useMirrorClass()
  const { history } = useTransfer()
  const [filter, setFilter] = useState<Filter>('all')

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t('activity.filterAll') },
    { id: 'completed', label: t('activity.filterSent') },
    { id: 'pending', label: t('activity.filterPending') },
  ]

  const visible = useMemo(
    () => (filter === 'all' ? history : history.filter((tx) => tx.status === filter)),
    [filter, history],
  )

  const monthTotal = useMemo(() => {
    const now = new Date()
    return history
      .filter((tx) => {
        const d = new Date(tx.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, tx) => sum + tx.amountUsd, 0)
  }, [history])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={t('activity.title')} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <section className="rounded-[22px] bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-[var(--shadow-float)]">
          <p className="text-[12px] font-semibold text-white/70">{t('activity.sentThisMonth')}</p>
          <p className="mt-1 text-[30px] leading-none font-extrabold">
            <bdi>{usd(monthTotal)}</bdi>
          </p>
          <p className="mt-2 text-[12px] text-white/70">
            {t('activity.transfers', { count: history.length })}
          </p>
        </section>

        <div className="mt-4 flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                filter === f.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-500 shadow-[var(--shadow-card)] hover:text-ink-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 text-center text-[13px] text-ink-500">{t('activity.empty')}</p>
        ) : (
          <ul className="card mt-4 divide-y divide-ink-200/60 overflow-hidden">
            {visible.map((tx) => {
              const r = getRecipient(tx.recipientId)
              const corridor = getCorridor(r.corridorCode)
              const done = tx.status === 'completed'
              return (
                <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={r.name} hue={r.hue} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink-900">{r.name}</p>
                    <p className="truncate text-[12px] text-ink-500">
                      {formatDate(tx.date)} · <bdi>{r.wallet}</bdi>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[14px] font-extrabold text-ink-900">
                      <bdi>{usd(tx.amountUsd)}</bdi>
                    </p>
                    <p
                      className={`flex items-center justify-end gap-1 text-[11.5px] font-semibold ${
                        done ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {done ? <ArrowUpRight size={12} className={mirror} /> : <Clock size={12} />}
                      {t(done ? 'common.completed' : 'common.pending')}
                    </p>
                    <p className="text-[10.5px] text-ink-400">
                      <bdi>
                        {fmtAmount(tx.amountUsd * corridor.rate)} {corridor.currency}
                      </bdi>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
