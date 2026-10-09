import assert from 'node:assert/strict';
import test from 'node:test';
import { compareStock, isLevelStock, levelInput, stockSeverity } from '../stock-level.ts';
import type { SupplyItem } from '../types.ts';
const item: SupplyItem = { id: '11111111-1111-4111-8111-111111111111',kind: 'food',title: 'Rice',level: 5,
  note: null,spares: 2,version: 7,cycleId: 'cycle',observations: [],quantity: 5,unit: 'unit',increment: 1,targetQuantity: 5,lowStockThreshold: 1 };
test('only the neutral integer 0–5 configuration is editable as a stock level',() => {
  assert.equal(isLevelStock(item),true);
  for (const patch of [{ unit: 'kg' },{ quantity: 0.5 },{ quantity: 6 },{ targetQuantity: 10 },{ increment: 0.5 },{ lowStockThreshold: 2 }]) {
    const legacy = { ...item,...patch };
    assert.equal(isLevelStock(legacy),false);
    assert.equal(levelInput(legacy,3),null);
  }
});
test('level commands retain version, settings, spares and original history',() => {
  assert.deepEqual(levelInput(item,0),{ ...item,quantity: 0,note: '',isNew: false });
  assert.deepEqual(levelInput(item,5),{ ...item,note: '',isNew: false });
  for (const level of [-1,6,1.5,NaN]) assert.equal(levelInput(item,level),null);
  assert.equal(item.quantity,5);
});
test('severity, category and alphabetical title form one stable global order',() => {
  const make = (title: string,quantity: number,kind: SupplyItem['kind']): SupplyItem => ({ ...item,title,quantity,kind,id: title });
  const rows = [make('B',5,'food'),make('A',2,'food'),make('Z',0,'household'),make('C',1,'food'),make('B',0,'food'),make('A',4,'household')];
  assert.deepEqual(rows.sort(compareStock).map((row) => `${row.kind}:${row.title}`),['food:B','food:C','household:Z','food:A','food:B','household:A']);
  assert.deepEqual([0,1,2,3,4,5].map((quantity) => stockSeverity({ ...item,quantity })),[0,0,1,2,2,2]);
  assert.equal(stockSeverity({ ...item,unit: 'kg',quantity: 0.5 }),1);
});
