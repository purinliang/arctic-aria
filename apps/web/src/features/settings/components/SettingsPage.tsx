"use client";

// Settings Page.
import { Info, Settings } from "lucide-react";
import type { ThemePreference } from "@/app-shell/app-preferences";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import { SelectInput } from "@/components/forms/selection-field";
import { FieldLabel } from "@/components/forms/input-field";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { SupportingText } from "@/components/text";
import { VersionStatusRows } from "@/components/version-status";
import { DeveloperToolsPanel } from "@/features/performance/components/DeveloperToolsPanel";
import type {
  TimeFormatPreference,
  UserPreferences,
} from "@/features/settings/preferences";
import { formatTimeZoneOffset } from "@/features/settings/time-zones";
import type {
  NotificationMessages,
  SettingsMessages,
  VersionStatusMessages,
} from "@/messages/app-messages";
import type {
  LanguagePreference,
  SupportedLanguage,
} from "@/messages/languages";
import { DiscordBindingSettings } from "./DiscordBindingSettings";
import { DiscordIcon } from "./DiscordIcon";

export function SettingsPage({
  currentUserId,
  currentUserIsAdmin,
  browserTimeZone,
  darkMode,
  languagePreference,
  messages,
  notificationMessages,
  onLanguagePreferenceChange,
  onPreferenceOpenAttempt,
  onThemePreferenceChange,
  onTimeFormatPreferenceChange,
  resolvedLanguage,
  showErrorNotification,
  showSuccessNotification,
  themePreference,
  timeFormatPreference,
  versionMessages,
  versionStatus,
}: {
  currentUserId: string;
  currentUserIsAdmin: boolean;
  browserTimeZone: string;
  darkMode: boolean;
  languagePreference: LanguagePreference;
  messages: SettingsMessages;
  notificationMessages: NotificationMessages;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onPreferenceOpenAttempt: (preference: keyof UserPreferences) => boolean;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onTimeFormatPreferenceChange: (preference: TimeFormatPreference) => void;
  resolvedLanguage: SupportedLanguage;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  themePreference: ThemePreference;
  timeFormatPreference: TimeFormatPreference;
  versionMessages: VersionStatusMessages;
  versionStatus: DatabaseVersionStatus;
}) {
  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "system", label: messages.themeOptions.system },
    { value: "light", label: messages.themeOptions.light },
    { value: "dark", label: messages.themeOptions.dark },
  ];
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: "system", label: messages.languageOptions.system },
    { value: "en", label: messages.languageOptions.english },
    { value: "zh-CN", label: messages.languageOptions.simplifiedChinese },
  ];
  const timeFormatOptions: { value: TimeFormatPreference; label: string }[] = [
    { value: "12h", label: messages.timeFormatOptions.twelveHour },
    { value: "24h", label: messages.timeFormatOptions.twentyFourHour },
  ];
  const timeZoneOptions = buildTimeZoneOptions({
    browserTimeZone,
    messages,
  });

  return (
    <section className="grid gap-4">
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<Settings size={18} aria-hidden="true" />}
          title={messages.preferencesTitle}
          description={messages.preferencesDescription}
        />
        <List darkMode={darkMode}>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label={messages.themeLabel}>
                <SelectInput
                  darkMode={darkMode}
                  value={themePreference}
                  options={themeOptions}
                  onChange={(value) =>
                    onThemePreferenceChange(value as ThemePreference)
                  }
                  onOpenAttempt={() =>
                    onPreferenceOpenAttempt("themePreference")
                  }
                />
              </FieldLabel>
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label={messages.languageLabel}>
                <SelectInput
                  darkMode={darkMode}
                  value={languagePreference}
                  options={languageOptions}
                  onChange={(value) =>
                    onLanguagePreferenceChange(value as LanguagePreference)
                  }
                  onOpenAttempt={() =>
                    onPreferenceOpenAttempt("languagePreference")
                  }
                />
              </FieldLabel>
              {resolvedLanguage === "en" ? null : (
                <SupportingText darkMode={darkMode}>
                  {messages.languageSupport}
                </SupportingText>
              )}
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label={messages.timeFormatLabel}>
                <SelectInput
                  darkMode={darkMode}
                  value={timeFormatPreference}
                  options={timeFormatOptions}
                  onChange={(value) =>
                    onTimeFormatPreferenceChange(value as TimeFormatPreference)
                  }
                  onOpenAttempt={() =>
                    onPreferenceOpenAttempt("timeFormatPreference")
                  }
                />
              </FieldLabel>
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label={messages.timeZoneLabel}>
                <SelectInput
                  darkMode={darkMode}
                  value="system"
                  options={timeZoneOptions}
                  disabled
                  onChange={() => undefined}
                />
              </FieldLabel>
            </div>
          </ListItem>
        </List>
      </Panel>
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<DiscordIcon darkMode={darkMode} />}
          title={messages.discord.title}
          description={messages.discord.description}
        />
        <List darkMode={darkMode}>
          <DiscordBindingSettings
            currentUserId={currentUserId}
            darkMode={darkMode}
            messages={messages}
            notificationMessages={notificationMessages}
            showErrorNotification={showErrorNotification}
            showSuccessNotification={showSuccessNotification}
          />
        </List>
      </Panel>
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<Info size={18} aria-hidden="true" />}
          title={messages.appInformationTitle}
          description={messages.appInformationDescription}
        />
        <List darkMode={darkMode}>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="min-w-0 flex-1">
              <VersionStatusRows
                darkMode={darkMode}
                messages={versionMessages}
                status={versionStatus}
              />
            </div>
          </ListItem>
        </List>
      </Panel>
      {currentUserIsAdmin ? (
        <DeveloperToolsPanel
          darkMode={darkMode}
          messages={messages}
          showErrorNotification={showErrorNotification}
          showSuccessNotification={showSuccessNotification}
        />
      ) : null}
    </section>
  );
}

function buildTimeZoneOptions({
  browserTimeZone,
  messages,
}: {
  browserTimeZone: string;
  messages: SettingsMessages;
}) {
  return [
    {
      value: "system",
      label: messages.timeZoneOptions.system,
      description: messages.timeZoneSystemDescription(
        browserTimeZone,
        formatTimeZoneOffset(browserTimeZone),
      ),
    },
  ];
}
