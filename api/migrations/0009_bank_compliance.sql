-- Idempotent operational controls. No documents or biometric images are stored here.
CREATE TABLE IF NOT EXISTS identity_sessions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL DEFAULT 'persona', provider_ref TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', evidence_json TEXT,
  created_at TEXT NOT NULL, checked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_identity_user ON identity_sessions(user_id, created_at);
CREATE TABLE IF NOT EXISTS provider_screenings (
  id TEXT PRIMARY KEY, transfer_id TEXT NOT NULL, subject_id TEXT NOT NULL,
  subject_type TEXT NOT NULL, subject_name TEXT NOT NULL,
  provider TEXT NOT NULL, provider_ref TEXT, status TEXT NOT NULL,
  evidence_json TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_provider_transfer ON provider_screenings(transfer_id, created_at);
CREATE TABLE IF NOT EXISTS bank_api_keys (
  id TEXT PRIMARY KEY, bank_id TEXT NOT NULL, label TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, revoked_at TEXT,
  created_by TEXT NOT NULL REFERENCES admins(id), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS wire_batches (
  id TEXT PRIMARY KEY, bank_id TEXT NOT NULL, currency TEXT NOT NULL,
  total_minor INTEGER NOT NULL CHECK(total_minor > 0), item_count INTEGER NOT NULL CHECK(item_count BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK(status IN ('building','submitted','approved','rejected')),
  manifest_hash TEXT, created_by TEXT NOT NULL REFERENCES admins(id), created_at TEXT NOT NULL,
  CHECK(total_minor=CAST(total_minor AS INTEGER))
);
CREATE TABLE IF NOT EXISTS wire_batch_items (
  batch_id TEXT NOT NULL REFERENCES wire_batches(id),
  transfer_id TEXT NOT NULL UNIQUE REFERENCES transfers(id),
  amount_minor INTEGER NOT NULL CHECK(amount_minor>0), currency TEXT NOT NULL,
  snapshot_json TEXT NOT NULL, PRIMARY KEY(batch_id, transfer_id)
);
CREATE TABLE IF NOT EXISTS bank_decisions (
  id TEXT PRIMARY KEY, batch_id TEXT NOT NULL REFERENCES wire_batches(id),
  bank_id TEXT NOT NULL, key_id TEXT NOT NULL REFERENCES bank_api_keys(id),
  decision TEXT NOT NULL CHECK(decision IN ('approved','rejected')),
  manifest_hash TEXT NOT NULL, reference TEXT NOT NULL, reason TEXT NOT NULL,
  created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  UNIQUE(bank_id,reference)
);
CREATE TRIGGER IF NOT EXISTS batch_reconcile BEFORE UPDATE OF status ON wire_batches
WHEN NEW.status='submitted' AND (
 (SELECT COUNT(*) FROM wire_batch_items WHERE batch_id=NEW.id)<>NEW.item_count OR
 (SELECT SUM(amount_minor) FROM wire_batch_items WHERE batch_id=NEW.id)<>NEW.total_minor OR
 EXISTS(SELECT 1 FROM wire_batch_items WHERE batch_id=NEW.id AND currency<>NEW.currency)
) BEGIN SELECT RAISE(ABORT,'batch_reconciliation_failed'); END;
CREATE TRIGGER IF NOT EXISTS batch_items_insert BEFORE INSERT ON wire_batch_items
WHEN (SELECT status FROM wire_batches WHERE id=NEW.batch_id)<>'building'
BEGIN SELECT RAISE(ABORT,'immutable_batch'); END;
CREATE TRIGGER IF NOT EXISTS batch_items_update BEFORE UPDATE ON wire_batch_items BEGIN SELECT RAISE(ABORT,'immutable_batch'); END;
CREATE TRIGGER IF NOT EXISTS batch_items_delete BEFORE DELETE ON wire_batch_items BEGIN SELECT RAISE(ABORT,'immutable_batch'); END;
CREATE TRIGGER IF NOT EXISTS bank_decisions_update BEFORE UPDATE ON bank_decisions BEGIN SELECT RAISE(ABORT,'immutable_decision'); END;
CREATE TRIGGER IF NOT EXISTS bank_decisions_delete BEFORE DELETE ON bank_decisions BEGIN SELECT RAISE(ABORT,'immutable_decision'); END;
CREATE TRIGGER IF NOT EXISTS provider_screenings_update BEFORE UPDATE ON provider_screenings BEGIN SELECT RAISE(ABORT,'immutable_evidence'); END;
CREATE TRIGGER IF NOT EXISTS provider_screenings_delete BEFORE DELETE ON provider_screenings BEGIN SELECT RAISE(ABORT,'immutable_evidence'); END;
CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger_entries BEGIN SELECT RAISE(ABORT,'append_only_ledger'); END;
CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger_entries BEGIN SELECT RAISE(ABORT,'append_only_ledger'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT,'append_only_audit'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT,'append_only_audit'); END;

CREATE TRIGGER IF NOT EXISTS batch_manifest_immutable BEFORE UPDATE ON wire_batches
WHEN OLD.status<>'building' AND (NEW.bank_id<>OLD.bank_id OR NEW.currency<>OLD.currency OR NEW.total_minor<>OLD.total_minor OR NEW.item_count<>OLD.item_count OR NEW.manifest_hash<>OLD.manifest_hash OR NEW.created_at<>OLD.created_at)
BEGIN SELECT RAISE(ABORT,'immutable_manifest'); END;
CREATE TRIGGER IF NOT EXISTS batch_no_delete BEFORE DELETE ON wire_batches BEGIN SELECT RAISE(ABORT,'immutable_manifest'); END;

CREATE TRIGGER IF NOT EXISTS batch_live_bank BEFORE INSERT ON wire_batches
WHEN NOT EXISTS(SELECT 1 FROM bank_api_keys WHERE bank_id=NEW.bank_id AND revoked_at IS NULL AND expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT,'bank_connection_required'); END;
