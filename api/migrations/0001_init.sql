-- XpressTend core schema.
--
-- Money is stored as integer minor units (cents) and never as a float.
-- Balances are never a column: they are derived from ledger_entries, so the
-- books can always be re-proved from the entry history.
-- Timestamps are ISO-8601 UTC strings, which SQLite sorts correctly as text.

-- ---------------------------------------------------------------- customers
CREATE TABLE users (
  id                  TEXT PRIMARY KEY,
  email               TEXT NOT NULL,
  email_verified_at   TEXT,
  password_hash       TEXT NOT NULL,
  password_salt       TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  phone               TEXT,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  country             TEXT NOT NULL DEFAULT 'US',
  preferred_language  TEXT NOT NULL DEFAULT 'en',
  -- active | suspended | closed
  status              TEXT NOT NULL DEFAULT 'active',
  -- unverified | pending | verified | rejected
  kyc_status          TEXT NOT NULL DEFAULT 'unverified',
  -- 0 = cannot send. Raised by a passed KYC check; drives send limits.
  kyc_tier            INTEGER NOT NULL DEFAULT 0,
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TEXT,
  last_login_at       TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_users_email ON users (lower(email));
CREATE INDEX idx_users_kyc ON users (kyc_status);

CREATE TABLE sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Only the hash is stored, so a database leak does not hand over live sessions.
  token_hash   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  revoked_at   TEXT,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_sessions_token ON sessions (token_hash);
CREATE INDEX idx_sessions_user ON sessions (user_id, expires_at);

CREATE TABLE email_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- verify_email | reset_password
  purpose    TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_email_tokens_hash ON email_tokens (token_hash);

-- ------------------------------------------------------------------- staff
CREATE TABLE admins (
  id                  TEXT PRIMARY KEY,
  email               TEXT NOT NULL,
  password_hash       TEXT NOT NULL,
  password_salt       TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  name                TEXT NOT NULL,
  -- viewer | agent | compliance | owner
  role                TEXT NOT NULL DEFAULT 'viewer',
  status              TEXT NOT NULL DEFAULT 'active',
  failed_login_count  INTEGER NOT NULL DEFAULT 0,
  locked_until        TEXT,
  last_login_at       TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_admins_email ON admins (lower(email));

CREATE TABLE admin_sessions (
  id         TEXT PRIMARY KEY,
  admin_id   TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_admin_sessions_token ON admin_sessions (token_hash);

-- -------------------------------------------------------------- recipients
CREATE TABLE recipients (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  country        TEXT NOT NULL,
  -- mobile_wallet | bank_account | cash_pickup
  payout_method  TEXT NOT NULL,
  phone          TEXT,
  account_ref    TEXT,
  bank_name      TEXT,
  relationship   TEXT,
  archived_at    TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX idx_recipients_user ON recipients (user_id, archived_at);

-- --------------------------------------------------------------- corridors
-- One row per country pair the business is licensed and plumbed to serve.
CREATE TABLE corridors (
  id                  TEXT PRIMARY KEY,
  send_country        TEXT NOT NULL,
  receive_country     TEXT NOT NULL,
  send_currency       TEXT NOT NULL,
  receive_currency    TEXT NOT NULL,
  fee_flat_minor      INTEGER NOT NULL DEFAULT 0,
  fee_percent_bps     INTEGER NOT NULL DEFAULT 0,
  min_send_minor      INTEGER NOT NULL DEFAULT 100,
  max_send_minor      INTEGER NOT NULL,
  -- Margin taken over the mid-market rate, in basis points.
  fx_margin_bps       INTEGER NOT NULL DEFAULT 0,
  enabled             INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_corridors_pair ON corridors (send_country, receive_country, receive_currency);

CREATE TABLE fx_rates (
  id         TEXT PRIMARY KEY,
  base       TEXT NOT NULL,
  quote      TEXT NOT NULL,
  -- Mid-market rate scaled by 1e8 to stay in integer arithmetic.
  rate_e8    INTEGER NOT NULL,
  source     TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
CREATE INDEX idx_fx_pair ON fx_rates (base, quote, fetched_at DESC);

-- --------------------------------------------------------------- transfers
CREATE TABLE transfers (
  id                   TEXT PRIMARY KEY,
  reference            TEXT NOT NULL,
  user_id              TEXT NOT NULL REFERENCES users(id),
  recipient_id         TEXT NOT NULL REFERENCES recipients(id),
  corridor_id          TEXT REFERENCES corridors(id),

  send_amount_minor    INTEGER NOT NULL,
  send_currency        TEXT NOT NULL,
  fee_minor            INTEGER NOT NULL,
  receive_amount_minor INTEGER NOT NULL,
  receive_currency     TEXT NOT NULL,
  -- The rate quoted to the customer, locked at quote time.
  fx_rate_e8           INTEGER NOT NULL,

  -- draft | awaiting_payment | paid | compliance_hold | sending
  --       | completed | failed | cancelled | refunded
  status               TEXT NOT NULL DEFAULT 'draft',
  failure_reason       TEXT,

  payment_provider     TEXT,
  payment_intent_id    TEXT,
  payout_provider      TEXT,
  payout_reference     TEXT,

  quote_expires_at     TEXT,
  paid_at              TEXT,
  completed_at         TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,

  CHECK (send_amount_minor > 0),
  CHECK (fee_minor >= 0),
  CHECK (receive_amount_minor > 0)
);
CREATE UNIQUE INDEX idx_transfers_reference ON transfers (reference);
CREATE INDEX idx_transfers_user ON transfers (user_id, created_at DESC);
CREATE INDEX idx_transfers_status ON transfers (status, created_at DESC);

-- Append-only state history. Every status change writes one row, so a
-- transfer's life is reconstructible for a regulator or a dispute.
CREATE TABLE transfer_events (
  id           TEXT PRIMARY KEY,
  transfer_id  TEXT NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  actor_type   TEXT NOT NULL,   -- customer | admin | system | provider
  actor_id     TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_transfer_events_transfer ON transfer_events (transfer_id, created_at);

-- ----------------------------------------------------------------- ledger
-- Double entry. Every movement writes at least two rows summing to zero
-- within a currency, so the books prove themselves.
CREATE TABLE ledger_accounts (
  id       TEXT PRIMARY KEY,
  code     TEXT NOT NULL,
  -- asset | liability | revenue | expense
  type     TEXT NOT NULL,
  currency TEXT NOT NULL,
  name     TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_ledger_accounts_code ON ledger_accounts (code, currency);

CREATE TABLE ledger_entries (
  id           TEXT PRIMARY KEY,
  transfer_id  TEXT REFERENCES transfers(id),
  account_code TEXT NOT NULL,
  currency     TEXT NOT NULL,
  -- Signed minor units: debit positive, credit negative.
  amount_minor INTEGER NOT NULL,
  -- Groups the rows of one balanced posting.
  entry_group  TEXT NOT NULL,
  description  TEXT,
  created_at   TEXT NOT NULL,
  CHECK (amount_minor <> 0)
);
CREATE INDEX idx_ledger_group ON ledger_entries (entry_group);
CREATE INDEX idx_ledger_account ON ledger_entries (account_code, currency, created_at);
CREATE INDEX idx_ledger_transfer ON ledger_entries (transfer_id);

-- ------------------------------------------------------------- compliance
CREATE TABLE kyc_checks (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  provider_ref  TEXT,
  -- pending | passed | failed | manual_review
  status        TEXT NOT NULL,
  result_json   TEXT,
  reviewed_by   TEXT REFERENCES admins(id),
  reviewed_at   TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_kyc_user ON kyc_checks (user_id, created_at DESC);

CREATE TABLE sanctions_screenings (
  id           TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,   -- user | recipient
  subject_id   TEXT NOT NULL,
  transfer_id  TEXT REFERENCES transfers(id),
  provider     TEXT NOT NULL,
  -- clear | potential_match | confirmed_match
  status       TEXT NOT NULL,
  match_json   TEXT,
  cleared_by   TEXT REFERENCES admins(id),
  cleared_at   TEXT,
  created_at   TEXT NOT NULL
);
CREATE INDEX idx_screen_subject ON sanctions_screenings (subject_type, subject_id);

-- Immutable trail of who did what. Never updated, never deleted.
CREATE TABLE audit_log (
  id          TEXT PRIMARY KEY,
  actor_type  TEXT NOT NULL,   -- customer | admin | system
  actor_id    TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  metadata    TEXT,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_audit_actor ON audit_log (actor_type, actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id, created_at DESC);
