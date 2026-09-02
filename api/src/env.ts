export interface Env {
  DB: D1Database
  /** Static assets binding: the built frontend from dist/. */
  ASSETS: Fetcher
  ENVIRONMENT: string
  APP_ORIGIN: string
  /** Extra secret mixed into every password hash; set with `wrangler secret put`. */
  SESSION_PEPPER?: string
  /**
   * Enables the one-time first-admin bootstrap. Unset it once the first staff
   * account exists so the route disappears again.
   */
  ADMIN_BOOTSTRAP_SECRET?: string
  /** Transactional email. Without both of these, invites fall back to a link. */
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  kycStatus: string
  kycTier: number
  status: string
}

export interface SessionAdmin {
  id: string
  email: string
  name: string
  role: 'viewer' | 'agent' | 'compliance' | 'owner'
}

export type Vars = {
  user: SessionUser
  admin: SessionAdmin
}
