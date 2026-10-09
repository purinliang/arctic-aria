import assert from 'node:assert/strict';
import test from 'node:test';
import { clearMoneyBrowserCache, moneyBrowserCacheKey, readMoneyBrowserCache, writeMoneyBrowserCache } from '../money-browser-cache.ts';
import type { MoneyData } from '../types.ts';

const scope = { userId: 'test-user',timezone: 'Australia/Sydney' };
const day = { mode: 'day' as const,date: '2026-10-08' };
const data: MoneyData = { categories: [],expenses: [],settings: { preferredCurrencies: ['AUD','CNY'],quickCategoryIds: [] } };
test('Money caches note counts while accepting older snapshots without counts',() => {
  const store = storage(), notes = { ...data,noteUsage: [{ categoryId: 'food',note: 'Groceries',count: 3 }] };
  writeMoneyBrowserCache(scope,day,notes,store);
  assert.deepEqual(readMoneyBrowserCache(scope,day,store),notes);
  for (const count of [0,-1,1.5,'3']) {
    store.setItem(moneyBrowserCacheKey(scope.userId),JSON.stringify({ schemaVersion: 1,...scope,views: [{ period: day,data: { ...notes,noteUsage: [{ ...notes.noteUsage[0],count }] } }] }));
    assert.equal(readMoneyBrowserCache(scope,day,store),null);
  }
});
function storage() {
  const values = new Map<string,string>();
  return { getItem: (key: string) => values.get(key) ?? null,setItem: (key: string,value: string) => { values.set(key,value); },removeItem: (key: string) => { values.delete(key); } };
}
test('Money caches account-scoped empty snapshots and separates day, month, and timezone', () => {
  const store = storage();
  writeMoneyBrowserCache(scope,day,data,store);
  assert.deepEqual(readMoneyBrowserCache(scope,day,store),data);
  assert.equal(readMoneyBrowserCache({ ...scope,userId: 'other' },day,store),null);
  assert.equal(readMoneyBrowserCache(scope,{ ...day,mode: 'month' },store),null);
  assert.equal(readMoneyBrowserCache(scope,{ ...day,date: '2026-10-09' },store),null);
  assert.equal(readMoneyBrowserCache({ ...scope,timezone: 'UTC' },day,store),null);
});
test('Money caches at most four views and normalizes month reference dates', () => {
  const store = storage();
  writeMoneyBrowserCache(scope,{ mode: 'month',date: '2026-10-08' },data,store);
  assert.deepEqual(readMoneyBrowserCache(scope,{ mode: 'month',date: '2026-10-31' },store),data);
  for (const date of ['2026-10-01','2026-10-02','2026-10-03','2026-10-04']) writeMoneyBrowserCache(scope,{ mode: 'day',date },data,store);
  assert.equal(readMoneyBrowserCache(scope,{ mode: 'month',date: '2026-10-08' },store),null);
  assert.equal(JSON.parse(store.getItem(moneyBrowserCacheKey(scope.userId))!).views.length,4);
  clearMoneyBrowserCache(scope.userId,store);
  assert.equal(readMoneyBrowserCache(scope,{ mode: 'day',date: '2026-10-04' },store),null);
});
test('Money rejects corrupt, wrong-owner, unsupported-currency and malformed snapshots', () => {
  const store = storage(), key = moneyBrowserCacheKey(scope.userId);
  for (const value of ['invalid', JSON.stringify({ schemaVersion: 1,...scope,userId: 'other',views: [] }),
    JSON.stringify({ schemaVersion: 1,...scope,views: [{ period: day,data: { ...data,settings: { preferredCurrencies: ['BTC'],quickCategoryIds: [] } } }] }),
    JSON.stringify({ schemaVersion: 1,...scope,views: [{ period: day,data: { ...data,expenses: [{}] } }] })]) {
    store.setItem(key,value);
    assert.equal(readMoneyBrowserCache(scope,day,store),null);
    assert.equal(store.getItem(key),null);
  }
});
test('Money caching tolerates blocked or unavailable storage', () => {
  const blocked = { getItem() { throw new Error('Blocked'); },setItem() { throw new Error('Full'); },removeItem() { throw new Error('Blocked'); } };
  assert.equal(readMoneyBrowserCache(scope,day,blocked),null);
  assert.doesNotThrow(() => writeMoneyBrowserCache(scope,day,data,blocked));
  assert.doesNotThrow(() => clearMoneyBrowserCache(scope.userId,blocked));
  assert.equal(readMoneyBrowserCache(scope,day,null),null);
});
