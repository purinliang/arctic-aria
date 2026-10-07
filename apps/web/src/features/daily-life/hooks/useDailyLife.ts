import { useCallback, useEffect, useRef, useState } from 'react';
import { archiveLifeEntry, getLifeEntries, saveLifeEntry } from '../actions';
import type { LifeEntry, LifeInput } from '../types';
import { useLifeAction } from './useLifeAction';
import type { LifeActionOptions } from './useLifeAction';
import { readProgressBrowserCache, writeProgressBrowserCache } from '../progress-browser-cache';

export function useDailyLife({ userId, dayKey, timezone, messages, notificationMessages, showErrorNotification }: {
  userId: string; dayKey: string; timezone: string;
} & LifeActionOptions) {
  const scope = JSON.stringify([userId,dayKey,timezone]);
  const [snapshot, setSnapshot] = useState<{ scope: string; entries: LifeEntry[]; loading: boolean; cacheReady: boolean }>({ scope,entries: [],loading: true,cacheReady: false });
  const sequence = useRef(0);
  const changed = useRef(new Set<string>());

  const invoke = useLifeAction({ messages, notificationMessages, showErrorNotification });

  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    changed.current.clear();
    const data = await invoke(getLifeEntries);
    if (request !== sequence.current) return;
    setSnapshot((current) => ({ scope,loading: false,cacheReady: data !== null || (current.scope === scope && current.cacheReady),
      entries: data ? [
        ...current.entries.filter((entry) => current.scope === scope && changed.current.has(entry.id)),
        ...data.filter((entry) => !changed.current.has(entry.id)),
      ] : current.scope === scope ? current.entries : [],
    }));
  }, [invoke,scope]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const entries = readProgressBrowserCache({ userId,dayKey,timezone });
      setSnapshot({ scope,entries: entries ?? [],loading: entries === null,cacheReady: entries !== null });
      void refresh();
    }, 0);
    return () => { clearTimeout(timer); sequence.current += 1; };
  }, [userId,dayKey,timezone,scope,refresh]);

  useEffect(() => {
    if (snapshot.scope === scope && snapshot.cacheReady) {
      writeProgressBrowserCache({ userId,dayKey,timezone },snapshot.entries);
    }
  }, [snapshot,scope,userId,dayKey,timezone]);

  async function save(input: LifeInput) {
    const entry = await invoke(() => saveLifeEntry(input));
    if (!entry) return false;
    changed.current.add(entry.id);
    setSnapshot((current) => current.scope === scope ? { ...current,cacheReady: true,entries: [entry,...current.entries.filter((item) => item.id !== entry.id)] } : current);
    return true;
  }

  async function remove(id: string) {
    const deleted = await invoke(() => archiveLifeEntry(id));
    if (!deleted) return false;
    changed.current.add(id);
    setSnapshot((current) => current.scope === scope ? { ...current,entries: current.entries.filter((entry) => entry.id !== id) } : current);
    return true;
  }

  return { entries: snapshot.scope === scope ? snapshot.entries : [], loading: snapshot.scope !== scope || snapshot.loading, refresh, save, remove };
}
