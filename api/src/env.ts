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
  /**
   * Transactional email. Two transports; whichever is configured is used, and
   * Microsoft wins if both are. With neither, invites and password resets fall
   * back to an owner handing over a link.
   *
   * Microsoft 365 via Graph is the one the domain is set up for: the MX points
   * at Outlook and SPF ends in `-all` authorising only Microsoft, so mail sent
   * any other way fails SPF at the receiver. Needs an Azure app registration
   * with the Mail.Send application permission, admin-consented.
   */
  MS_TENANT_ID?: string
  MS_CLIENT_ID?: string
  MS_CLIENT_SECRET?: string
  /**
   * Alternative transport. Using it means adding Resend to the domain's SPF
   * record and publishing its DKIM keys first, or mail will be spam-filed.
   */
  RESEND_API_KEY?: string
  /** Defaults to support@xpresstend.com. Must be a real mailbox in the tenant. */
  EMAIL_FROM?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  /**
   * Which payment rail moves the money, by id (see api/src/rails/index.ts).
   * Unset means no rail is active and transfers keep the test-mode path.
   */
  PAYMENT_RAIL?: string
  /**
   * Mobile money. Every one of these is a merchant secret and belongs in
   * `wrangler secret put`, never in wrangler.toml and never in the client
   * bundle. See .env.example for what the operator supplies.
   *
   * The provider is not named here or anywhere else in this repository: the
   * rail implements a protocol, and which provider speaks it is the operator's
   * configuration rather than a fact this codebase asserts.
   */
  MOBILE_MONEY_ENVIRONMENT?: 'STAGE' | 'PROD'
  MOBILE_MONEY_MERCHANT_UID?: string
  MOBILE_MONEY_API_USER_ID?: string
  MOBILE_MONEY_API_KEY?: string
  /**
   * Endpoints, one per environment and neither with a default. A hardcoded
   * host would be an address this repository asserts is correct, and keeping
   * them separate is what stops a production credential posting at a sandbox.
   * Unset means the rail reports itself unconfigured rather than guessing.
   */
  MOBILE_MONEY_STAGE_BASE_URL?: string
  MOBILE_MONEY_PROD_BASE_URL?: string
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
