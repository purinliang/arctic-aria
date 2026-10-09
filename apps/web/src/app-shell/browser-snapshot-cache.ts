export type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function browserStorage(): BrowserStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}
export function clearBrowserSnapshot(key: string, storage = browserStorage()) {
  try { storage?.removeItem(key); } catch { /* Browser storage is optional. */ }
}
export function readBrowserSnapshot<T>(key: string, valid: (value: unknown) => value is T, storage = browserStorage()): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (valid(value)) return value;
  } catch { /* Use live data when storage is blocked or corrupt. */ }
  clearBrowserSnapshot(key,storage);
  return null;
}
export function writeBrowserSnapshot(key: string, value: unknown, storage = browserStorage()) {
  try { storage?.setItem(key,JSON.stringify(value)); } catch { /* Live data remains usable. */ }
}
