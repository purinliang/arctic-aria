import { useCallback, useEffect, useRef, useState } from 'react';
import { getMoneyData } from '../actions';
import { useFeatureAction } from '@/components/use-feature-action';
import type { FeatureActionOptions } from '@/components/use-feature-action';
import type { FeatureResult } from '@/server/feature-result';
import type { MoneyData, MoneyPeriod } from '../types';

export function useMoney(period: MoneyPeriod, options: FeatureActionOptions) {
  const [data, setData] = useState<MoneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const invoke = useFeatureAction(options);
  const request = useRef(0);
  const { date, mode } = period;
  const reload = useCallback(async () => {
    const token = ++request.current;
    setLoading(true);
    const next = await invoke(() => getMoneyData({ date, mode }));
    if (token !== request.current) return;
    if (next) setData(next);
    setLoading(false);
  }, [date, mode, invoke]);
  useEffect(() => {
    const guard = request;
    const timer = setTimeout(() => void reload(), 0);
    return () => { clearTimeout(timer); guard.current++; };
  }, [reload]);
  async function mutate(action: () => Promise<FeatureResult<boolean>>) {
    const saved = await invoke(action);
    if (saved) await reload();
    return !!saved;
  }
  return { data, loading, mutate };
}
