import assert from 'node:assert/strict';
import test from 'node:test';
import { StockLevelQueue } from '../stock-level-queue.ts';
import type { SupplyInput, SupplyItem } from '../types.ts';

const item: SupplyItem = { id: 'stock',title: 'Fixture',kind: 'food',note: null,level: 5,spares: 0,version: 1,cycleId: 'cycle',observations: [],
  quantity: 5,unit: 'unit',increment: 1,targetQuantity: 5,lowStockThreshold: 1 };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise,resolve }; }

test('rapid interactions serialize versioned writes and coalesce intermediate intent',async () => {
  const queue = new StockLevelQueue(), gate = deferred<SupplyItem | null>();
  const writes: SupplyInput[] = [], previews: number[] = [], versions: number[] = [];
  const callbacks = {
    save: async (input: SupplyInput) => { writes.push(input); return writes.length === 1 ? gate.promise : { ...item,quantity: input.quantity,version: input.version + 1 }; },
    read: async () => item,visible: (_item: SupplyItem,level: number) => { previews.push(level); },
    confirmed: (item: SupplyItem) => { versions.push(item.version); },settled: () => {},
  };
  const completion = queue.enqueue(item,0,callbacks);
  void queue.enqueue(item,2,callbacks);
  void queue.enqueue(item,4,callbacks);
  assert.equal(writes.length,1);
  assert.equal(previews.at(-1),4);
  gate.resolve({ ...item,quantity: 0,version: 2 });
  await completion;
  assert.deepEqual(writes.map((input) => [input.quantity,input.version]),[[0,1],[4,2]]);
  assert.deepEqual(versions,[2,3]);
  assert.equal(previews.slice(2).every((level) => level === 4),true,'earlier response cannot overwrite latest intent');
});
test('different items can finish out of order without interfering',async () => {
  const queue = new StockLevelQueue(), slow = deferred<SupplyItem | null>(), seen = new Map<string,number>();
  const callbacks = {
    save: async (input: SupplyInput) => input.id === 'stock' ? slow.promise : { ...item,id: input.id,quantity: input.quantity,version: 2 },
    read: async () => item,visible: (item: SupplyItem,level: number) => { seen.set(item.id,level); },confirmed: () => {},settled: () => {},
  };
  const first = queue.enqueue(item,0,callbacks);
  await queue.enqueue({ ...item,id: 'other' },2,callbacks);
  assert.equal(seen.get('other'),2);
  slow.resolve({ ...item,quantity: 0,version: 2 }); await first;
  assert.deepEqual([...seen.values()],[0,2]);
});
test('failed earlier write rebases and persists the newest intent, not the old value',async () => {
  const queue = new StockLevelQueue(), gate = deferred<SupplyItem | null>(), writes: SupplyInput[] = [];
  const callbacks = {
    save: async (input: SupplyInput) => { writes.push(input); return writes.length === 1 ? gate.promise : { ...item,quantity: input.quantity,version: input.version + 1 }; },
    read: async () => ({ ...item,quantity: 1,version: 7 }),visible: () => {},confirmed: () => {},settled: () => {},
  };
  const completion = queue.enqueue(item,0,callbacks); void queue.enqueue(item,3,callbacks);
  gate.resolve(null); await completion;
  assert.deepEqual(writes.map((input) => [input.quantity,input.version]),[[0,1],[3,7]]);
});
test('uncertain committed write is resolved without an extra update',async () => {
  let writes = 0, value = 5;
  await new StockLevelQueue().enqueue(item,2,{
    save: async () => { writes++; return null; },read: async () => ({ ...item,quantity: 2,version: 2 }),
    visible: (_item,level) => { value = level; },confirmed: () => {},settled: () => {},
  });
  assert.equal(writes,1); assert.equal(value,2);
});
test('repeated failure rolls back to confirmed stock and allows another interaction',async () => {
  const queue = new StockLevelQueue(); let value = 5, writes = 0, settled = 0, errors = 0;
  const callbacks = { save: async () => { writes++; return null; },read: async () => item,
    visible: (_item: SupplyItem,level: number) => { value = level; },confirmed: () => {},settled: () => { settled++; },failed: () => { errors++; } };
  await queue.enqueue(item,0,callbacks);
  assert.equal(writes,2); assert.equal(value,5); assert.equal(settled,1);
  assert.equal(errors,1,'only final failure needs feedback');
  await queue.enqueue(item,4,{ ...callbacks,save: async () => ({ ...item,quantity: 4,version: 2 }) });
  assert.equal(value,4); assert.equal(settled,2);
});
