import assert from 'node:assert/strict';
import test from 'node:test';
import { adjustedQuantity, needsAttention, stockQuantity, validQuantity, validQuantityCommand, validSupply } from '../supplies.ts';
import type { SupplyItem } from '../types.ts';
const id = '11111111-1111-4111-8111-111111111111';
const item: SupplyItem = { id,kind: 'food',title: 'Rice',note: null,level: 3,spares: 0,version: 1,cycleId: id,observations: [],
  quantity: 1.5,unit: 'kg',increment: 0.5,targetQuantity: 2,lowStockThreshold: 1 };
test('fractional quantities use exact configured steps, allow excess, and clamp at zero',() => {
  const stock = stockQuantity(item);
  assert.equal(adjustedQuantity(stock,-1),1);
  assert.equal(adjustedQuantity({ ...stock,quantity: 2 },1),2.5);
  assert.equal(adjustedQuantity({ ...stock,quantity: 0.2,increment: 0.1 },1),0.3);
  assert.equal(adjustedQuantity({ ...stock,quantity: 0.2 },-1),0);
});
test('restocking uses the inclusive configured threshold, not estimates or spares',() => {
  assert.equal(needsAttention(item),false);
  assert.equal(needsAttention({ ...item,quantity: 1 }),true);
  assert.equal(needsAttention({ ...item,quantity: 1.001,spares: 99 }),false);
  assert.equal(needsAttention({ ...item,quantity: 0,lowStockThreshold: 0 }),true);
});
test('configuration rejects unsupported precision, invalid units, thresholds and steps',() => {
  const stock = stockQuantity(item);
  assert.equal(validQuantity(stock),true);
  for (const patch of [{ increment: 0 },{ quantity: -1 },{ quantity: 0.0001 },{ quantity: Infinity },{ quantity: 1000000 },{ unit: ' ' },{ lowStockThreshold: 3 },{ targetQuantity: 0 }]) {
    assert.equal(validQuantity({ ...stock,...patch }),false);
    assert.equal(validSupply({ ...item,...patch,note: '',isNew: true }),false);
  }
  assert.equal(validQuantityCommand({ id,key: id,version: 1,direction: 1 }),true);
  assert.equal(validQuantityCommand({ id,key: id,version: 1,direction: 0 as 1 }),false);
});
test('legacy levels are preserved as neutral quantities without inventing pack sizes',() => {
  assert.deepEqual(stockQuantity({ level: 3 }),{ quantity: 3,unit: 'unit',increment: 1,targetQuantity: 5,lowStockThreshold: 1 });
});
