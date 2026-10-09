'use server';
import { getCurrentUser } from '../auth/actions';
import { failure, featureCommand, validId } from '../../server/feature-result';
import { validStock, validSupply, validWish, validQuantityCommand } from './supplies';
import type { StockCommand, SupplyInput, WishInput, QuantityCommand } from './types';
import { SuppliesRepository } from './server/supplies-repository';

export async function getSuppliesData() {
  const user = await getCurrentUser();
  return user ? featureCommand('supplies', () => new SuppliesRepository().data(user.id), 'database_connection') : failure('auth_required','auth');
}
export async function saveSupply(input: SupplyInput) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required','auth');
  if (!validSupply(input)) return failure('invalid');
  const result = await featureCommand('supplies', () => new SuppliesRepository().save(user.id,input));
  return result.ok ? result.data ? { ok: true as const, data: result.data } : failure('stale') : result;
}
export async function changeSupply(input: StockCommand) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required','auth');
  if (!validStock(input)) return failure('invalid');
  const result = await featureCommand('supplies', () => new SuppliesRepository().change(user.id,input));
  return result.ok ? 'error' in result.data ? failure(result.data.error) : { ok: true as const, data: result.data.item } : result;
}
export async function adjustSupplyQuantity(input: QuantityCommand) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required','auth');
  if (!validQuantityCommand(input)) return failure('invalid');
  const result = await featureCommand('supplies',() => new SuppliesRepository().adjust(user.id,input));
  return result.ok ? 'error' in result.data ? failure(result.data.error) : { ok: true as const,data: result.data.item } : result;
}
export async function getSupplyHistory(id: string) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required','auth');
  return validId(id) ? featureCommand('supplies', () => new SuppliesRepository().history(user.id,id), 'database_connection') : failure('invalid');
}
export async function archiveSupply(input: { id: string; version: number; wishlist: boolean }) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required','auth');
  if (!input || !validId(input.id) || !Number.isInteger(input.version) || input.version < 1 || input.version > 2_147_483_646 || typeof input.wishlist !== 'boolean') return failure('invalid');
  const result = await featureCommand('supplies', () => input.wishlist
    ? new SuppliesRepository().archiveWish(user.id,input.id,input.version) : new SuppliesRepository().archive(user.id,input.id,input.version));
  return result.ok && !result.data ? failure('stale') : result;
}
export async function saveWish(input: WishInput) {
  const user = await getCurrentUser();
  if (!user) return failure('auth_required','auth');
  if (!validWish(input)) return failure('invalid');
  const result = await featureCommand('supplies', () => new SuppliesRepository().saveWish(user.id,input));
  return result.ok ? result.data ? { ok: true as const, data: result.data } : failure('stale') : result;
}
