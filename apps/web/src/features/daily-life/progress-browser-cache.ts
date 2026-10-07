import { lifeActivities } from './types.ts';
import type { LifeEntry } from './types.ts';

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ProgressCacheScope = { userId: string; dayKey: string; timezone: string };
const prefix = 'arctic-aria.progress-browser-cache.v1';
export function progressBrowserCacheKey(userId: string) {
  return `${prefix}.${encodeURIComponent(userId)}`;
}
function browserStorage(): BrowserStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}
function validEntry(value: unknown): value is LifeEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as LifeEntry;
  return typeof entry.id === 'string' && !entry.id.startsWith('pending-')
    && lifeActivities.includes(entry.activity) && typeof entry.occurredAt === 'string'
    && Number.isFinite(Date.parse(entry.occurredAt)) && Number.isInteger(entry.durationMinutes)
    && entry.durationMinutes > 0 && (entry.note === null || typeof entry.note === 'string');
}
export function readProgressBrowserCache(scope: ProgressCacheScope, storage = browserStorage()): LifeEntry[] | null {
  if (!storage) return null;
  const key = progressBrowserCacheKey(scope.userId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value?.schemaVersion === 1 && value.userId === scope.userId
      && value.dayKey === scope.dayKey && value.timezone === scope.timezone
      && Array.isArray(value.entries) && value.entries.every(validEntry)) return value.entries;
  } catch { /* Fall back to the server when storage is blocked or corrupt. */ }
  try { storage.removeItem(key); } catch { /* Storage is optional. */ }
  return null;
}
export function writeProgressBrowserCache(scope: ProgressCacheScope, entries: LifeEntry[], storage = browserStorage()) {
  if (!storage) return;
  try { storage.setItem(progressBrowserCacheKey(scope.userId), JSON.stringify({ schemaVersion: 1, ...scope, entries })); }
  catch { /* Live data remains usable when storage is full or blocked. */ }
}
