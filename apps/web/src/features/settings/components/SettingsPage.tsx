"use client";

// Settings Page.
import { Info, MessageCircle, Settings } from "lucide-react";
import type { ThemePreference } from "@/app-shell/app-preferences";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import { SelectInput } from "@/components/forms/selection-field";
import { FieldLabel } from "@/components/forms/input-field";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { SupportingText } from "@/components/text";
import { VersionStatusRows } from "@/components/version-status";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type {
  SettingsMessages,
  VersionStatusMessages,
} from "@/messages/app-messages";
import type { LanguagePreference } from "@/messages/languages";
import { DiscordBindingSettings } from "./DiscordBindingSettings";

export function SettingsPage({
  darkMode,
  languagePreference,
  messages,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  onTimeFormatPreferenceChange,
  showErrorNotification,
  showSuccessNotification,
  themePreference,
  timeFormatPreference,
  versionMessages,
  versionStatus,
}: {
  darkMode: boolean;
  languagePreference: LanguagePreference;
  messages: SettingsMessages;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onTimeFormatPreferenceChange: (preference: TimeFormatPreference) => void;
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
              <SupportingText darkMode={darkMode}>
                {messages.languageSupport}
              </SupportingText>
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
        </List>
      </Panel>
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<MessageCircle size={18} aria-hidden="true" />}
          title={messages.discord.title}
          description={messages.discord.description}
        />
        <List darkMode={darkMode}>
          <DiscordBindingSettings
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
