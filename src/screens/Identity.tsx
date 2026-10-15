import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, ScanFace, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import { ScreenHeader } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
export function Identity() {
  const p = useInterfaceCopy()
  const navigate = useNavigate(),
    { refresh: refreshAccount } = useAuth()
  const [configured, setConfigured] = useState(false),
    [status, setStatus] = useState('unverified'),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [link, setLink] = useState('')
  const load = useCallback(async () => {
    try {
      const r = await api.get<{
        configured: boolean
        session: {
          status: string
        } | null
      }>('/identity')
      setConfigured(r.configured)
      setStatus(r.session?.status ?? 'unverified')
    } catch {
      setError(p('Cannot load verification status. Please retry.'))
    }
  }, [p])
  useEffect(() => {
    void load()
  }, [load])
  const refresh = useCallback(async () => {
    try {
      const r = await api.post<{
        status: string
      }>('/identity/refresh')
      setStatus(r.status)
      if (r.status === 'verified') await refreshAccount()
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : p('Unable to check verification.'))
    }
  }, [refreshAccount, p])
  useEffect(() => {
    if (status !== 'pending' || !configured) return
    const timer = setInterval(() => void refresh(), 25000)
    return () => clearInterval(timer)
  }, [status, configured, refresh])
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ScreenHeader title={p('Verify your identity')} onBack={() => navigate('/profile')} />
      <div className="flex-1 overflow-auto px-5 pb-8">
        <div className="rounded-3xl bg-ink-900 p-6 text-white">
          <Fingerprint size={36} className="text-emerald-300" />
          <h1 className="mt-5 text-2xl font-semibold">{p('A secure start.')}</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            {p('Verify your government ID and complete a live selfie before sending money.')}
          </p>
          <p role="status" className="mt-5 text-sm font-semibold">
            {p('Status:')}
            {p(status)}
          </p>
        </div>
        <div className="my-6 space-y-5">
          {[
            {
              icon: ShieldCheck,
              title: 'Government-issued ID',
              body: 'Use a valid, unexpired identity document. Your legal name must match your XpressTend account.',
            },
            {
              icon: ScanFace,
              title: 'Live selfie check',
              body: 'Follow the camera prompts to confirm you are present and match the person on the ID.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <Icon size={22} className="shrink-0 text-brand-700" />
              <div>
                <h2 className="text-sm font-semibold">{p(title)}</h2>
                <p className="mt-1 text-xs leading-5 text-ink-500">{p(body)}</p>
              </div>
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="my-4 rounded-xl bg-alert-soft p-3 text-sm text-alert">
            {error}
          </p>
        )}
        {!configured && (
          <p className="rounded-xl bg-wait-soft p-4 text-sm">
            {p(
              'Identity verification is being activated. Transfers remain unavailable until verification is complete.',
            )}
          </p>
        )}
        {configured && status !== 'verified' && (
          <>
            <label className="my-4 flex items-start gap-3 text-xs leading-5">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                {p(
                  'I agree to submit my identity document and biometric selfie to Persona for identity verification. Review',
                )}{' '}
                <a
                  className="underline"
                  href="https://withpersona.com/legal/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                >
                  {p('Persona\u2019s privacy policy')}
                </a>{' '}
                {p('and XpressTend\u2019s')}{' '}
                <a href="/#/privacy" className="underline">
                  {p('privacy policy')}
                </a>{' '}
                {p('before continuing.')}
              </span>
            </label>
            <button
              className="w-full rounded-xl bg-brand-700 p-3 font-semibold text-white disabled:opacity-40"
              disabled={!consent || busy}
              onClick={() => {
                setBusy(true)
                setError('')
                void api
                  .post<{
                    url: string
                  }>('/identity/start', { consent: true })
                  .then((r) => {
                    setLink(r.url)
                    setStatus('pending')
                  })
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false))
              }}
            >
              {busy ? p('Preparing secure verification\u2026') : p('Start ID and selfie verification')}
            </button>
          </>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-xl border border-brand-700 p-3 text-center text-sm font-semibold text-brand-700"
          >
            {p('Continue securely with Persona')}
          </a>
        )}
        {configured && status === 'pending' && (
          <button className="mt-4 w-full p-3 text-sm underline" onClick={() => void refresh()}>
            {p('I\u2019ve finished. Check my verification')}
          </button>
        )}
        <p className="mt-5 text-xs leading-5 text-ink-500">
          {p(
            'Results update after the provider completes its checks. Some cases require review. XpressTend does not store your ID images or selfie in its application database.',
          )}
        </p>
      </div>
    </div>
  )
}
