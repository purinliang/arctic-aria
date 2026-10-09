import { lifeActivities } from './types.ts';
import type { LifeInput } from './types.ts';
import type { ActionFailureResult } from '../../messages/action-result.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isLifeId = (value: unknown): value is string => typeof value === 'string' && uuid.test(value);

export function validateLifeInput(input: LifeInput, now: Date):
  | { ok: true; input: LifeInput & { occurredAt: string } }
  | ActionFailureResult {
  const fail = (code: string, message: string): ActionFailureResult => ({
    ok: false, code, message, category: 'invalid_parameter',
  });
  if (!input || !isLifeId(input.captureKey) || (input.id !== undefined && !isLifeId(input.id))) {
    return fail('life_invalid', 'This entry is invalid.');
  }
  if (!lifeActivities.includes(input.activity)) return fail('life_invalid', 'Choose a daily-life activity.');
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 1440) {
    return fail('life_duration_invalid', 'Enter a duration from 1 to 1440 whole minutes.');
  }
  if (input.note != null && typeof input.note !== 'string') return fail('life_invalid', 'This note is invalid.');
  const note = input.note?.trim() || null;
  if (note && Array.from(note).length > 500) return fail('life_note_long', 'Use 500 characters or fewer.');
  const occurredAt = input.occurredAt ?? now.toISOString();
  if (typeof occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(occurredAt)) {
    return fail('life_time_invalid', 'Choose a valid date and time.');
  }
  const time = new Date(occurredAt);
  if (!Number.isFinite(time.getTime()) || time.toISOString().slice(0, 19) !== occurredAt.slice(0, 19) || time.getUTCFullYear() < 1900) {
    return fail('life_time_invalid', 'Choose a valid date and time.');
  }
  if (time > now) return fail('life_future', 'Record an activity that has already happened.');
  return { ok: true, input: { ...input, note, occurredAt: time.toISOString() } };
}
