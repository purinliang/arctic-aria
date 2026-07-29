"use client";

// Settings Page.
import { Info, Settings } from "lucide-react";
import { useState } from "react";
import type { ThemePreference } from "@/app-shell/app-preferences";
import {
  shouldShowExpectedDatabaseVersion,
  type DatabaseVersionStatus,
} from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import { SelectInput } from "@/components/forms/selection-field";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { Panel } from "@/components/panel";
import { Switch } from "@/components/switch";
import { DeveloperToolsPanel } from "@/features/performance/components/DeveloperToolsPanel";
import type { DeveloperImportTarget } from "@/features/developer/import-template-prompts";
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
import { SettingsControlRow } from "./SettingsControlRow";

export function SettingsPage({
  currentUserId,
  currentUserIsAdmin,
  browserTimeZone,
  darkMode,
  languagePreference,
  messages,
  notificationMessages,
  onDeveloperImportComplete,
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
  onDeveloperImportComplete: (target: DeveloperImportTarget) => void;
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
  const timeZoneSupport = messages.timeZoneSystemDescription(
    browserTimeZone,
    formatTimeZoneOffset(browserTimeZone),
  );
  const [developerModeEnabled, setDeveloperModeEnabled] = useState(false);
  const showDeveloperTools = currentUserIsAdmin && developerModeEnabled;

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
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.themeLabel}
            support={messages.themeDescription}
            controlWidth="field"
            control={
              <SelectInput
                darkMode={darkMode}
                aria-label={messages.themeLabel}
                value={themePreference}
                options={themeOptions}
                onChange={(value) =>
                  onThemePreferenceChange(value as ThemePreference)
                }
                onOpenAttempt={() =>
                  onPreferenceOpenAttempt("themePreference")
                }
              />
            }
          />
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.languageLabel}
            support={
              <>
                {messages.languageDescription}
                {resolvedLanguage === "en" ? null : (
                  <>
                    <br />
                    {messages.languageSupport}
                  </>
                )}
              </>
            }
            controlWidth="field"
            control={
              <SelectInput
                darkMode={darkMode}
                aria-label={messages.languageLabel}
                value={languagePreference}
                options={languageOptions}
                onChange={(value) =>
                  onLanguagePreferenceChange(value as LanguagePreference)
                }
                onOpenAttempt={() =>
                  onPreferenceOpenAttempt("languagePreference")
                }
              />
            }
          />
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.timeFormatLabel}
            support={messages.timeFormatDescription}
            controlWidth="field"
            control={
              <SelectInput
                darkMode={darkMode}
                aria-label={messages.timeFormatLabel}
                value={timeFormatPreference}
                options={timeFormatOptions}
                onChange={(value) =>
                  onTimeFormatPreferenceChange(value as TimeFormatPreference)
                }
                onOpenAttempt={() =>
                  onPreferenceOpenAttempt("timeFormatPreference")
                }
              />
            }
          />
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.timeZoneLabel}
            support={timeZoneSupport}
            controlWidth="field"
            control={
              <SelectInput
                darkMode={darkMode}
                aria-label={messages.timeZoneLabel}
                value="system"
                options={timeZoneOptions}
                disabled
                onChange={() => undefined}
              />
            }
          />
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
          <ListItem darkMode={darkMode}>
            <ListItemContent
              title={<ListItemTitle>{messages.productName}</ListItemTitle>}
              support={
                <ListItemSupportingText>
                  {messages.productDescription}
                </ListItemSupportingText>
              }
            />
          </ListItem>
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.versionTitle}
            support={messages.versionDescription}
            control={
              <ListItemSupportingText className="tabular-nums">
                {versionStatus.appVersionText}
              </ListItemSupportingText>
            }
          />
          <HiddenDatabaseVersionRow
            darkMode={darkMode}
            messages={versionMessages}
            status={versionStatus}
          />
          {currentUserIsAdmin ? (
            <SettingsControlRow
              darkMode={darkMode}
              title={messages.developerModeTitle}
              support={messages.developerModeDescription}
              control={
                <Switch
                  checked={developerModeEnabled}
                  darkMode={darkMode}
                  label={messages.developerModeTitle}
                  onChange={setDeveloperModeEnabled}
                />
              }
            />
          ) : null}
        </List>
      </Panel>
      {showDeveloperTools ? (
        <DeveloperToolsPanel
          darkMode={darkMode}
          messages={messages}
          onDeveloperImportComplete={onDeveloperImportComplete}
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

function HiddenDatabaseVersionRow({
  darkMode,
  messages,
  status,
}: {
  darkMode: boolean;
  messages: VersionStatusMessages;
  status: DatabaseVersionStatus;
}) {
  return (
    <div
      className="hidden"
      aria-hidden="true"
      data-version-row="database"
    >
      <ListItemTitle>{messages.databaseVersion}</ListItemTitle>
      <ListItemSupportingText className="tabular-nums">
        {status.actualDatabaseVersionText}
        <DatabaseVersionMessage
          darkMode={darkMode}
          messages={messages}
          status={status}
        />
      </ListItemSupportingText>
    </div>
  );
}

function DatabaseVersionMessage({
  darkMode,
  messages,
  status,
}: {
  darkMode: boolean;
  messages: VersionStatusMessages;
  status: DatabaseVersionStatus;
}) {
  if (!status.aligned) {
    return (
      <span className={darkMode ? "text-red-300" : "text-red-600"}>
        {" "}
        ({status.message})
      </span>
    );
  }

  if (!shouldShowExpectedDatabaseVersion(status)) {
    return null;
  }

  return (
    <span>
      {" "}
      ({messages.expected} {status.expectedDatabaseVersionText})
    </span>
  );
}
