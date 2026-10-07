import { browserStorage, readBrowserSnapshot, writeBrowserSnapshot, clearBrowserSnapshot } from '../../app-shell/browser-snapshot-cache.ts';
import type { SuppliesData, SupplyItem, WishItem } from './types.ts';
import { validQuantity } from './supplies.ts';

export const suppliesBrowserCacheKey = (userId: string) => `arctic-aria.supplies-browser-cache.v2.${encodeURIComponent(userId)}`;
const nullable = (value: unknown) => value === null || typeof value === 'string';
function validData(value: unknown): value is SuppliesData {
  if (!value || typeof value !== 'object') return false;
  const data = value as SuppliesData;
  return Array.isArray(data.items) && data.items.every((item) => item && typeof item.id === 'string' && typeof item.title === 'string'
    && ['food','household'].includes(item.kind) && Number.isInteger(item.level) && item.level >= 0 && item.level <= 5
    && Number.isInteger(item.spares) && item.spares >= 0 && item.spares <= 999 && Number.isInteger(item.version) && item.version > 0
    && validQuantity(item as Required<Pick<SupplyItem,'quantity' | 'unit' | 'increment' | 'targetQuantity' | 'lowStockThreshold'>>)
    && nullable(item.note) && typeof item.cycleId === 'string' && !item.cycleId.startsWith('pending-')
    && Array.isArray(item.observations) && item.observations.every((point) => point && typeof point.id === 'string' && typeof point.cycleId === 'string'
      && Number.isInteger(point.level) && point.level >= 0 && point.level <= 5 && typeof point.recordedAt === 'string' && Number.isFinite(Date.parse(point.recordedAt))))
    && Array.isArray(data.wishlist) && data.wishlist.every((item) => item && typeof item.id === 'string' && typeof item.title === 'string'
      && ['planned','purchased'].includes(item.status) && Number.isInteger(item.version) && item.version > 0
      && [item.country,item.shop,item.note,item.linkedSupplyId].every(nullable)
      && (item.url === null || (typeof item.url === 'string' && /^https?:\/\//.test(item.url))));
}
export function readSuppliesBrowserCache(userId: string, storage = browserStorage()) {
  clearBrowserSnapshot(`arctic-aria.supplies-browser-cache.v1.${encodeURIComponent(userId)}`,storage);
  return readBrowserSnapshot<{ schemaVersion: 2; userId: string; data: SuppliesData }>(suppliesBrowserCacheKey(userId),(value): value is { schemaVersion: 2; userId: string; data: SuppliesData } => {
    if (!value || typeof value !== 'object') return false;
    const snapshot = value as { schemaVersion: number; userId: string; data: unknown };
    return snapshot.schemaVersion === 2 && snapshot.userId === userId && validData(snapshot.data);
  },storage)?.data ?? null;
}
export function writeSuppliesBrowserCache(userId: string, data: SuppliesData, storage = browserStorage()) {
  writeBrowserSnapshot(suppliesBrowserCacheKey(userId),{ schemaVersion: 2,userId,data },storage);
}
export function clearSuppliesBrowserCache(userId: string, storage = browserStorage()) {
  clearBrowserSnapshot(suppliesBrowserCacheKey(userId),storage);
}
export function mergeConfirmedSupplies(current: SuppliesData | null, next: SuppliesData, preserved: Set<string>): SuppliesData {
  if (!current) return next;
  function merge<T extends SupplyItem | WishItem>(previous: T[], incoming: T[]) {
    const versions = new Map(incoming.map((item) => [item.id,item.version]));
    const protectedIds = new Set(previous.filter((item) => preserved.has(item.id) || (versions.has(item.id) && versions.get(item.id)! < item.version)).map((item) => item.id));
    return [...previous.filter((item) => protectedIds.has(item.id)),...incoming.filter((item) => !protectedIds.has(item.id))];
  }
  return { items: merge(current.items,next.items),wishlist: merge(current.wishlist,next.wishlist) };
}
