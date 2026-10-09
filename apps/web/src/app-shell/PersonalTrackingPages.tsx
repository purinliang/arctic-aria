import { DailyLifePage } from '@/features/daily-life/components/DailyLifePage';
import { MoneyPage } from '@/features/money/components/MoneyPage';
import { SuppliesPage } from '@/features/supplies/components/SuppliesPage';
import type { AppMessages } from '@/messages/app-messages';
import type { SupportedLanguage } from '@/messages/languages';
import type { TimeFormatPreference } from '@/features/settings/preferences';

export function PersonalTrackingPages({ userId, view, darkMode, timezone, language, timeFormatPreference, messages, showErrorNotification }: {
  userId: string; view: 'daily' | 'money' | 'supplies'; darkMode: boolean; timezone: string; language: SupportedLanguage;
  timeFormatPreference: TimeFormatPreference; messages: AppMessages; showErrorNotification: (message: string, title?: string) => void;
}) {
  const shared = { darkMode, timezone, language, formMessages: messages.forms, notificationMessages: messages.notifications, showErrorNotification };
  return view === 'supplies' ? <SuppliesPage key={userId} userId={userId} {...shared} messages={messages.supplies} /> : view === 'money' ? <MoneyPage key={userId} userId={userId} {...shared} messages={messages.money} />
    : <DailyLifePage key={userId} userId={userId} {...shared} messages={messages.dailyLife} timeFormatPreference={timeFormatPreference} />;
}
