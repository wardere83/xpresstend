-- Reference data: chart of accounts, corridors and opening FX rates.
--
-- Corridor pricing is deliberately set below every competitor figure we could
-- source and cite (see src/marketing/competitors.ts). At the World Bank's
-- 200 USD benchmark a 0.99 USD flat fee with no FX margin is 0.495%, against a
-- cheapest sourced rival of 1.00% and a US market average of 5.04%. The
-- "cheapest" claim on the marketing page is computed from these numbers at
-- render time, not asserted, so if this pricing changes the claim changes with it.

INSERT INTO ledger_accounts (id, code, type, currency, name) VALUES
 ('la_set_usd','settlement','asset','USD','Settlement account (USD)'),
 ('la_cash_usd','customer_cash','asset','USD','Customer funds received (USD)'),
 ('la_pay_usd','payout_payable','liability','USD','Payout payable (USD)'),
 ('la_pay_kes','payout_payable','liability','KES','Payout payable (KES)'),
 ('la_pay_etb','payout_payable','liability','ETB','Payout payable (ETB)'),
 ('la_pay_brl','payout_payable','liability','BRL','Payout payable (BRL)'),
 ('la_pay_mxn','payout_payable','liability','MXN','Payout payable (MXN)'),
 ('la_fee_usd','fee_revenue','revenue','USD','Transfer fee revenue (USD)'),
 ('la_fx_usd','fx_revenue','revenue','USD','FX margin revenue (USD)'),
 ('la_fxs_usd','fx_settlement','asset','USD','FX settlement position (USD)'),
 ('la_fxs_kes','fx_settlement','asset','KES','FX settlement position (KES)'),
 ('la_fxs_etb','fx_settlement','asset','ETB','FX settlement position (ETB)'),
 ('la_fxs_brl','fx_settlement','asset','BRL','FX settlement position (BRL)'),
 ('la_fxs_mxn','fx_settlement','asset','MXN','FX settlement position (MXN)'),
 ('la_set_kes','settlement','asset','KES','Settlement to payout partner (KES)'),
 ('la_set_etb','settlement','asset','ETB','Settlement to payout partner (ETB)'),
 ('la_set_brl','settlement','asset','BRL','Settlement to payout partner (BRL)'),
 ('la_set_mxn','settlement','asset','MXN','Settlement to payout partner (MXN)');

INSERT INTO corridors (id, send_country, receive_country, send_currency, receive_currency,
                       fee_flat_minor, fee_percent_bps, min_send_minor, max_send_minor,
                       fx_margin_bps, enabled, created_at) VALUES
 ('cor_us_so','US','SO','USD','USD',99,0,5000,500000,0,1,datetime('now')),
 ('cor_us_ke','US','KE','USD','KES',99,0,5000,500000,0,1,datetime('now')),
 ('cor_us_et','US','ET','USD','ETB',99,0,5000,500000,0,1,datetime('now')),
 ('cor_us_br','US','BR','USD','BRL',99,0,5000,500000,0,1,datetime('now')),
 ('cor_us_mx','US','MX','USD','MXN',99,0,5000,500000,0,1,datetime('now'));

-- Opening mid-market rates, scaled by 1e8. Replace with a live feed before launch.
INSERT INTO fx_rates (id, base, quote, rate_e8, source, fetched_at) VALUES
 ('fx_usd_usd','USD','USD',100000000,'seed',datetime('now')),
 ('fx_usd_kes','USD','KES',12950000000,'seed',datetime('now')),
 ('fx_usd_etb','USD','ETB',15000000000,'seed',datetime('now')),
 ('fx_usd_brl','USD','BRL',540000000,'seed',datetime('now')),
 ('fx_usd_mxn','USD','MXN',1850000000,'seed',datetime('now'));
