import { useCallback, useEffect, useRef, useState } from 'react';
import { useFeatureAction } from '@/components/use-feature-action';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { FeatureResult } from '@/server/feature-result';
import { changeSupply, getSuppliesData, saveWish } from '../actions';
import type { StockCommand, SuppliesData, SupplyItem, WishItem } from '../types';

export function useSupplies(options: FeatureActionOptions) {
  const [data,setData] = useState<SuppliesData>({ items: [], wishlist: [] });
  const [loading,setLoading] = useState(true), [pending,setPending] = useState<string[]>([]);
  const locks = useRef(new Set<string>()), changed = useRef(new Set<string>()), sequence = useRef(0);
  const retries = useRef(new Map<string,string>());
  const invoke = useFeatureAction(options);
  const reload = useCallback(async () => {
    const token = ++sequence.current;
    changed.current.clear();
    const next = await invoke(getSuppliesData);
    if (token !== sequence.current) return;
    if (next) setData((current) => {
      const preserve = (id: string) => locks.current.has(id) || changed.current.has(id);
      return {
        items: [...current.items.filter((item) => preserve(item.id)), ...next.items.filter((item) => !preserve(item.id))],
        wishlist: [...current.wishlist.filter((item) => preserve(item.id)), ...next.wishlist.filter((item) => !preserve(item.id))],
      };
    });
    setLoading(false);
  },[invoke]);
  useEffect(() => {
    const guard = sequence;
    const timer = setTimeout(() => void reload(),0);
    return () => { clearTimeout(timer); guard.current++; };
  },[reload]);
  async function mutate<T>(action: () => Promise<FeatureResult<T>>) {
    const result = await invoke(action);
    await reload();
    return result !== null && result !== false;
  }
  async function stock(item: SupplyItem, patch: Pick<StockCommand,'operation' | 'level' | 'useSpare'>) {
    if (locks.current.has(item.id)) return false;
    locks.current.add(item.id); setPending([...locks.current]);
    const signature = `${item.id}:${patch.operation}:${patch.level}:${patch.useSpare}`;
    const key = retries.current.get(signature) ?? crypto.randomUUID(); retries.current.set(signature,key);
    const cycleId = patch.operation === 'replace' ? `pending-${key}` : item.cycleId;
    const optimistic = { ...item, level: patch.operation === 'replace' ? 5 : patch.level,
      spares: item.spares - (patch.operation === 'replace' && patch.useSpare ? 1 : 0), version: item.version + 1, cycleId,
      observations: [{ id: key, cycleId, level: patch.operation === 'replace' ? 5 : patch.level, recordedAt: new Date().toISOString() }, ...item.observations].slice(0,3) };
    setData((current) => ({ ...current, items: current.items.map((row) => row.id === item.id ? optimistic : row) }));
    try {
      const saved = await invoke(() => changeSupply({ id: item.id,version: item.version,key,...patch }));
      if (saved) { changed.current.add(item.id); retries.current.delete(signature); }
      setData((current) => ({ ...current, items: current.items.map((row) => row.id === item.id ? saved ?? item : row) }));
      return !!saved;
    } finally {
      locks.current.delete(item.id); setPending([...locks.current]);
      // Resolve uncertain writes and cross-device stale versions without replacing other pending rows.
      await reload();
    }
  }
  async function toggleWish(item: WishItem) {
    if (locks.current.has(item.id)) return;
    locks.current.add(item.id); setPending([...locks.current]);
    const optimistic: WishItem = { ...item,status: item.status === 'planned' ? 'purchased' : 'planned' };
    setData((current) => ({ ...current,wishlist: current.wishlist.map((row) => row.id === item.id ? optimistic : row) }));
    try {
      const saved = await invoke(() => saveWish({ ...optimistic,isNew: false }));
      if (saved) changed.current.add(item.id);
      setData((current) => ({ ...current,wishlist: current.wishlist.map((row) => row.id === item.id ? saved ? { ...optimistic,...saved } : item : row) }));
    } finally { locks.current.delete(item.id); setPending([...locks.current]); await reload(); }
  }
  return { data,loading,pending,invoke,mutate,stock,toggleWish };
}
