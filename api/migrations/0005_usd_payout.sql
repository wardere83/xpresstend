-- Every corridor pays out in US dollars.
--
-- The sender funds in USD and the recipient collects USD, so a transfer no
-- longer crosses a currency at all. Somalia was already USD; this brings the
-- other four into line.
--
-- What this changes in practice:
--
--   * The quote reads fx_usd_usd, which is seeded at exactly 1.00000000 and
--     refreshed by the same scheduled job as every other pair (crossRate
--     returns 1 when base and quote match), so it can never go stale and
--     block a quote.
--   * fx_margin_bps was already 0 on every corridor, so no spread is lost.
--     Revenue is the 0.99% fee alone, which is now the entire price and is
--     visible in full before anyone confirms.
--   * The ledger is unaffected. Both legs still pass through fx_settlement,
--     they simply balance at one to one, so the double-entry postings and the
--     existing tests hold without modification.
--
-- The rows are left in fx_rates. Nothing reads them while every corridor is
-- USD, and dropping them would mean re-seeding to reverse this.

UPDATE corridors
   SET receive_currency = 'USD'
 WHERE id IN ('cor_us_ke', 'cor_us_et', 'cor_us_br', 'cor_us_mx');

-- Belt and braces: a corridor priced with a spread would silently take one on
-- a pair that cannot move. Nothing should have set this, and now nothing can
-- have.
UPDATE corridors
   SET fx_margin_bps = 0
 WHERE receive_currency = 'USD';

-- Make sure the pair every corridor now depends on is present and current,
-- rather than relying on the seed having run.
INSERT INTO fx_rates (id, base, quote, rate_e8, source, fetched_at)
VALUES ('fx_usd_usd', 'USD', 'USD', 100000000, 'identity', datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  rate_e8 = 100000000,
  source = 'identity',
  fetched_at = datetime('now');
