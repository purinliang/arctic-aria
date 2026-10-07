import { useCallback, useEffect, useRef, useState } from 'react';
import { getMoneyData } from '../actions';
import { useFeatureAction } from '@/components/use-feature-action';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { FeatureResult } from '@/server/feature-result';
import type { MoneyData, MoneyPeriod } from '../types';
import { clearMoneyBrowserCache, moneyPeriodKey, readMoneyBrowserCache, writeMoneyBrowserCache } from '../money-browser-cache';

export function useMoney({ userId,timezone,period }: { userId: string; timezone: string; period: MoneyPeriod }, options: FeatureActionOptions) {
  const scope = JSON.stringify([userId,timezone,moneyPeriodKey(period)]);
  const [snapshot,setSnapshot] = useState<{ scope: string; data: MoneyData | null; loading: boolean }>({ scope,data: null,loading: true });
  const invoke = useFeatureAction(options);
  const request = useRef(0);
  const active = useRef(false);
  const activeScope = useRef(scope);
  const { date, mode } = period;
  const reload = useCallback(async () => {
    if (!active.current || activeScope.current !== scope) return;
    const token = ++request.current;
    const next = await invoke(() => getMoneyData({ date, mode }));
    if (token !== request.current) return;
    if (next) writeMoneyBrowserCache({ userId,timezone },{ date,mode },next);
    setSnapshot((current) => ({ scope,data: next ?? (current.scope === scope ? current.data : null),loading: false }));
  }, [date, mode, invoke,userId,timezone,scope]);
  useEffect(() => {
    const guard = request;
    active.current = true;
    activeScope.current = scope;
    const timer = setTimeout(() => {
      const data = readMoneyBrowserCache({ userId,timezone },{ date,mode });
      setSnapshot({ scope,data,loading: data === null });
      void reload();
    }, 0);
    return () => { clearTimeout(timer); guard.current++; active.current = false; };
  }, [reload,userId,timezone,date,mode,scope]);
  async function mutate(action: () => Promise<FeatureResult<boolean>>) {
    const saved = await invoke(action);
    if (saved) {
      clearMoneyBrowserCache(userId);
      if (active.current) await reload();
    }
    return !!saved;
  }
  return { data: snapshot.scope === scope ? snapshot.data : null, loading: snapshot.scope !== scope || snapshot.loading, mutate };
}
