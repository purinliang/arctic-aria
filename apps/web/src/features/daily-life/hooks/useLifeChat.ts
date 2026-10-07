import { useCallback, useEffect, useRef, useState } from 'react';
import { getLifeChatHistory, sendLifeChatMessage } from '../actions';
import type { LifeChatTurn } from '../types';
import { useLifeAction } from './useLifeAction';
import type { LifeActionOptions } from './useLifeAction';

export function useLifeChat(options: LifeActionOptions) {
  const invoke = useLifeAction(options);
  const [turns, setTurns] = useState<LifeChatTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const retry = useRef<{ captureKey: string; message: string } | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++sequence.current;
    setLoading(true);
    const data = await invoke(getLifeChatHistory);
    if (version !== sequence.current) return;
    if (data) setTurns(data);
    setLoading(false);
  }, [invoke]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => { clearTimeout(timer); sequence.current += 1; };
  }, [refresh]);

  async function send(message: string) {
    if (lock.current) return false;
    lock.current = true;
    setPending(true);
    const input = retry.current?.message === message ? retry.current : { captureKey: crypto.randomUUID(), message };
    retry.current = input;
    try {
      const turn = await invoke(() => sendLifeChatMessage(input));
      if (!turn) return false;
      sequence.current += 1;
      setLoading(false);
      setTurns((current) => [turn, ...current.filter((item) => item.id !== turn.id)]);
      retry.current = null;
      return true;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return { turns, loading, pending, refresh, send };
}
