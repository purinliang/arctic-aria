import assert from 'node:assert/strict';
import test from 'node:test';
import { depletion, needsAttention, validStock, validSupply, validWish } from '../supplies.ts';
import type { SupplyItem } from '../types.ts';
const id = '11111111-1111-4111-8111-111111111111';
const item: SupplyItem = { id,kind: 'household',title: 'Soap',note: null,spares: 2,version: 1,cycleId: id,level: 3,
  observations: [{ id: 'one',cycleId: id,level: 5,recordedAt: '2026-10-01T00:00:00.000Z' },{ id: 'two',cycleId: id,level: 3,recordedAt: '2026-10-03T00:00:00.000Z' }] };
test('two observations estimate active depletion without extending it by spares', () => {
  assert.deepEqual(depletion(item),{ state: 'estimated',at: new Date('2026-10-06T00:00:00.000Z') });
  assert.deepEqual(depletion({ ...item,spares: 100 }),depletion(item));
  assert.equal(needsAttention(item),false,'predicted depletion must not drive restocking');
});
test('only latest three observations in the active cycle contribute', () => {
  const points = [5,4,3,2].map((level,index) => ({ id: String(index),cycleId: id,level,recordedAt: new Date(Date.UTC(2026,9,[1,2,3,7][index])).toISOString() }));
  assert.deepEqual(depletion({ ...item,level: 2,observations: points }),{ state: 'estimated',at: new Date('2026-10-12T00:00:00.000Z') });
  assert.deepEqual(depletion({ ...item,cycleId: 'new-cycle' }),{ state: 'unknown' });
});
test('flat, insufficient, zero-time, and increasing history cannot predict depletion', () => {
  assert.deepEqual(depletion({ ...item,observations: item.observations.slice(0,1) }),{ state: 'unknown' });
  assert.deepEqual(depletion({ ...item,observations: item.observations.map((point) => ({ ...point,level: 3 })) }),{ state: 'unknown' });
  assert.deepEqual(depletion({ ...item,observations: item.observations.map((point) => ({ ...point,recordedAt: '2026-10-01T00:00:00.000Z' })) }),{ state: 'unknown' });
  assert.deepEqual(depletion({ ...item,observations: [{ ...item.observations[0],level: 1 },item.observations[1]] }),{ state: 'unknown' });
  assert.deepEqual(depletion({ ...item,level: 0 }),{ state: 'empty' });
  assert.equal(needsAttention({ ...item,level: 1,observations: [] }),true);
});
test('supply and command validation reject invalid levels, counts, versions, and ids', () => {
  const input = { id,isNew: true,kind: 'food' as const,title: 'Rice',note: '',level: 5,spares: 2,version: 1 };
  assert.equal(validSupply(input),true);
  for (const spares of [-1,1.5,1000,NaN]) assert.equal(validSupply({ ...input,spares }),false);
  assert.equal(validSupply({ ...input,title: ' ' }),false);
  assert.equal(validSupply({ ...input,level: 6 }),false);
  const command = { id,version: 1,key: id,operation: 'replace' as const,level: 5,useSpare: true };
  assert.equal(validStock(command),true);
  assert.equal(validStock({ ...command,key: 'bad' }),false);
  assert.equal(validStock({ ...command,version: 0 }),false);
});
test('travel links accept only owned-id-shaped references and HTTP URLs', () => {
  const input = { id,isNew: true,title: 'Travel fixture',country: null,shop: null,url: null,note: null,linkedSupplyId: null,status: 'planned' as const,version: 1 };
  assert.equal(validWish(input),true);
  assert.equal(validWish({ ...input,url: 'https://example.com/item',linkedSupplyId: id }),true);
  for (const url of ['javascript:alert(1)','data:text/html,foo','file:///tmp/test','bad-url']) assert.equal(validWish({ ...input,url }),false);
  assert.equal(validWish({ ...input,linkedSupplyId: 'bad' }),false);
  assert.equal(validWish({ ...input,country: 1 as never }),false);
});
