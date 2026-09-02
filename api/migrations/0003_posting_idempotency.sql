-- One funding posting and one payout posting per transfer, enforced by the
-- database rather than by application logic.
--
-- Both handlers previously read a transfer's status, updated it, and wrote
-- ledger entries as separate operations. Two concurrent requests could both
-- pass the status check and post the money twice. The status transition is now
-- a conditional UPDATE, and this table is the second line of defence: the
-- primary key makes a duplicate posting impossible even if the transition is
-- ever wrong again.
CREATE TABLE IF NOT EXISTS transfer_postings (
  transfer_id TEXT NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  -- funding | payout
  kind        TEXT NOT NULL,
  entry_group TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (transfer_id, kind)
);
