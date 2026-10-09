import assert from 'node:assert/strict';
import test from 'node:test';
import { createChatService } from '../server/chat-service.ts';
import { GeminiError } from '../../../server/ai/gemini-client.ts';
import { defaultAIModel } from '../../settings/ai-provider.ts';
import type { ChatExchange } from '../types.ts';

const user = '00000000-0000-4000-8000-000000000001';
const id = '00000000-0000-4000-8000-000000000002';
const entry: ChatExchange = { id, userText: 'Hello', assistantText: null, status: 'pending', model: defaultAIModel, createdAt: new Date().toISOString() };
function fixture() {
  const rows = new Map<string, ChatExchange>();
  let enabled = true, calls = 0;
  let fail: GeminiError | null = null;
  const service = createChatService({
    repository: {
      async expire() {}, async list() { return { entries: [...rows.values()], hasMore: false }; },
      async find(_user, key) { return rows.get(key) ?? null; },
      async claim(_user, key, text, model) { rows.set(key, { ...entry, id: key, userText: text, model }); return 'lease'; },
      async context() { return [{ ...entry, id: 'older', status: 'complete', userText: 'Previous', assistantText: 'Previous answer' }]; },
      async finish(_user, key, _lease, reply) {
        const next = { ...rows.get(key)!, status: reply ? 'complete' as const : 'failed' as const, assistantText: reply };
        rows.set(key, next); return next;
      },
    },
    settings: { async find() { return { enabled, encrypted_api_key: 'ciphertext', model: defaultAIModel }; } },
    encryption: { decrypt(owner, encrypted) { assert.equal(owner, user); assert.equal(encrypted, 'ciphertext'); return 'test-owned-key'; } },
    client: ({ env }) => ({ async generateConversation(turns) {
      calls++; assert.equal(env.GEMINI_API_KEY, 'test-owned-key'); assert.equal(env.GEMINI_MODEL, defaultAIModel);
      assert.deepEqual(turns.map(turn => turn.role), ['user', 'model', 'user']);
      assert.equal(turns[0].text, 'Previous');
      if (fail) throw fail;
      return { text: 'Answer', model: defaultAIModel };
    } }),
  });
  return { service, rows, calls: () => calls, disable: () => { enabled = false; }, fail: (error = new GeminiError('request_failed', 429)) => { fail = error; } };
}
test('chat authenticates and validates before touching storage or Gemini', async () => {
  const f = fixture();
  assert.equal((await f.service.send('', id, 'Hello')).ok, false);
  for (const text of ['', ' ', 'x'.repeat(4001)]) assert.equal((await f.service.send(user, id, text)).ok, false);
  assert.equal((await f.service.history(user, { query: 'x'.repeat(201) })).ok, false);
  assert.equal((await f.service.history(user, { before: 'bad-id' })).ok, false);
  assert.equal(f.rows.size, 0); assert.equal(f.calls(), 0);
});
test('chat uses only the account key, retains context roles, and sends duplicate IDs once', async () => {
  const f = fixture();
  const first = await f.service.send(user, id, ' Hello ');
  assert.equal(first.ok, true); assert.equal(f.rows.get(id)?.assistantText, 'Answer');
  assert.deepEqual(await f.service.send(user, id, 'Hello'), first); assert.equal(f.calls(), 1);
  assert.equal((await f.service.send(user, id, 'Different')).ok, false);
  assert.equal((await f.service.history(user)).ok, true);
});
test('disabled AI never calls Gemini or stores a new chat', async () => {
  const f = fixture(); f.disable();
  const result = await f.service.send(user, id, 'Hello');
  assert.ok(!result.ok && result.code === 'chat_not_configured'); assert.equal(f.calls(), 0); assert.equal(f.rows.size, 0);
});
test('pending requests block duplicates and failed requests remain retryable', async () => {
  const f = fixture(); f.rows.set(id, entry);
  const result = await f.service.send(user, id, 'Hello');
  assert.ok(!result.ok && result.code === 'chat_busy'); assert.equal(f.calls(), 0);
  f.rows.set(id, { ...entry, status: 'failed' });
  assert.equal((await f.service.send(user, id, 'Hello')).ok, true);
});
test('provider errors mark the exchange failed and expose only safe error codes', async () => {
  const f = fixture(); f.fail();
  const result = await f.service.send(user, id, 'Hello');
  assert.ok(!result.ok && result.code === 'chat_rate_limited'); assert.equal(f.rows.get(id)?.status, 'failed');
  assert.ok(!JSON.stringify(result).includes('test-owned-key'));
});

test('chat maps provider and transport failures to stable recovery codes', async () => {
  for (const [error, code] of [
    [new GeminiError('request_failed', 401), 'chat_invalid_key'],
    [new GeminiError('request_failed', 503), 'chat_provider_unavailable'],
    [new GeminiError('timeout'), 'chat_timeout'],
    [new GeminiError('network_failure'), 'chat_network'],
    [new GeminiError('empty_response'), 'chat_internal'],
  ] as const) {
    const f = fixture(); f.fail(error);
    const result = await f.service.send(user, id, 'Hello');
    assert.ok(!result.ok && result.code === code);
    assert.equal(f.rows.get(id)?.assistantText, null, 'Errors are never assistant messages');
  }
});
