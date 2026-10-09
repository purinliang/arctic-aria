import { readBrowserSnapshot, writeBrowserSnapshot, clearBrowserSnapshot } from '../../app-shell/browser-snapshot-cache.ts';
import type { BrowserStorage } from '../../app-shell/browser-snapshot-cache.ts';
import { recentChat } from './types.ts';
import { chatErrorCode } from './chat-state.ts';
import type { ChatExchange } from './types.ts';

export const chatCacheKey = (userId: string) => `arctic-aria.chat.v1.${encodeURIComponent(userId)}`;
function storage(): BrowserStorage | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; }
}
function valid(value: unknown): value is ChatExchange[] {
  return Array.isArray(value) && value.length <= 100 && value.every(entry => entry && typeof entry.id === 'string'
    && typeof entry.userText === 'string' && entry.userText.length <= 4000 && typeof entry.model === 'string'
    && ['pending', 'complete', 'failed'].includes(entry.status)
    && (entry.errorCode === undefined || chatErrorCode(entry.errorCode) === entry.errorCode)
    && (entry.assistantText === null || (typeof entry.assistantText === 'string' && entry.assistantText.length <= 16000))
    && typeof entry.createdAt === 'string' && Number.isFinite(Date.parse(entry.createdAt)));
}
export function readChatCache(userId: string, target = storage(), now = Date.now()) {
  const entries = recentChat(readBrowserSnapshot(chatCacheKey(userId), valid, target) ?? [], now);
  writeBrowserSnapshot(chatCacheKey(userId), entries, target);
  return entries;
}
export function writeChatCache(userId: string, entries: ChatExchange[], target = storage(), now = Date.now()) {
  writeBrowserSnapshot(chatCacheKey(userId), recentChat(entries, now).slice(-100), target);
}
export function clearChatCache(userId: string, target = storage()) { clearBrowserSnapshot(chatCacheKey(userId), target); }
