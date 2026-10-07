import type { NeonQueryFunction } from '@neondatabase/serverless';
import { getSql } from '../../../server/database/neon.ts';
import type { LifeEntry, LifeInput, LifeRepository } from '../types.ts';

type Row = { id: string; activity: LifeEntry['activity']; occurred_at: Date | string; note: string | null; duration_minutes: number };
const columns = 'id, activity, occurred_at, note, duration_minutes';
const mapEntry = (row: Row): LifeEntry => ({ id: row.id, activity: row.activity, occurredAt: new Date(row.occurred_at).toISOString(), note: row.note, durationMinutes: row.duration_minutes });

export class PostgresLifeRepository implements LifeRepository {
  private readonly sql?: NeonQueryFunction<false, false>;
  constructor(sql?: NeonQueryFunction<false, false>) { this.sql = sql; }

  async list(userId: string, timezone: string, now: Date) {
    const rows = await (this.sql ?? getSql()).query(
      `SELECT ${columns} FROM daily_life_entries
       WHERE user_id = $1 AND deleted_at IS NULL
         AND activity IN ('work', 'study', 'exercise') AND duration_minutes IS NOT NULL
         AND occurred_at >= (((($3::timestamptz AT TIME ZONE $2)::date - 6)::timestamp) AT TIME ZONE $2)
         AND occurred_at <= $3::timestamptz
       ORDER BY occurred_at DESC, id DESC`, [userId, timezone, now],
    ) as Row[];
    return rows.map(mapEntry);
  }

  async save(userId: string, input: LifeInput & { occurredAt: string }, now: Date) {
    const sql = this.sql ?? getSql();
    const rows = input.id
      ? await sql.query(
          `UPDATE daily_life_entries SET activity = $3, occurred_at = $4, note = $5, updated_at = $6, duration_minutes = $7
           WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING ${columns}`,
          [userId, input.id, input.activity, input.occurredAt, input.note, now, input.durationMinutes],
        )
      : await sql.query(
          `INSERT INTO daily_life_entries (user_id, capture_key, activity, occurred_at, note, created_at, updated_at, duration_minutes)
           VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
           ON CONFLICT (user_id, capture_key) DO UPDATE SET capture_key = EXCLUDED.capture_key
           WHERE daily_life_entries.deleted_at IS NULL RETURNING ${columns}`,
          [userId, input.captureKey, input.activity, input.occurredAt, input.note, now, input.durationMinutes],
        );
    return rows[0] ? mapEntry(rows[0] as Row) : null;
  }

  async archive(userId: string, id: string, now: Date) {
    const rows = await (this.sql ?? getSql()).query(
      `UPDATE daily_life_entries SET deleted_at = $3, updated_at = $3
       WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING id`, [userId, id, now],
    );
    return rows.length > 0;
  }
}
