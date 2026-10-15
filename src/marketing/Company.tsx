import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../i18n'
import { ContentSections, InstitutionalActions, Shell } from './PageShell'
import { readPassage, siteLabels, sitePages } from './siteContent'
import { ComplianceOrbit } from './ComplianceOrbit'

function SanctionsStatus() {
  const { lang } = useI18n()
  const [status, setStatus] = useState<{
    ready: boolean
    checkedAt: string | null
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true)
    try {
      const response = await api.get<{
        ready: boolean
        checkedAt: string | null
      }>('/compliance/sanctions-status')
      if (signal?.aborted) return
      setStatus(response)
      setUnavailable(false)
    } catch {
      if (!signal?.aborted) {
        setStatus(null)
        setUnavailable(true)
      }
    } finally {
      if (!signal?.aborted) setBusy(false)
    }
  }, [])
  useEffect(() => {
    const c = new AbortController()
    void load(c.signal)
    return () => c.abort()
  }, [load])
  return (
    <div className="institutional-status">
      <div role="status">
        <strong>{readPassage(siteLabels.status, lang)}</strong>
        <p>
          {readPassage(
            busy
              ? siteLabels.checking
              : status?.ready
                ? siteLabels.ready
                : unavailable || status
                  ? siteLabels.unavailable
                  : siteLabels.checking,
            lang,
          )}
        </p>
        {status?.ready && status.checkedAt && (
          <small>
            {readPassage(siteLabels.source, lang)}:{' '}
            <time dateTime={status.checkedAt}>
              {new Intl.DateTimeFormat(lang, {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              }).format(new Date(status.checkedAt))}{' '}
              UTC
            </time>
          </small>
        )}
      </div>
      <button disabled={busy} onClick={() => void load()}>
        {readPassage(siteLabels.refresh, lang)}
      </button>
    </div>
  )
}
function CompanyPage({ name }: { name: keyof typeof sitePages }) {
  const { lang } = useI18n()
  const page = sitePages[name]
  return (
    <Shell
      title={readPassage(page.title, lang)}
      intro={readPassage(page.intro, lang)}
      visual={name === 'compliance' ? <ComplianceOrbit /> : undefined}
    >
      <InstitutionalActions />
      <ContentSections
        page={page}
        extra={(id) =>
          name === 'compliance' && id === 'screening' ? (
            <SanctionsStatus />
          ) : null
        }
      />
    </Shell>
  )
}
export function Company() {
  return <CompanyPage name="company" />
}
export function Compliance() {
  return <CompanyPage name="compliance" />
}
export function Security() {
  return <CompanyPage name="security" />
}
