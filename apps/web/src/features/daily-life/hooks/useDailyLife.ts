import { useCallback, useEffect, useRef, useState } from 'react';
import { archiveLifeEntry, getLifeEntries, saveLifeEntry } from '../actions';
import type { LifeActivity, LifeEntry, LifeInput } from '../types';
import { useLifeAction } from './useLifeAction';
import type { LifeActionOptions } from './useLifeAction';

export function useDailyLife({ dayKey, timezone, messages, notificationMessages, showErrorNotification }: {
  dayKey: string; timezone: string;
} & LifeActionOptions) {
  const [entries, setEntries] = useState<LifeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingKinds, setPendingKinds] = useState<LifeActivity[]>([]);
  const pendingRef = useRef(new Set<LifeActivity>());
  const retries = useRef(new Map<LifeActivity, string>());
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

  async function capture(activity: LifeActivity) {
    if (pendingRef.current.has(activity)) return;
    pendingRef.current.add(activity);
    setPendingKinds([...pendingRef.current]);
    // A capture key identifies one click; retries cannot insert duplicates.
    const captureKey = retries.current.get(activity) ?? crypto.randomUUID();
    retries.current.set(activity, captureKey);
    const temporaryId = `pending-${captureKey}`;
    setEntries((current) => [{ id: temporaryId, activity, occurredAt: new Date().toISOString(), note: null }, ...current]);
    try {
      const entry = await invoke(() => saveLifeEntry({ activity, captureKey }));
      if (entry) {
        changed.current.add(entry.id);
        retries.current.delete(activity);
      }
      setEntries((current) => entry
        ? [entry, ...current.filter((item) => item.id !== temporaryId && item.id !== entry.id)]
        : current.filter((item) => item.id !== temporaryId));
    } finally {
      pendingRef.current.delete(activity);
      setPendingKinds([...pendingRef.current]);
    }
  }

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

  return { entries, loading, pendingKinds, refresh, capture, save, remove };
}
