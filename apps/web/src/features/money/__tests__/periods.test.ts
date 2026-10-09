import assert from 'node:assert/strict';
import test from 'node:test';
import { monthBounds, shiftMonth } from '../money.ts';
import { entryCategories } from '../types.ts';
test('month navigation uses calendar boundaries, including leap years and year rollover',() => {
  assert.deepEqual(monthBounds('2024-02-29'),{ start: '2024-02-01',end: '2024-02-29' });
  assert.deepEqual(monthBounds('2025-02-28'),{ start: '2025-02-01',end: '2025-02-28' });
  assert.equal(shiftMonth('2026-01-31',-1),'2025-12-01');
  assert.equal(shiftMonth('2026-12-31',1),'2027-01-01');
  assert.deepEqual(entryCategories,['food','transport','shopping','housing','bills']);
});
