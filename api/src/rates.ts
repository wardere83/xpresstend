/**
 * Scheduled refresh of the mid-market rate table.
 *
 * `fx_rates` holds the mid-market rate only. The customer-facing price is
 * derived at quote time from the corridor's own `fx_margin_bps` (see
 * money.ts), so nothing here applies a spread — writing an already-margined
 * rate would charge the margin twice.
 *
 * Quotes reject any rate older than an hour, so without something writing
 * fresh rows every quote eventually fails. That is what this exists for.
 */
import type { Env } from './env'

/**
 * Keyless, no attribution requirement, and it carries the minor currencies
 * these corridors need. The obvious first choice, exchangerate.host, now
 * refuses anything without an access key, and frankfurter.app covers only
 * ECB currencies — neither KES nor ETB.
 */
const SOURCE_URL = 'https://open.er-api.com/v6/latest/USD'
const SOURCE_NAME = 'open.er-api.com'

/** 1e8, matching fx_rates.rate_e8. */
const RATE_SCALE = 100_000_000

/**
 * A published rate that has moved by more than this against the stored one is
 * treated as a bad feed rather than a real move. The band is deliberately wide
 * — currencies in these corridors do devalue sharply — so it catches a source
 * returning nonsense, not an ordinary bad week.
 */
const MAX_MOVE_FACTOR = 10

interface CorridorPair {
  id: string
  send_currency: string
  receive_currency: string
}

export interface RefreshOutcome {
  ok: number
  skipped: number
  failed: number
}

/** USD-based table in, arbitrary pair out. Both legs are quoted against USD. */
function crossRate(rates: Record<string, number>, base: string, quote: string): number | null {
  if (base === quote) return 1
  const b = base === 'USD' ? 1 : rates[base]
  const q = quote === 'USD' ? 1 : rates[quote]
  if (!Number.isFinite(b) || !Number.isFinite(q) || b <= 0 || q <= 0) return null
  return q / b
}

export async function refreshRates(env: Env): Promise<RefreshOutcome> {
  const fetchedAt = new Date().toISOString()
  const outcome: RefreshOutcome = { ok: 0, skipped: 0, failed: 0 }

  const { results: corridors } = await env.DB.prepare(
    `SELECT id, send_currency, receive_currency FROM corridors WHERE enabled = 1 ORDER BY id`,
  ).all<CorridorPair>()

  if (!corridors?.length) {
    console.log('scheduled: no enabled corridors, nothing to refresh')
    return outcome
  }

  /*
   * One request covers every corridor. If it fails the old rows stay exactly
   * as they were: a stale rate stops quoting after an hour, which is the safe
   * failure, whereas a wrong rate books money at a price that does not exist.
   */
  let rates: Record<string, number>
  try {
    const res = await fetch(SOURCE_URL, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> }
    if (body.result !== 'success' || !body.rates) throw new Error('unexpected payload')
    rates = body.rates
  } catch (err) {
    outcome.failed = corridors.length
    console.log(
      `scheduled: source=${SOURCE_NAME}, status=error, corridors_skipped=${corridors.length}, ` +
      `error=${err instanceof Error ? err.message : String(err)}`,
    )
    return outcome
  }

  for (const corridor of corridors) {
    const base = corridor.send_currency
    const quote = corridor.receive_currency
    const rate = crossRate(rates, base, quote)

    if (rate === null || !Number.isFinite(rate) || rate <= 0) {
      outcome.skipped++
      console.log(
        `scheduled: corridor=${corridor.id}, pair=${base}/${quote}, status=skipped, ` +
        `reason=no_rate_in_feed`,
      )
      continue
    }

    const rateE8 = Math.round(rate * RATE_SCALE)
    if (!Number.isSafeInteger(rateE8) || rateE8 <= 0) {
      outcome.skipped++
      console.log(
        `scheduled: corridor=${corridor.id}, pair=${base}/${quote}, status=skipped, reason=out_of_range`,
      )
      continue
    }

    const id = `fx_${base}_${quote}`.toLowerCase()
    const previous = await env.DB.prepare(`SELECT rate_e8 FROM fx_rates WHERE id = ?`)
      .bind(id).first<{ rate_e8: number }>()

    if (previous && previous.rate_e8 > 0) {
      const factor = rateE8 / previous.rate_e8
      if (factor > MAX_MOVE_FACTOR || factor < 1 / MAX_MOVE_FACTOR) {
        outcome.skipped++
        console.log(
          `scheduled: corridor=${corridor.id}, pair=${base}/${quote}, rate=${rate}, ` +
          `status=skipped, reason=implausible_move, previous_rate=${previous.rate_e8 / RATE_SCALE}`,
        )
        continue
      }
    }

    /*
     * Keyed on the pair, so a run every quarter of an hour updates in place
     * rather than growing the table without bound. The id matches the shape
     * the seed migration used, so the seeded rows are the ones updated.
     */
    try {
      await env.DB.prepare(
        `INSERT INTO fx_rates (id, base, quote, rate_e8, source, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           rate_e8 = excluded.rate_e8,
           source = excluded.source,
           fetched_at = excluded.fetched_at`,
      ).bind(id, base, quote, rateE8, SOURCE_NAME, fetchedAt).run()
      outcome.ok++
      console.log(
        `scheduled: corridor=${corridor.id}, pair=${base}/${quote}, rate=${rate}, ` +
        `rate_e8=${rateE8}, fetched_at=${fetchedAt}, status=ok`,
      )
    } catch (err) {
      outcome.failed++
      console.log(
        `scheduled: corridor=${corridor.id}, pair=${base}/${quote}, status=error, ` +
        `error=${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  console.log(
    `scheduled: source=${SOURCE_NAME}, updated=${outcome.ok}, skipped=${outcome.skipped}, ` +
    `failed=${outcome.failed}, fetched_at=${fetchedAt}`,
  )
  return outcome
}
