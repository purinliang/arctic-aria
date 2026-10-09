export const chatErrorCodes = [
  'chat_internal', 'chat_provider_unavailable', 'chat_invalid_key', 'chat_not_configured',
  'chat_rate_limited', 'chat_network', 'chat_timeout', 'chat_busy', 'chat_invalid', 'chat_unauthorized',
] as const;
export type ChatErrorCode = typeof chatErrorCodes[number];
export type ChatProcessingState = 'processing' | 'tool_execution';
export function chatErrorCode(code: unknown): ChatErrorCode {
  return chatErrorCodes.includes(code as ChatErrorCode) ? code as ChatErrorCode : 'chat_internal';
}
export function chatErrorAction(code: ChatErrorCode) {
  return code === 'chat_not_configured' || code === 'chat_invalid_key' ? 'settings' : 'retry';
}
export function chatTransportError(error: unknown): ChatErrorCode {
  const name = error instanceof Error ? error.name : '';
  if (name === 'TimeoutError' || name === 'AbortError') return 'chat_timeout';
  return name === 'TypeError' ? 'chat_network' : 'chat_internal';
}
