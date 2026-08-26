export interface Env {
  DB: D1Database
  ENVIRONMENT: string
  APP_ORIGIN: string
  /** Extra secret mixed into every password hash; set with `wrangler secret put`. */
  SESSION_PEPPER?: string
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
