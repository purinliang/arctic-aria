import { clearBrowserSnapshot, readBrowserSnapshot, writeBrowserSnapshot, browserStorage } from '../../app-shell/browser-snapshot-cache.ts';
import { currencies, seedCategories } from './types.ts';
import type { MoneyData, MoneyPeriod } from './types.ts';
import { validPeriod } from './money.ts';

type Scope = { userId: string; timezone: string };
type Snapshot = Scope & { schemaVersion: 1; views: { period: MoneyPeriod; data: MoneyData }[] };
export const moneyBrowserCacheKey = (userId: string) => `arctic-aria.money-browser-cache.v1.${encodeURIComponent(userId)}`;
export function moneyPeriodKey(period: MoneyPeriod) {
  return `${period.mode}:${period.mode === 'month' ? period.date.slice(0,7) : period.date}`;
}
function validData(value: unknown): value is MoneyData {
  if (!value || typeof value !== 'object') return false;
  const data = value as MoneyData;
  return Array.isArray(data.categories) && data.categories.every((item) => item && typeof item.id === 'string'
    && (item.name === null || typeof item.name === 'string') && (item.seedKey === null || seedCategories.includes(item.seedKey)) && typeof item.archived === 'boolean')
    && !!data.settings && Array.isArray(data.settings.preferredCurrencies) && data.settings.preferredCurrencies.length > 0
    && data.settings.preferredCurrencies.every((currency) => currencies.includes(currency))
    && Array.isArray(data.settings.quickCategoryIds) && data.settings.quickCategoryIds.every((id) => typeof id === 'string')
    && Array.isArray(data.expenses) && data.expenses.every((item) => item && typeof item.id === 'string' && typeof item.categoryId === 'string'
      && currencies.includes(item.currency) && Number.isSafeInteger(item.amountMinor) && item.amountMinor > 0
      && typeof item.date === 'string' && validPeriod({ mode: 'day',date: item.date }) && (item.note === null || typeof item.note === 'string'));
}
function read(scope: Scope, storage: ReturnType<typeof browserStorage>) {
  return readBrowserSnapshot<Snapshot>(moneyBrowserCacheKey(scope.userId),(value): value is Snapshot => {
    if (!value || typeof value !== 'object') return false;
    const snapshot = value as Snapshot;
    return snapshot.schemaVersion === 1 && snapshot.userId === scope.userId && snapshot.timezone === scope.timezone
      && Array.isArray(snapshot.views) && snapshot.views.length <= 4
      && snapshot.views.every((view) => view && validPeriod(view.period) && validData(view.data));
  },storage);
}
export function readMoneyBrowserCache(scope: Scope, period: MoneyPeriod, storage = browserStorage()) {
  return read(scope,storage)?.views.find((view) => moneyPeriodKey(view.period) === moneyPeriodKey(period))?.data ?? null;
}
export function writeMoneyBrowserCache(scope: Scope, period: MoneyPeriod, data: MoneyData, storage = browserStorage()) {
  const previous = read(scope,storage)?.views ?? [];
  writeBrowserSnapshot(moneyBrowserCacheKey(scope.userId),{ schemaVersion: 1,...scope,
    views: [{ period,data },...previous.filter((view) => moneyPeriodKey(view.period) !== moneyPeriodKey(period))].slice(0,4) },storage);
}
export function clearMoneyBrowserCache(userId: string, storage = browserStorage()) {
  clearBrowserSnapshot(moneyBrowserCacheKey(userId),storage);
}
