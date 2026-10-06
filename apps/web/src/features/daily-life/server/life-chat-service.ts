import type { NeonQueryFunction } from '@neondatabase/serverless';
import { getSql } from '../../../server/database/neon.ts';
import { isLifeId } from '../life-validation.ts';
import type { LifeChatInput, LifeChatTurn } from '../types.ts';
import type { LifeResult } from './life-service.ts';

export type LifeChatRepository = {
  list: (userId: string) => Promise<LifeChatTurn[]>;
  send: (userId: string, input: LifeChatInput, now: Date) => Promise<LifeChatTurn>;
};
type Row = { id: string; message: string; created_at: string | Date; response_code: 'chat_not_available' };
const mapTurn = (row: Row): LifeChatTurn => ({ id: row.id, message: row.message, createdAt: new Date(row.created_at).toISOString(), responseCode: row.response_code });

export class PostgresLifeChatRepository implements LifeChatRepository {
  private readonly sql?: NeonQueryFunction<false, false>;
  constructor(sql?: NeonQueryFunction<false, false>) { this.sql = sql; }
  async list(userId: string) {
    const rows = await (this.sql ?? getSql()).query(
      `SELECT id, message, created_at, response_code FROM daily_life_chat_turns
       WHERE user_id = $1 ORDER BY created_at DESC, id DESC`, [userId],
    ) as Row[];
    return rows.map(mapTurn);
  }
  async send(userId: string, input: LifeChatInput, now: Date) {
    const rows = await (this.sql ?? getSql()).query(
      `INSERT INTO daily_life_chat_turns (user_id, capture_key, message, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, capture_key) DO UPDATE SET capture_key = EXCLUDED.capture_key
       RETURNING id, message, created_at, response_code`, [userId, input.captureKey, input.message, now],
    ) as Row[];
    return mapTurn(rows[0]);
  }
}

export function createLifeChatService(repository: LifeChatRepository = new PostgresLifeChatRepository(), now = () => new Date()) {
  async function run<T>(command: string, action: () => Promise<T>): Promise<LifeResult<T>> {
    try { return { ok: true, data: await action() }; }
    catch (error) {
      console.error('[daily-life-chat]', command, { errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown' });
      return { ok: false, code: 'life_unavailable', message: 'Chat is unavailable. Please try again.', category: command === 'list' ? 'database_connection' : 'database_update' };
    }
  }
  return {
    list: (userId: string) => run('list', () => repository.list(userId)),
    async send(userId: string, input: LifeChatInput): Promise<LifeResult<LifeChatTurn>> {
      if (!input || !isLifeId(input.captureKey) || typeof input.message !== 'string' || !input.message.trim() || Array.from(input.message.trim()).length > 2000) {
        return { ok: false, code: 'life_chat_invalid', message: 'Enter a message with 1–2000 characters.', category: 'invalid_parameter' };
      }
      return run('send', () => repository.send(userId, { ...input, message: input.message.trim() }, now()));
    },
  };
}
export const lifeChatService = createLifeChatService();
