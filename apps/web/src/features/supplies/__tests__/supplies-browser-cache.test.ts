import assert from 'node:assert/strict';
import test from 'node:test';
import { clearSuppliesBrowserCache, mergeConfirmedSupplies, readSuppliesBrowserCache, suppliesBrowserCacheKey, writeSuppliesBrowserCache } from '../supplies-browser-cache.ts';
import type { SuppliesData } from '../types.ts';

const data: SuppliesData = { items: [{ id: 'test-item',kind: 'household',title: 'Soap',note: null,level: 3,spares: 1,version: 2,cycleId: 'test-cycle',observations: [],quantity: 1.5,unit: 'kg',increment: 0.5,targetQuantity: 3,lowStockThreshold: 1 }],wishlist: [] };
function storage() {
  const values = new Map<string,string>();
  return { getItem: (key: string) => values.get(key) ?? null,setItem: (key: string,value: string) => { values.set(key,value); },removeItem: (key: string) => { values.delete(key); } };
}
test('Supplies caches confirmed and empty snapshots separately for each account', () => {
  const store = storage();
  writeSuppliesBrowserCache('test-user',data,store);
  assert.deepEqual(readSuppliesBrowserCache('test-user',store),data);
  assert.equal(readSuppliesBrowserCache('other-user',store),null);
  writeSuppliesBrowserCache('other-user',{ items: [],wishlist: [] },store);
  assert.deepEqual(readSuppliesBrowserCache('other-user',store),{ items: [],wishlist: [] });
  clearSuppliesBrowserCache('test-user',store);
  assert.equal(readSuppliesBrowserCache('test-user',store),null);
});
test('Supplies rejects corrupt, wrong-owner, malformed and optimistic snapshots', () => {
  const store = storage(), key = suppliesBrowserCacheKey('test-user');
  for (const value of ['invalid',JSON.stringify({ schemaVersion: 2,userId: 'other-user',data }),
    JSON.stringify({ schemaVersion: 2,userId: 'test-user',data: { ...data,items: [{ ...data.items[0],cycleId: 'pending-fixture' }] } }),
    JSON.stringify({ schemaVersion: 2,userId: 'test-user',data: { ...data,items: [{ ...data.items[0],quantity: -1 }] } }),
    JSON.stringify({ schemaVersion: 2,userId: 'test-user',data: { ...data,items: [{ ...data.items[0],increment: 0 }] } })]) {
    store.setItem(key,value);
    assert.equal(readSuppliesBrowserCache('test-user',store),null);
    assert.equal(store.getItem(key),null);
  }
});
test('Supplies refresh keeps locked or newer confirmed rows, but accepts removals', () => {
  const older = { items: [{ ...data.items[0],version: 1,level: 5 }],wishlist: [] };
  assert.deepEqual(mergeConfirmedSupplies(data,older,new Set()),data);
  assert.deepEqual(mergeConfirmedSupplies(data,{ items: [],wishlist: [] },new Set(['test-item'])),data);
  assert.deepEqual(mergeConfirmedSupplies(data,{ items: [],wishlist: [] },new Set()),{ items: [],wishlist: [] });
  assert.deepEqual(mergeConfirmedSupplies(null,data,new Set()),data);
});
test('Supplies caching tolerates blocked or unavailable storage', () => {
  const blocked = { getItem() { throw new Error('Blocked'); },setItem() { throw new Error('Full'); },removeItem() { throw new Error('Blocked'); } };
  assert.equal(readSuppliesBrowserCache('test-user',blocked),null);
  assert.doesNotThrow(() => writeSuppliesBrowserCache('test-user',data,blocked));
  assert.doesNotThrow(() => clearSuppliesBrowserCache('test-user',blocked));
  assert.equal(readSuppliesBrowserCache('test-user',null),null);
});
