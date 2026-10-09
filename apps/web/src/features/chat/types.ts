import type { ChatErrorCode } from './chat-state.ts';
export type ChatExchange = {
  id: string;
  userText: string;
  assistantText: string | null;
  model: string;
  status: 'pending' | 'complete' | 'failed';
  createdAt: string;
  errorCode?: ChatErrorCode;
  localOnly?: boolean;
};
export type ChatHistory = { entries: ChatExchange[]; hasMore: boolean; enabled: boolean };
export type ChatSearch = { query?: string; before?: string };
export const chatRetentionMs = 7 * 24 * 60 * 60 * 1000;
export function recentChat(entries: ChatExchange[], now = Date.now()) {
  return entries.filter(entry => Date.parse(entry.createdAt) > now - chatRetentionMs);
}
