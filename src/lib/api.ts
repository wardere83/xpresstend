import { Capacitor } from '@capacitor/core'
/**
 * Client for the XpressTend Worker API.
 *
 * Sessions are httpOnly cookies, so nothing here touches a token: every call
 * just sends credentials and lets the browser do it. That means an XSS bug
 * cannot read a session out of JavaScript.
 */

/**
 * On the web the API is served by the same Worker as the site, so a relative
 * path keeps every request same-origin and CORS out of the picture.
 *
 * The native apps load from capacitor://localhost, where a relative path would
 * resolve against the app bundle and find nothing, so they need an absolute
 * origin. Set VITE_API_URL at build time to point a build at somewhere else,
 * which is how the mobile build targets a staging Worker.
 */
const REMOTE_API = import.meta.env.VITE_API_URL ?? 'https://xpresstend.com/api'

export const API_BASE: string = Capacitor.isNativePlatform()
  ? REMOTE_API
  : (import.meta.env.VITE_API_URL ?? '/api')

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    // Network-level failure: the API is unreachable, not refusing.
    throw new ApiError(0, 'network_unavailable', 'Cannot reach XpressTend right now.')
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof body.error === 'string' ? body.error : 'request_failed',
      typeof body.message === 'string' ? body.message : undefined,
    )
  }
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
}

// ---------------------------------------------------------------- shapes
export interface AccountUser {
  id: string
  email: string
  firstName: string
  lastName: string
  kycStatus: string
  kycTier: number
  status: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'viewer' | 'agent' | 'compliance' | 'owner'
}

export interface Corridor {
  id: string
  send_country: string
  receive_country: string
  send_currency: string
  receive_currency: string
  fee_flat_minor: number
  min_send_minor: number
  max_send_minor: number
}

export interface Quote {
  sendAmountMinor: number
  feeMinor: number
  totalChargedMinor: number
  receiveAmountMinor: number
  sendCurrency: string
  receiveCurrency: string
  effectiveRateE8: number
  corridorId: string
  expiresAt: string
}

/** Minor units to a display string. Presentation only — never arithmetic. */
export function money(minor: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(minor / 100)
}
