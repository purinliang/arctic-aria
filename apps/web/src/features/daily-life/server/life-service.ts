import { isLifeId, validateLifeInput } from '../life-validation.ts';
import type { LifeEntry, LifeInput, LifeRepository } from '../types.ts';
import type { ActionFailureResult } from '../../../messages/action-result.ts';
import { PostgresLifeRepository } from './life-repository.ts';

export type LifeResult<T> = { ok: true; data: T } | ActionFailureResult;
const missing = (): ActionFailureResult => ({ ok: false, code: 'life_missing', message: 'This entry was not found.', category: 'not_found' });

export function createLifeService(repository: LifeRepository = new PostgresLifeRepository(), now = () => new Date()) {
  async function run<T>(command: string, action: () => Promise<T>): Promise<LifeResult<T>> {
    try { return { ok: true, data: await action() }; }
    catch (error) {
      console.error('[daily-life]', command, { errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown' });
      return { ok: false, code: 'life_unavailable', message: 'Daily Life is unavailable. Please try again.', category: command === 'list' ? 'database_connection' : 'database_update' };
    }
  }
  return {
    list: (userId: string, timezone: string) => run('list', () => repository.list(userId, timezone, now())),
    async save(userId: string, input: LifeInput): Promise<LifeResult<LifeEntry>> {
      const time = now();
      const valid = validateLifeInput(input, time);
      if (!valid.ok) return valid;
      const result = await run('save', () => repository.save(userId, valid.input, time));
      return result.ok ? result.data ? { ok: true, data: result.data } : missing() : result;
    },
    async archive(userId: string, id: string): Promise<LifeResult<string>> {
      if (!isLifeId(id)) return { ok: false, code: 'life_invalid', message: 'This entry is invalid.', category: 'invalid_parameter' };
      const result = await run('archive', () => repository.archive(userId, id, now()));
      return result.ok ? result.data ? { ok: true, data: id } : missing() : result;
    },
  };
}
export const lifeService = createLifeService();
