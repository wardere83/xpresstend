import { newId } from './crypto'

/** Append-only. Nothing in the codebase updates or deletes from audit_log. */
export async function audit(
  db: D1Database,
  entry: {
    actorType: 'customer' | 'admin' | 'system'
    actorId?: string | null
    action: string
    entityType?: string | null
    entityId?: string | null
    metadata?: unknown
    ip?: string | null
    userAgent?: string | null
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_log
         (id, actor_type, actor_id, action, entity_type, entity_id, metadata, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      newId('aud'),
      entry.actorType,
      entry.actorId ?? null,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      entry.metadata === undefined ? null : JSON.stringify(entry.metadata),
      entry.ip ?? null,
      entry.userAgent ?? null,
      new Date().toISOString(),
    )
    .run()
}
