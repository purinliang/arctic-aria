import assert from 'node:assert/strict';
import test from 'node:test';
import { progressBrowserCacheKey, readProgressBrowserCache, writeProgressBrowserCache } from '../progress-browser-cache.ts';
import type { LifeEntry } from '../types.ts';

const scope = { userId: 'test-user',dayKey: '2026-10-08',timezone: 'Australia/Sydney' };
const entry: LifeEntry = { id: 'test-entry',activity: 'work',durationMinutes: 30,occurredAt: '2026-10-08T01:00:00Z',note: null };
function storage() {
  const values = new Map<string,string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string,value: string) => { values.set(key,value); },removeItem: (key: string) => { values.delete(key); } };
}
test('Progress cache stores entries and empty snapshots separately for each account', () => {
  const store = storage();
  writeProgressBrowserCache(scope,[entry],store);
  assert.deepEqual(readProgressBrowserCache(scope,store),[entry]);
  assert.equal(readProgressBrowserCache({ ...scope,userId: 'other-user' },store),null);
  writeProgressBrowserCache({ ...scope,userId: 'other-user' },[],store);
  assert.deepEqual(readProgressBrowserCache({ ...scope,userId: 'other-user' },store),[]);
  assert.deepEqual(readProgressBrowserCache(scope,store),[entry]);
});
test('Progress cache rejects a previous local day or different timezone', () => {
  for (const patch of [{ dayKey: '2026-10-09' },{ timezone: 'UTC' }]) {
    const store = storage();
    writeProgressBrowserCache(scope,[entry],store);
    assert.equal(readProgressBrowserCache({ ...scope,...patch },store),null);
    assert.equal(store.getItem(progressBrowserCacheKey(scope.userId)),null);
  }
});
test('Progress cache discards corrupt, wrong-owner, unsupported, and malformed snapshots', () => {
  const store = storage(), key = progressBrowserCacheKey(scope.userId);
  const envelope = { schemaVersion: 1,...scope,entries: [entry] };
  for (const value of ['invalid', JSON.stringify({ ...envelope,userId: 'other-user' }),JSON.stringify({ ...envelope,schemaVersion: 2 }),
    JSON.stringify({ ...envelope,entries: [{ ...entry,activity: 'meal' }] }),JSON.stringify({ ...envelope,entries: [{ ...entry,durationMinutes: '30' }] }),
    JSON.stringify({ ...envelope,entries: [{ ...entry,occurredAt: 'invalid' }] }),JSON.stringify({ ...envelope,entries: [{ ...entry,id: 'pending-fixture' }] })]) {
    store.setItem(key,value);
    assert.equal(readProgressBrowserCache(scope,store),null);
    assert.equal(store.getItem(key),null);
  }
});
test('Progress cache tolerates unavailable or blocked browser storage', () => {
  const blocked = { getItem() { throw new Error('Blocked'); },setItem() { throw new Error('Full'); },removeItem() { throw new Error('Blocked'); } };
  assert.equal(readProgressBrowserCache(scope,blocked),null);
  assert.doesNotThrow(() => writeProgressBrowserCache(scope,[entry],blocked));
  assert.equal(readProgressBrowserCache(scope,null),null);
  assert.doesNotThrow(() => writeProgressBrowserCache(scope,[entry],null));
});
test('Progress cache replaces edited records and persists deletion', () => {
  const store = storage();
  writeProgressBrowserCache(scope,[entry],store);
  writeProgressBrowserCache(scope,[{ ...entry,durationMinutes: 45,note: 'Edited fixture' }],store);
  assert.equal(readProgressBrowserCache(scope,store)?.[0].durationMinutes,45);
  writeProgressBrowserCache(scope,[],store);
  assert.deepEqual(readProgressBrowserCache(scope,store),[]);
});
