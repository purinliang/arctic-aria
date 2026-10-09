import assert from 'node:assert/strict';
import test from 'node:test';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { MoneyRepository } from '../server/money-repository.ts';
test('month data includes owner-scoped active note counts from all history',async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  const sql = { async query(text: string,args: unknown[]) {
    calls.push({ text,args });
    if (text.includes('preferred_currencies AS')) return [{ preferredCurrencies: ['AUD'] }];
    if (text.includes('count(*)::text')) return [{ categoryId: 'food',note: 'Groceries',count: '3' }];
    return [];
  } } as unknown as NeonQueryFunction<false,false>;
  const data = await new MoneyRepository(sql).data('owner',{ mode: 'month',date: '2026-10-01' });
  assert.deepEqual(data.noteUsage,[{ categoryId: 'food',note: 'Groceries',count: 3 }]);
  const aggregate = calls.find((call) => call.text.includes('count(*)::text'))!;
  assert.deepEqual(aggregate.args,['owner']);
  assert.match(aggregate.text,/user_id = \$1 AND deleted_at IS NULL/);
  assert.match(aggregate.text,/GROUP BY category_id,lower\(btrim\(note\)\)/);
  assert.doesNotMatch(aggregate.text,/recorded_date/);
});
test('expense writes are parameterized, owner-scoped, and replay-safe', async () => {
  const calls: { text: string; args: unknown[] }[] = [];
  const sql = { async query(text: string, args: unknown[]) { calls.push({ text, args }); return [{ id: 'id', saved: true }]; } } as unknown as NeonQueryFunction<false, false>;
  const repository = new MoneyRepository(sql);
  const input = { id: 'id', isNew: true, categoryId: 'category', amount: '12.34', currency: 'AUD' as const, date: '2026-10-07', note: ' private ' };
  await repository.save('owner', input);
  await repository.save('owner', { ...input, isNew: false });
  await repository.archive('owner', 'id');
  await repository.settings('owner', { preferredCurrencies: ['CNY','AUD'], quickCategoryIds: [] });
  assert.ok(calls.every((call) => call.args[0] === 'owner' && !call.text.includes('private')));
  assert.equal(calls[0].args[3], 1234);
  assert.match(calls[0].text, /ON CONFLICT/);
  assert.match(calls[0].text, /money_expenses.user_id = \$1/);
  assert.match(calls[1].text, /user_id = \$1/);
  assert.match(calls[2].text, /deleted_at IS NULL/);
  assert.match(calls[3].text, /save_money_settings/);
});
