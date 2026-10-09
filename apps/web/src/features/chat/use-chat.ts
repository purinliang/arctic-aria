"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatErrorCode, chatTransportError } from './chat-state';
import type { ChatErrorCode } from './chat-state';
import type { FeatureResult } from '@/server/feature-result';
import { getChatHistory, sendChatMessage } from './actions';
import { clearChatCache, readChatCache, writeChatCache } from './chat-browser-cache';
import { recentChat } from './types';
import type { ChatExchange } from './types';

async function request<T>(action: () => Promise<FeatureResult<T>>): Promise<FeatureResult<T>> {
  try { return await action(); }
  catch (error) { return { ok: false, code: chatTransportError(error), category: 'server', message: '' }; }
}
export function useChat(userId: string, open: boolean) {
  const [entries, setEntries] = useState<ChatExchange[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<ChatErrorCode | null>(null);
  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);
  const mounted = useRef(false);
  const pending = useRef<ChatExchange | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    readChatCache(userId);
    const timer = window.setInterval(() => { readChatCache(userId); }, 60000);
    return () => { mounted.current = false; window.clearInterval(timer); clearChatCache(userId); invalidate(); };
  }, [invalidate, userId]);

  const refresh = useCallback(async (before?: string) => {
    const version = ++generation.current;
    setLoading(true);
    const response = await request(() => getChatHistory({ before }));
    if (!mounted.current || version !== generation.current) return;
    setLoading(false);
    if (!response.ok) { setError(chatErrorCode(response.code)); return; }
    const result = response.data;
    setError(null);
    setEnabled(result.enabled); setHasMore(result.hasMore); setLoaded(true);
    setEntries(current => {
      const cache = readChatCache(userId);
      const received: ChatExchange[] = result.entries.map(entry => ({ ...entry, errorCode: entry.status === 'failed'
        ? (current.find(item => item.id === entry.id) ?? cache.find(item => item.id === entry.id))?.errorCode : undefined }));
      const updated = before ? [...received, ...current.filter(entry => !received.some(item => item.id === entry.id))] : received;
      if (!before) updated.push(...cache.filter(entry => entry.localOnly && entry.status === 'failed'
        && !updated.some(item => item.id === entry.id)));
      if (pending.current && !updated.some(entry => entry.id === pending.current!.id)) updated.push(pending.current);
      updated.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
      if (!before) writeChatCache(userId, updated);
      return recentChat(updated);
    });
  }, [userId]);

  useEffect(() => {
    invalidate();
    if (!open) return;
    const cached = window.setTimeout(() => {
      setEntries(readChatCache(userId));
    }, 0);
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => { window.clearTimeout(cached); window.clearTimeout(timer); invalidate(); };
  }, [open, refresh, userId, invalidate]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      setEntries(current => recentChat(current));
      readChatCache(userId);
      if (!busy.current && entries.some(entry => entry.status === 'pending')) void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [open, entries, refresh, userId]);

  async function send(text: string, retry?: ChatExchange) {
    if (!enabled || !loaded) { setError('chat_not_configured'); return false; }
    if (busy.current || !text.trim() || text.length > 4000 || entries.some(entry => entry.status === 'pending')) return false;
    setError(null);
    busy.current = true; setSending(true); generation.current++;
    const entry: ChatExchange = retry ? { ...retry, status: 'pending' } : {
      id: crypto.randomUUID(), userText: text.trim(), assistantText: null, status: 'pending',
      model: '', createdAt: new Date().toISOString(),
    };
    pending.current = entry;
    setEntries(current => [...current.filter(item => item.id !== entry.id), entry]);
    try {
      const response = await request(() => sendChatMessage(entry.id, entry.userText));
      const result = response.ok ? response.data : null;
      if (!mounted.current) return !!result;
      generation.current++;
      setLoading(false);
      const next = result ?? { ...entry, status: 'failed' as const, localOnly: true, errorCode: response.ok ? undefined : chatErrorCode(response.code) };
      const cached = readChatCache(userId).filter(item => item.id !== entry.id);
      writeChatCache(userId, [...cached, next].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)));
      setEntries(current => [...current.filter(item => item.id !== entry.id), next]
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)));
      return !!result;
    } finally {
      pending.current = null; busy.current = false;
      if (mounted.current) { setSending(false); void refresh(); }
    }
  }

  return { entries, enabled, loaded, loading, sending, hasMore, refresh, send, error };
}
