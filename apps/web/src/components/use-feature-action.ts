import { useCallback } from 'react';
import { notifyActionFailure, runNotifiedServerAction } from '../app-shell/action-notifications';
import type { NotificationMessages } from '../messages/app-messages';
import type { FeatureResult } from '../server/feature-result';

export type FeatureActionOptions = {
  notificationMessages: NotificationMessages;
  showErrorNotification: (message: string, title?: string) => void;
  resultMessages: Record<string, string>;
};
export function useFeatureAction({ notificationMessages, showErrorNotification, resultMessages }: FeatureActionOptions) {
  return useCallback(async <T,>(action: () => Promise<FeatureResult<T>>) => {
    const result = await runNotifiedServerAction({ action, messages: notificationMessages, showErrorNotification });
    if (!result.ok) return null;
    if (!result.value.ok) {
      notifyActionFailure({ result: result.value, resultMessages, notificationMessages, showErrorNotification });
      return null;
    }
    return result.value.data;
  }, [notificationMessages, showErrorNotification, resultMessages]);
}
