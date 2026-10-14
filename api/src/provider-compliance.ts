import type { Env } from './env'
import { newId } from './crypto'

export class ProviderError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}
export const providersRequired = (env: Env) =>
  env.ENVIRONMENT === 'production' ||
  env.COMPLIANCE_PROVIDERS_REQUIRED === 'true'
export async function providerJson(
  url: string,
  init: RequestInit,
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) throw new Error('provider_failed')
    return (await response.json()) as Record<string, unknown>
  } catch {
    throw new ProviderError('compliance_provider_unavailable')
  }
}
export type Resource = {
  id?: string
  type?: string
  attributes?: Record<string, unknown>
  relationships?: Record<
    string,
    { data?: { id?: string; type?: string } | { id?: string; type?: string }[] }
  >
}

/** Approval alone is insufficient: require the linked ID and live selfie evidence. */
export function personaDecision(
  payload: Record<string, unknown>,
  expected: {
    id: string
    userId: string
    firstName: string
    lastName: string
    template: string
  },
) {
  const data = payload.data as Resource | undefined
  const attrs = data?.attributes
  const template = data?.relationships?.['inquiry-template']?.data as
    { id?: string } | undefined
  if (
    data?.id !== expected.id ||
    attrs?.['reference-id'] !== expected.userId ||
    template?.id !== expected.template
  )
    throw new ProviderError('identity_evidence_mismatch')
  const refs = data?.relationships?.verifications?.data
  const ids = new Set(Array.isArray(refs) ? refs.map((r) => r.id) : [])
  const included = Array.isArray(payload.included)
    ? (payload.included as Resource[])
    : []
  const passed = (type: string) =>
    included.filter(
      (r) =>
        ids.has(r.id) && r.type === type && r.attributes?.status === 'passed',
    )
  const normalize = (s: unknown) =>
    typeof s === 'string'
      ? s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
      : ''
  const id = passed('verification/government-id').find(
    (r) =>
      normalize(r.attributes?.['name-first']) ===
        normalize(expected.firstName) &&
      normalize(r.attributes?.['name-last']) === normalize(expected.lastName),
  )
  const selfie = passed('verification/selfie').find((r) => {
    const checks = r.attributes?.checks
    return (
      Array.isArray(checks) &&
      checks.some(
        (c) => c.name === 'selfie_liveness_detection' && c.status === 'passed',
      ) &&
      checks.some(
        (c) => c.name === 'selfie_id_comparison' && c.status === 'passed',
      )
    )
  })
  const verified = attrs?.status === 'approved' && !!id && !!selfie
  return {
    status: verified
      ? 'verified'
      : ['declined', 'failed', 'expired'].includes(String(attrs?.status))
        ? 'rejected'
        : 'pending',
    inquiryStatus: String(attrs?.status ?? 'unknown'),
    governmentId: id?.id ?? null,
    liveSelfie: selfie?.id ?? null,
  }
}

export async function requireProviderIdentity(
  env: Env,
  userId: string,
  firstName: string,
  lastName: string,
) {
  if (!providersRequired(env)) return
  const row = await env.DB.prepare(
    `SELECT id FROM identity_sessions WHERE user_id=? AND provider='persona'
    AND id=(SELECT id FROM identity_sessions latest WHERE latest.user_id=identity_sessions.user_id ORDER BY created_at DESC,rowid DESC LIMIT 1) AND status='verified' AND first_name=? AND last_name=? AND checked_at>=? ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(
      userId,
      firstName,
      lastName,
      new Date(Date.now() - 365 * 86400_000).toISOString(),
    )
    .first()
  if (!row) throw new ProviderError('identity_verification_required')
}

export function sanctionsDecision(payload: Record<string, unknown>) {
  const content = payload.content as
    { data?: Record<string, unknown> } | undefined
  const data = content?.data
  if (
    payload.status !== 'success' ||
    !data ||
    !['string', 'number'].includes(typeof data.id) ||
    typeof data.total_hits !== 'number' ||
    !Number.isSafeInteger(data.total_hits) ||
    data.total_hits < 0 ||
    !Array.isArray(data.hits)
  )
    throw new ProviderError('invalid_screening_response')
  // Never interpret a provider-side false-positive label as a local authorization.
  const clear =
    data.total_hits === 0 &&
    data.hits.length === 0 &&
    data.match_status === 'no_match'
  return {
    status: clear ? 'clear' : 'review_required',
    reference: String(data.id),
    hits: data.total_hits,
  }
}

export async function screenGlobal(
  env: Env,
  transferId: string,
  subjects: { subjectId: string; subjectType: string; name: string }[],
) {
  if (!providersRequired(env)) return []
  if (!env.COMPLYADVANTAGE_API_KEY)
    throw new ProviderError('sanctions_provider_not_configured')
  const evidence: {
    id: string
    subjectId: string
    name: string
    status: string
  }[] = []
  for (const subject of subjects) {
    const id = newId('psc')
    let decision: ReturnType<typeof sanctionsDecision> | undefined
    let error: unknown
    try {
      if (!subject.name.trim() || subject.name.length > 255)
        throw new ProviderError('invalid_screening_name')
      decision = sanctionsDecision(
        await providerJson('https://api.complyadvantage.com/searches', {
          method: 'POST',
          headers: {
            Authorization: `Token ${env.COMPLYADVANTAGE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            search_term: subject.name,
            client_ref: subject.subjectId,
            fuzziness: 0.6,
            filters: { types: ['sanction'] },
            share_url: 0,
          }),
        }),
      )
    } catch (e) {
      error = e
    }
    await env.DB.prepare(
      `INSERT INTO provider_screenings
      (id,transfer_id,subject_id,subject_type,subject_name,provider,provider_ref,status,evidence_json,created_at)
      VALUES (?,?,?,?,?,'complyadvantage',?,?,?,?)`,
    )
      .bind(
        id,
        transferId,
        subject.subjectId,
        subject.subjectType,
        subject.name,
        decision?.reference ?? null,
        decision?.status ?? 'unavailable',
        JSON.stringify(decision ?? { error: 'provider_unavailable' }),
        new Date().toISOString(),
      )
      .run()
    if (error) throw error
    evidence.push({
      id,
      subjectId: subject.subjectId,
      name: subject.name,
      status: decision!.status,
    })
  }
  return evidence
}

/** Recheck identity evidence in the SQL transaction that claims a transfer. */
export function providerIdentitySql(userExpression: string): string {
  return ` AND EXISTS(SELECT 1 FROM identity_sessions ids JOIN users iu ON iu.id=ids.user_id
    WHERE ids.user_id=${userExpression} AND ids.status='verified' AND ids.first_name=iu.first_name AND ids.last_name=iu.last_name
      AND ids.checked_at>=strftime('%Y-%m-%dT%H:%M:%fZ','now','-365 days')
      AND ids.id=(SELECT latest.id FROM identity_sessions latest WHERE latest.user_id=ids.user_id ORDER BY latest.created_at DESC,latest.rowid DESC LIMIT 1))`
}
