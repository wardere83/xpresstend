-- Internal test registrations remain usable and retain their financial and
-- compliance records, but do not represent customer acquisition.
-- Classification is explicit and never inferred from an address or KYC state.
CREATE TABLE IF NOT EXISTS user_account_classifications (
  user_id       TEXT PRIMARY KEY REFERENCES users(id),
  kind          TEXT NOT NULL CHECK (kind = 'internal_test'),
  reason        TEXT NOT NULL,
  classified_at TEXT NOT NULL
);
