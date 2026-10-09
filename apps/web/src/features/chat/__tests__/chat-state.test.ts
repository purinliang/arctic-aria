import assert from 'node:assert/strict';
import test from 'node:test';
import { chatErrorAction, chatErrorCode, chatTransportError } from '../chat-state.ts';

test('chat errors select a safe centralized message and appropriate recovery action', () => {
  assert.equal(chatErrorCode('raw-sensitive-error'), 'chat_internal');
  assert.equal(chatErrorAction('chat_invalid_key'), 'settings');
  assert.equal(chatErrorAction('chat_not_configured'), 'settings');
  assert.equal(chatErrorAction('chat_rate_limited'), 'retry');
  assert.equal(chatTransportError(new TypeError('private body')), 'chat_network');
  assert.equal(chatTransportError(Object.assign(new Error('private body'), { name: 'TimeoutError' })), 'chat_timeout');
  assert.equal(chatTransportError(new Error('stack and secrets')), 'chat_internal');
});
