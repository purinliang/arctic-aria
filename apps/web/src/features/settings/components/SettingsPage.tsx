"use client";

// Settings Page.
import { Info, Settings } from "lucide-react";
import type { ThemePreference } from "@/app-shell/app-preferences";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import {
  CheckboxField,
  SelectInput,
} from "@/components/forms/selection-field";
import { FieldLabel } from "@/components/forms/input-field";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { SupportingText } from "@/components/text";
import { VersionStatusRows } from "@/components/version-status";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import {
  formatTimeZoneOffset,
  selectableTimeZones,
  type TimeZonePreference,
} from "@/features/settings/time-zones";
import type {
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
  browserTimeZone,
  darkMode,
  languagePreference,
  multipleTimezonesEnabled,
  messages,
  onLanguagePreferenceChange,
  onMultipleTimezonesEnabledChange,
  onThemePreferenceChange,
  onTimeFormatPreferenceChange,
  onTimeZonePreferenceChange,
  resolvedLanguage,
  showErrorNotification,
  showSuccessNotification,
  themePreference,
  timeFormatPreference,
  timeZonePreference,
  versionMessages,
  versionStatus,
}: {
  currentUserId: string;
  browserTimeZone: string;
  darkMode: boolean;
  languagePreference: LanguagePreference;
  multipleTimezonesEnabled: boolean;
  messages: SettingsMessages;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onMultipleTimezonesEnabledChange: (enabled: boolean) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onTimeFormatPreferenceChange: (preference: TimeFormatPreference) => void;
  onTimeZonePreferenceChange: (preference: TimeZonePreference) => void;
  resolvedLanguage: SupportedLanguage;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  themePreference: ThemePreference;
  timeFormatPreference: TimeFormatPreference;
  timeZonePreference: TimeZonePreference;
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
    timeZonePreference,
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
                />
              </FieldLabel>
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label={messages.timeZoneLabel}>
                <SelectInput
                  darkMode={darkMode}
                  value={timeZonePreference}
                  options={timeZoneOptions}
                  onChange={(value) =>
                    onTimeZonePreferenceChange(value as TimeZonePreference)
                  }
                />
              </FieldLabel>
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="w-full sm:max-w-sm">
              <CheckboxField
                darkMode={darkMode}
                checked={multipleTimezonesEnabled}
                label={messages.multipleTimezonesLabel}
                description={messages.multipleTimezonesDescription}
                onChange={(event) =>
                  onMultipleTimezonesEnabledChange(event.target.checked)
                }
              />
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
    </section>
  );
}

function buildTimeZoneOptions({
  browserTimeZone,
  messages,
  timeZonePreference,
}: {
  browserTimeZone: string;
  messages: SettingsMessages;
  timeZonePreference: TimeZonePreference;
}) {
  const options = [
    {
      value: "system",
      label: messages.timeZoneOptions.system,
      description: messages.timeZoneSystemDescription(
        browserTimeZone,
        formatTimeZoneOffset(browserTimeZone),
      ),
    },
    ...selectableTimeZones([browserTimeZone, timeZonePreference]).map(
      (timeZone) => ({
        value: timeZone,
        label: timeZone,
        description: messages.timeZoneDescription(
          timeZone,
          formatTimeZoneOffset(timeZone),
        ),
      }),
    ),
  ];

  if (
    timeZonePreference !== "system" &&
    !options.some((option) => option.value === timeZonePreference)
  ) {
    options.push({
      value: timeZonePreference,
      label: timeZonePreference,
      description: messages.timeZoneDescription(
        timeZonePreference,
        formatTimeZoneOffset(timeZonePreference),
      ),
    });
  }

  return options;
}
