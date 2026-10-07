'use server';
import { getCurrentUser } from '../auth/actions';
import { loadUserResolvedTimeZone } from '../settings/server/user-time-zone';
import { localDateKey } from '../settings/time-zones';
import { failure, featureCommand, validId } from '../../server/feature-result';
import { validExpense, validMoneySettings, validPeriod } from './money';
import type { ExpenseInput, MoneyPeriod, MoneySettings } from './types';
import { MoneyRepository } from './server/money-repository';

export async function getMoneyData(period: MoneyPeriod) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required', 'auth');
  return validPeriod(period) ? featureCommand('money', () => new MoneyRepository().data(user.id, period), 'database_connection') : failure('invalid');
}
export async function saveExpense(input: ExpenseInput) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required', 'auth');
  const today = localDateKey(new Date(), await loadUserResolvedTimeZone(user.id));
  if (!validExpense(input, today)) return failure('invalid');
  const result = await featureCommand('money', () => new MoneyRepository().save(user.id, input));
  return result.ok && !result.data ? failure('missing', 'not_found') : result;
}
export async function archiveExpense(id: string) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required', 'auth');
  if (!validId(id)) return failure('invalid');
  const result = await featureCommand('money', () => new MoneyRepository().archive(user.id, id));
  return result.ok && !result.data ? failure('missing', 'not_found') : result;
}
export async function saveMoneySettings(settings: MoneySettings) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required', 'auth');
  if (!validMoneySettings(settings)) return failure('invalid');
  const result = await featureCommand('money', () => new MoneyRepository().settings(user.id, settings));
  return result.ok && !result.data ? failure('invalid') : result;
}
export async function saveMoneyCategory(input: { id: string; name: string; isNew: boolean }) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required', 'auth');
  if (!input || !validId(input.id) || typeof input.name !== 'string' || !input.name.trim() || Array.from(input.name.trim()).length > 100 || typeof input.isNew !== 'boolean') return failure('invalid');
  const result = await featureCommand('money', () => new MoneyRepository().category(user.id, input.id, input.name, input.isNew));
  return result.ok && !result.data ? failure('missing', 'not_found') : result;
}
export async function archiveMoneyCategory(id: string) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required', 'auth');
  if (!validId(id)) return failure('invalid');
  const result = await featureCommand('money', () => new MoneyRepository().archiveCategory(user.id, id));
  return result.ok && !result.data ? failure('missing', 'not_found') : result;
}
