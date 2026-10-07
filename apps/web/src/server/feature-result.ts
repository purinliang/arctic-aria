import type { ActionFailureResult } from '../messages/action-result.ts';

export type FeatureResult<T> = { ok: true; data: T } | ActionFailureResult;
export const validId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function failure(code: string, category: ActionFailureResult['category'] = 'invalid_parameter'): ActionFailureResult {
  return { ok: false, code, category, message: code };
}
export async function featureCommand<T>(feature: string, command: () => Promise<T>, category: ActionFailureResult['category'] = 'database_update'): Promise<FeatureResult<T>> {
  try { return { ok: true, data: await command() }; }
  catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unknown';
    console.error(`[${feature}]`, { errorCode: code });
    return failure(code === '23503' || code === '23514' || code === '23505' ? 'invalid' : 'unavailable', category);
  }
}
