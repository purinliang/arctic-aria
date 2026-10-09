import assert from 'node:assert/strict';
import test from 'node:test';
import { chatCacheKey, readChatCache, writeChatCache } from '../chat-browser-cache.ts';
import { chatRetentionMs } from '../types.ts';
import type { ChatExchange } from '../types.ts';

test('chat browser cache isolates accounts, bounds size and evicts expired content', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const now = Date.now();
  const entry: ChatExchange = { id: 'test', userText: 'Hello', assistantText: 'Answer', status: 'complete', model: 'test', createdAt: new Date(now).toISOString() };
  writeChatCache('one', [entry], storage, now);
  assert.deepEqual(readChatCache('two', storage, now), []);
  assert.deepEqual(readChatCache('one', storage, now), [entry]);
  assert.deepEqual(readChatCache('one', storage, now + chatRetentionMs), []);
  assert.equal(values.get(chatCacheKey('one')), '[]');
  writeChatCache('one', Array.from({ length: 150 }, (_, index) => ({ ...entry, id: String(index) })), storage, now);
  assert.equal(readChatCache('one', storage, now).length, 100);
  values.set(chatCacheKey('one'), '{bad'); assert.deepEqual(readChatCache('one', storage, now), []);
});
