import { useCallback, useEffect, useRef, useState } from 'react';
import { archiveLifeEntry, getLifeEntries, saveLifeEntry } from '../actions';
import type { LifeEntry, LifeInput } from '../types';
import { useLifeAction } from './useLifeAction';
import type { LifeActionOptions } from './useLifeAction';

export function useDailyLife({ dayKey, timezone, messages, notificationMessages, showErrorNotification }: {
  dayKey: string; timezone: string;
} & LifeActionOptions) {
  const [entries, setEntries] = useState<LifeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const changed = useRef(new Set<string>());

  const invoke = useLifeAction({ messages, notificationMessages, showErrorNotification });

  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    changed.current.clear();
    setLoading(true);
    const data = await invoke(getLifeEntries);
    if (request !== sequence.current) return;
    if (data) setEntries((current) => [
      ...current.filter((entry) => entry.id.startsWith('pending-') || changed.current.has(entry.id)),
      ...data.filter((entry) => !changed.current.has(entry.id)),
    ]);
    setLoading(false);
  }, [invoke]);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => { clearTimeout(timer); sequence.current += 1; };
  }, [dayKey, timezone, refresh]);

  async function save(input: LifeInput) {
    const entry = await invoke(() => saveLifeEntry(input));
    if (!entry) return false;
    changed.current.add(entry.id);
    setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    return true;
  }

  async function remove(id: string) {
    const deleted = await invoke(() => archiveLifeEntry(id));
    if (!deleted) return false;
    changed.current.add(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    return true;
  }

  return { entries, loading, refresh, save, remove };
}
