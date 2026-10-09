import { randomUUID } from 'node:crypto';
import { getSql } from '../../../server/database/neon.ts';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { ChatExchange, ChatSearch } from '../types.ts';

const fields = `id, user_text AS "userText", assistant_text AS "assistantText", model, status, created_at AS "createdAt"`;
function exchange(row: Record<string, unknown>): ChatExchange {
  return { ...row, createdAt: new Date(row.createdAt as string).toISOString() } as ChatExchange;
}
export class ChatRepository {
  private readonly database?: NeonQueryFunction<false, false>;
  constructor(database?: NeonQueryFunction<false, false>) { this.database = database; }
  private sql() { return this.database ?? getSql(); }

  async cleanup() {
    const rows = await this.sql().query(`DELETE FROM ai_chat_exchanges WHERE created_at <= now() - interval '7 days' RETURNING id`);
    return rows.length;
  }
  async expire(userId: string) {
    await this.sql().query(`UPDATE ai_chat_exchanges SET status = 'failed', updated_at = now()
      WHERE user_id = $1 AND status = 'pending' AND updated_at < now() - interval '90 seconds'`, [userId]);
    await this.sql().query(`DELETE FROM ai_chat_exchanges WHERE user_id = $1 AND created_at <= now() - interval '7 days'`, [userId]);
  }
  async list(userId: string, { query = '', before }: ChatSearch = {}) {
    const rows = await this.sql().query(`SELECT ${fields} FROM ai_chat_exchanges
      WHERE user_id = $1 AND created_at > now() - interval '7 days'
      AND ($2 = '' OR strpos(lower(user_text), lower($2)) > 0 OR strpos(lower(COALESCE(assistant_text, '')), lower($2)) > 0)
      AND ($3::uuid IS NULL OR (created_at, id) < (SELECT created_at, id FROM ai_chat_exchanges WHERE id = $3 AND user_id = $1))
      ORDER BY created_at DESC, id DESC LIMIT 51`, [userId, query, before ?? null]);
    return { entries: rows.slice(0, 50).map(exchange).reverse(), hasMore: rows.length > 50 };
  }
  async find(userId: string, id: string) {
    const rows = await this.sql().query(`SELECT ${fields} FROM ai_chat_exchanges
      WHERE id = $2 AND user_id = $1 AND created_at > now() - interval '7 days'`, [userId, id]);
    return rows[0] ? exchange(rows[0]) : null;
  }
  async claim(userId: string, id: string, text: string, model: string) {
    const lease = randomUUID();
    const rows = await this.sql().query(`INSERT INTO ai_chat_exchanges (id, user_id, user_text, model, status, lease_id)
      VALUES ($2, $1, $3, $4, 'pending', $5)
      ON CONFLICT (id) DO UPDATE SET status = 'pending', model = EXCLUDED.model, lease_id = EXCLUDED.lease_id, updated_at = now()
      WHERE ai_chat_exchanges.user_id = $1 AND ai_chat_exchanges.user_text = $3 AND ai_chat_exchanges.status = 'failed'
      RETURNING id`, [userId, id, text, model, lease]);
    return rows.length ? lease : null;
  }
  async context(userId: string, id: string) {
    const rows = await this.sql().query(`SELECT ${fields} FROM ai_chat_exchanges WHERE user_id = $1
      AND status = 'complete' AND created_at > now() - interval '7 days'
      AND (created_at, id) < (SELECT created_at, id FROM ai_chat_exchanges WHERE id = $2 AND user_id = $1)
      ORDER BY created_at DESC, id DESC LIMIT 8`, [userId, id]);
    return rows.map(exchange).reverse();
  }
  async finish(userId: string, id: string, lease: string, reply: string | null) {
    const rows = await this.sql().query(`UPDATE ai_chat_exchanges SET assistant_text = $4,
      status = CASE WHEN $4::text IS NULL THEN 'failed' ELSE 'complete' END, updated_at = now()
      WHERE user_id = $1 AND id = $2 AND lease_id = $3 AND status = 'pending' RETURNING ${fields}`,
    [userId, id, lease, reply]);
    return rows[0] ? exchange(rows[0]) : null;
  }
}
