-- Rate limit counters.
--
-- Password hashing is intentionally expensive, so the login and registration
-- endpoints were a cheap way to burn Worker CPU, and repeated failures could be
-- used to lock a known customer out on purpose. Counts live here rather than in
-- memory because Workers are per-isolate and an in-memory counter enforces
-- nothing across them.
CREATE TABLE IF NOT EXISTS rate_hits (
  id         TEXT PRIMARY KEY,
  bucket     TEXT NOT NULL,
  key        TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_hits_lookup ON rate_hits (bucket, key, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_hits_sweep ON rate_hits (created_at);
