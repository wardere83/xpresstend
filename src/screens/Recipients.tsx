import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Star } from 'lucide-react'
import { Avatar, ScreenHeader } from '../components/ui'
import { useI18n } from '../i18n'
import { useTransfer } from '../state/TransferContext'
import { getCorridor, recipients, relationName } from '../data/mock'

export function Recipients() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { setRecipientId } = useTransfer()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return recipients
    return recipients.filter(
      (r) => r.name.toLowerCase().includes(q) || r.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
    )
  }, [query])

  const favourites = filtered.filter((r) => r.favourite)
  const others = filtered.filter((r) => !r.favourite)

  const open = (id: string) => {
    setRecipientId(id)
    navigate('/send')
  }

  const renderRow = (r: (typeof recipients)[number]) => {
    const corridor = getCorridor(r.corridorCode)
    return (
      <li key={r.id}>
        <button
          type="button"
          onClick={() => open(r.id)}
          className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-brand-50/70"
        >
          <Avatar name={r.name} hue={r.hue} size={44} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-bold text-ink-900">{r.name}</span>
              {r.favourite && <Star size={12} className="fill-amber-400 text-amber-400" />}
            </span>
            <span className="block truncate text-[12px] text-ink-500">
              {relationName(r, lang)} · <bdi>{r.phone}</bdi>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-500">
            <span aria-hidden="true">{corridor.flag}</span>
            <bdi>{r.wallet}</bdi>
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader
        title={t('recipients.title')}
        right={
          <button
            type="button"
            aria-label={t('recipients.add')}
            onClick={() => navigate('/send')}
            className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700"
          >
            <Plus size={18} strokeWidth={2.6} />
          </button>
        }
      />

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 shadow-[var(--shadow-card)]">
          <Search size={17} className="shrink-0 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('recipients.searchPlaceholder')}
            aria-label={t('common.search')}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-[13px] text-ink-500">{t('recipients.empty')}</p>
        )}

        {favourites.length > 0 && (
          <>
            <h2 className="mt-2 mb-2 text-[13px] font-bold text-ink-700">
              {t('recipients.favourites')}
            </h2>
            <ul className="card overflow-hidden divide-y divide-ink-200/60">
              {favourites.map(renderRow)}
            </ul>
          </>
        )}

        {others.length > 0 && (
          <>
            <h2 className="mt-5 mb-2 text-[13px] font-bold text-ink-700">{t('recipients.all')}</h2>
            <ul className="card overflow-hidden divide-y divide-ink-200/60">{others.map(renderRow)}</ul>
          </>
        )}
      </div>
    </div>
  )
}
