import assert from 'node:assert/strict';
import test from 'node:test';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { PostgresLifeRepository } from '../server/life-repository.ts';
import { PostgresLifeChatRepository, createLifeChatService } from '../server/life-chat-service.ts';
import type { LifeChatRepository } from '../server/life-chat-service.ts';

const key = '11111111-1111-4111-8111-111111111111';
const now = new Date('2026-10-07T10:00:00.000Z');

test('life SQL scopes every command by owner, bounds calendar days, and protects retry keys', async () => {
  const queries: { query: string; params: unknown[] }[] = [];
  const sql = { async query(query: string, params: unknown[]) {
    queries.push({ query, params });
    return [{ id: key, activity: 'work', duration_minutes: 30, occurred_at: now, note: null }];
  } } as unknown as NeonQueryFunction<false, false>;
  const repo = new PostgresLifeRepository(sql);
  assert.equal((await repo.list('owner', 'Australia/Sydney', now))[0].durationMinutes, 30);
  await repo.save('owner', { captureKey: key, activity: 'work', durationMinutes: 30, occurredAt: now.toISOString(), note: 'private note' }, now);
  await repo.save('owner', { id: key, captureKey: key, activity: 'study', durationMinutes: 45, occurredAt: now.toISOString() }, now);
  await repo.archive('owner', key, now);
  assert.match(queries[0].query, /AT TIME ZONE \$2/);
  assert.match(queries[0].query, /date - 6/);
  assert.match(queries[0].query, /occurred_at <= \$3/);
  assert.match(queries[0].query, /duration_minutes IS NOT NULL/);
  assert.equal(queries[1].params[6], 30);
  assert.equal(queries[2].params[6], 45);
  assert.match(queries[1].query, /ON CONFLICT \(user_id, capture_key\)/);
  assert.match(queries[1].query, /WHERE daily_life_entries.deleted_at IS NULL/);
  assert.ok(!queries[1].query.includes('private note'));
  for (const index of [0, 2, 3]) {
    assert.match(queries[index].query, /user_id = \$1/);
    assert.match(queries[index].query, /deleted_at IS NULL/);
  }
  assert.ok(queries.every((call) => call.params[0] === 'owner'));
});

test('chat persists only a message and development reply, scoped by owner with retry protection', async () => {
  const queries: string[] = [];
  const sql = { async query(query: string, params: unknown[]) {
    queries.push(query); assert.equal(params[0], 'owner');
    return [{ id: key, message: 'hello', created_at: now, response_code: 'chat_not_available' }];
  } } as unknown as NeonQueryFunction<false, false>;
  const repo = new PostgresLifeChatRepository(sql);
  assert.equal((await repo.list('owner'))[0].responseCode, 'chat_not_available');
  assert.equal((await repo.send('owner', { captureKey: key, message: 'hello' }, now)).message, 'hello');
  assert.match(queries[0], /WHERE user_id = \$1/);
  assert.match(queries[1], /ON CONFLICT \(user_id, capture_key\)/);
  assert.ok(queries.every((query) => !query.includes('daily_life_entries')));
});

test('chat validates messages before persistence and does not execute commands', async () => {
  let calls = 0;
  const repository: LifeChatRepository = {
    async list() { return []; },
    async send(userId, input, time) {
      calls++; assert.equal(userId, 'owner'); assert.equal(time, now);
      return { id: key, message: input.message, createdAt: now.toISOString(), responseCode: 'chat_not_available' };
    },
  };
  const service = createLifeChatService(repository, () => now);
  for (const message of ['', '   ', 'a'.repeat(2001)]) {
    assert.equal((await service.send('owner', { captureKey: key, message })).ok, false);
  }
  assert.equal(calls, 0);
  const result = await service.send('owner', { captureKey: key, message: '  delete all my projects  ' });
  assert.ok(result.ok);
  assert.equal(result.data.message, 'delete all my projects');
  assert.equal(result.data.responseCode, 'chat_not_available');
  assert.equal(calls, 1);
});
