/**
 * Persistence for ledger postings. Kept apart from ledger.ts so the posting
 * rules stay a pure, dependency-free module that can be tested directly.
 */
import { newId } from './crypto'
import { assertBalanced, type Posting } from './ledger'

/** Writes a balanced group. Callers must have validated with assertBalanced. */
export async function post(
  db: D1Database,
  transferId: string | null,
  postings: Posting[],
): Promise<string> {
  assertBalanced(postings)
  const group = newId('grp')
  const now = new Date().toISOString()
  const stmts = postings.map((p) =>
    db
      .prepare(
        `INSERT INTO ledger_entries
           (id, transfer_id, account_code, currency, amount_minor, entry_group, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(newId('le'), transferId, p.accountCode, p.currency, p.amountMinor, group, p.description, now),
  )
  await db.batch(stmts)
  return group
}
