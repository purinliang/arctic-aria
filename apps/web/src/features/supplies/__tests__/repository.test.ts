import assert from 'node:assert/strict';
import test from 'node:test';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { SuppliesRepository } from '../server/supplies-repository.ts';
test('stock commands and archive/history queries remain owner-scoped and parameterized', async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  const sql = { async query(text: string,args: unknown[]) { calls.push({ text,args }); return [{ result: { error: 'stale' },id: 'id' }]; } } as unknown as NeonQueryFunction<false,false>;
  const repository = new SuppliesRepository(sql);
  assert.deepEqual(await repository.change('owner',{ id: 'id',version: 2,key: 'key',operation: 'replace',level: 5,useSpare: true }),{ error: 'stale' });
  await repository.archive('owner','id',2);
  await repository.archiveWish('owner','wish',2);
  assert.ok(calls.every((call) => call.args[0] === 'owner'));
  assert.match(calls[0].text,/change_supply/);
  assert.deepEqual(calls[0].args,['owner','id',2,'key','replace',5,true]);
  for (const call of calls.slice(1)) { assert.match(call.text,/user_id = \$1/); assert.match(call.text,/version = \$3/); }
});
