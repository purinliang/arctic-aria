import assert from 'node:assert/strict';
import test from 'node:test';
import { chatDateSeparator } from '../chat-dates.ts';
import type { ChatExchange } from '../types.ts';

test('chat date separators show only day transitions, using the configured timezone', () => {
  const entries = ['2026-10-06T01:00:00Z', '2026-10-08T01:00:00Z', '2026-10-09T01:00:00Z', '2026-10-09T02:00:00Z']
    .map(createdAt => ({ createdAt } as ChatExchange));
  const options = { now: new Date('2026-10-09T04:00:00Z'), timeZone: 'Australia/Sydney', language: 'en', today: 'Today', yesterday: 'Yesterday' };
  assert.equal(chatDateSeparator(entries, 0, options), null);
  assert.equal(chatDateSeparator(entries, 1, options), 'Yesterday');
  assert.equal(chatDateSeparator(entries, 2, options), 'Today');
  assert.equal(chatDateSeparator(entries, 3, options), null);
  assert.equal(chatDateSeparator(entries, 1, { ...options, now: new Date('2026-10-10T04:00:00Z') }), 'Thursday');
  const midnight = [{ createdAt: '2026-10-09T12:59:00Z' }, { createdAt: '2026-10-09T13:01:00Z' }] as ChatExchange[];
  assert.equal(chatDateSeparator(midnight, 1, { ...options, now: new Date('2026-10-09T13:30:00Z') }), 'Today');
  assert.equal(chatDateSeparator(midnight, 1, { ...options, timeZone: 'UTC' }), null);
});
