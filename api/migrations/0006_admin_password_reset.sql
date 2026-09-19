-- Staff password recovery.
--
-- Deliberately shaped like staff_invites, because it is the same problem: a
-- single-use, expiring, revocable capability that grants the holder the right
-- to set one account's password. Anything that can be said about the security
-- of one applies to the other.
--
-- Only the SHA-256 of the token is stored. A stolen database therefore yields
-- no usable reset links, and there is no way for anyone, staff included, to
-- read a token back out. Same reasoning as session tokens.
--
-- `issued_by` records who caused the token to exist:
--   NULL      the account holder asked for it themselves and it was emailed
--   <admin>   an owner generated it from the staff panel to hand over
-- That distinction is the difference between a routine self-service reset and
-- one person granting another access, which is exactly what an examiner asks
-- about, so it is recorded rather than inferred.
CREATE TABLE IF NOT EXISTS admin_password_resets (
  id           TEXT PRIMARY KEY,
  admin_id     TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  used_at      TEXT,
  revoked_at   TEXT,
  issued_by    TEXT REFERENCES admins(id),
  requested_ip TEXT,
  created_at   TEXT NOT NULL
);

-- Unique, so a token collision is a database error rather than two accounts
-- sharing one link.
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_resets_token ON admin_password_resets (token_hash);

-- Issuing a new token revokes the account's outstanding ones, which reads by
-- admin_id and expects an index.
CREATE INDEX IF NOT EXISTS idx_admin_resets_admin ON admin_password_resets (admin_id);
