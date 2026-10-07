import { DailyLifePage } from '@/features/daily-life/components/DailyLifePage';
import { MoneyPage } from '@/features/money/components/MoneyPage';
import type { AppMessages } from '@/messages/app-messages';
import type { SupportedLanguage } from '@/messages/languages';
import type { TimeFormatPreference } from '@/features/settings/preferences';

export function PersonalTrackingPages({ view, darkMode, timezone, language, timeFormatPreference, messages, showErrorNotification }: {
  view: 'daily' | 'money'; darkMode: boolean; timezone: string; language: SupportedLanguage;
  timeFormatPreference: TimeFormatPreference; messages: AppMessages; showErrorNotification: (message: string, title?: string) => void;
}) {
  const shared = { darkMode, timezone, language, formMessages: messages.forms, notificationMessages: messages.notifications, showErrorNotification };
  return view === 'money' ? <MoneyPage {...shared} messages={messages.money} />
    : <DailyLifePage {...shared} messages={messages.dailyLife} timeFormatPreference={timeFormatPreference} />;
}
