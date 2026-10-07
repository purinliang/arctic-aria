import { useCallback } from 'react';
import { notifyActionFailure, runNotifiedServerAction } from '@/app-shell/action-notifications';
import type { NotificationMessages } from '@/messages/app-messages';
import type { DailyLifeMessages } from '@/messages/daily-life-messages';
import type { LifeResult } from '../server/life-service';

export type LifeActionOptions = {
  messages: DailyLifeMessages;
  notificationMessages: NotificationMessages;
  showErrorNotification: (message: string, title?: string) => void;
};

export function useLifeAction({ messages, notificationMessages, showErrorNotification }: LifeActionOptions) {
  return useCallback(async <T,>(action: () => Promise<LifeResult<T>>) => {
    const response = await runNotifiedServerAction({ action, messages: notificationMessages, showErrorNotification });
    if (!response.ok) return null;
    if (!response.value.ok) {
      notifyActionFailure({ result: response.value, resultMessages: messages.results, notificationMessages, showErrorNotification });
      return null;
    }
    return response.value.data;
  }, [messages.results, notificationMessages, showErrorNotification]);
}
