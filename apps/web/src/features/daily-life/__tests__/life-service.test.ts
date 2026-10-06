import assert from 'node:assert/strict';
import test from 'node:test';
import { createLifeService } from '../server/life-service.ts';
import { validateLifeInput } from '../life-validation.ts';
import { entriesForDay, lifeWeek } from '../life-calendar.ts';
import type { LifeEntry, LifeInput, LifeRepository } from '../types.ts';

const now = new Date('2026-10-07T10:00:00.000Z');
const key = '11111111-1111-4111-8111-111111111111';
const input: LifeInput = { captureKey: key, activity: 'meal' };

test('quick capture accepts only life activities and defaults to server time', () => {
  for (const activity of ['meal', 'shower', 'sleep', 'exercise'] as const) {
    const result = validateLifeInput({ ...input, activity, note: '  dinner  ' }, now);
    assert.ok(result.ok);
    assert.equal(result.input.note, 'dinner');
    assert.equal(result.input.occurredAt, now.toISOString());
  }
  assert.equal(validateLifeInput({ ...input, activity: 'study' as never }, now).ok, false);
  assert.equal(validateLifeInput({ ...input, activity: 'work' as never }, now).ok, false);
  assert.equal(validateLifeInput(null as never, now).ok, false);
  assert.equal(validateLifeInput({ ...input, captureKey: 'bad' }, now).ok, false);
  assert.equal(validateLifeInput({ ...input, id: '' }, now).ok, false);
});

test('capture validates notes, date rollover, non-UTC values, and future timestamps', () => {
  assert.equal(validateLifeInput({ ...input, note: '😀'.repeat(500) }, now).ok, true);
  assert.equal(validateLifeInput({ ...input, note: '😀'.repeat(501) }, now).ok, false);
  for (const occurredAt of ['invalid', '2026-02-30T10:00:00.000Z', '2026-10-07T10:01:00.000Z', '2026-10-07T10:00:00+10:00']) {
    assert.equal(validateLifeInput({ ...input, occurredAt }, now).ok, false, occurredAt);
  }
  assert.equal(validateLifeInput({ ...input, note: 42 as never }, now).ok, false);
  assert.equal(validateLifeInput({ ...input, note: '  ' }, now).ok, true);
});

test('seven local calendar days include DST and the local midnight boundary', () => {
  assert.deepEqual(lifeWeek(new Date('2026-10-04T14:05:00Z'), 'Australia/Sydney'),
    ['2026-10-05', '2026-10-04', '2026-10-03', '2026-10-02', '2026-10-01', '2026-09-30', '2026-09-29']);
  const entries: LifeEntry[] = [
    { id: 'before', activity: 'sleep', note: null, occurredAt: '2026-10-04T12:59:00.000Z' },
    { id: 'after', activity: 'sleep', note: null, occurredAt: '2026-10-04T13:01:00.000Z' },
  ];
  assert.deepEqual(entriesForDay(entries, '2026-10-05', 'Australia/Sydney').map((entry) => entry.id), ['after']);
  assert.deepEqual(entriesForDay(entries, '2026-10-04', 'Australia/Sydney').map((entry) => entry.id), ['before']);
});

test('service forwards ownership, rejects invalid writes, and handles missing rows', async () => {
  const calls: unknown[][] = [];
  const record: LifeEntry = { id: key, activity: 'meal', occurredAt: now.toISOString(), note: null };
  const repository: LifeRepository = {
    async list(...args) { calls.push(args); return [record]; },
    async save(...args) { calls.push(args); return args[0] === 'owner' ? record : null; },
    async archive(...args) { calls.push(args); return args[0] === 'owner'; },
  };
  const service = createLifeService(repository, () => now);
  assert.equal((await service.list('owner', 'Australia/Sydney')).ok, true);
  assert.deepEqual(calls[0], ['owner', 'Australia/Sydney', now]);
  assert.equal((await service.save('owner', input)).ok, true);
  assert.equal((await service.save('other', { ...input, id: key })).ok, false);
  assert.equal((await service.archive('other', key)).ok, false);
  assert.equal((await service.archive('owner', key)).ok, true);
  const count = calls.length;
  assert.equal((await service.save('owner', { ...input, captureKey: '' })).ok, false);
  assert.equal((await service.archive('owner', 'bad')).ok, false);
  assert.equal(calls.length, count);
});

test('repository errors return safe structured failures', async () => {
  const repository: LifeRepository = {
    async list() { throw { code: 'connection_lost' }; },
    async save() { throw { code: 'constraint_failed' }; },
    async archive() { throw { code: 'connection_lost' }; },
  };
  const service = createLifeService(repository, () => now);
  const result = await service.save('owner', input);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.category, 'database_update');
  assert.equal((await service.list('owner', 'UTC')).ok, false);
  assert.equal((await service.archive('owner', key)).ok, false);
});
