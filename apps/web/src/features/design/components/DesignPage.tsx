"use client";

// Design Page.
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ThemeMode, ThemePreference } from "@/app-shell/app-preferences";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { List } from "@/components/list";
import { Panel } from "@/components/panel";
import { SettingsControlRow } from "@/components/settings-control-row";
import { Tabs, type TabOption } from "@/components/tabs";
import { cx } from "@/components/utils";
import {
  getDesignMessages,
  type DesignMessages,
} from "@/messages/design-messages";
import type {
  LanguagePreference,
  SupportedLanguage,
} from "@/messages/languages";
import { DesignButtonPage } from "./DesignButtonPage";
import { DesignColorPage } from "./DesignColorPage";

type DesignTab = "colors" | "buttons";

export function DesignPage({
  darkMode,
  languagePreference,
  resolvedLanguage,
  themePreference,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
}: {
  darkMode: boolean;
  languagePreference: LanguagePreference;
  resolvedLanguage: SupportedLanguage;
  themePreference: ThemePreference;
  onLanguagePreferenceChange: (language: LanguagePreference) => void;
  onThemePreferenceChange: (theme: ThemePreference) => void;
}) {
  const [activeTab, setActiveTab] = useState<DesignTab>("colors");
  const previewTheme = darkMode ? "dark" : "light";
  const messages = getDesignMessages(resolvedLanguage);
  const activePageMessages =
    activeTab === "buttons" ? messages.buttons : messages.colors;
  const tabOptions = useMemo<TabOption[]>(
    () => [
      { value: "colors", label: messages.tabs.colors },
      { value: "buttons", label: messages.tabs.buttons },
    ],
    [messages],
  );
  useRestoreDesignPreferences({
    languagePreference,
    themePreference,
    onLanguagePreferenceChange,
    onThemePreferenceChange,
  });

  return (
    <section className="grid gap-4">
      <PreviewControls
        darkMode={darkMode}
        messages={messages.preview}
        previewLanguage={resolvedLanguage}
        previewTheme={previewTheme}
        onLanguageChange={onLanguagePreferenceChange}
        onThemeChange={onThemePreferenceChange}
      />
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-5">
            {activePageMessages.title}
          </h2>
          <p className={cx("mt-0.5 text-sm leading-5", secondaryTextColorClass)}>
            {activePageMessages.description}
          </p>
        </div>
        <Tabs
          ariaLabel={messages.tabs.ariaLabel}
          darkMode={darkMode}
          options={tabOptions}
          value={activeTab}
          onChange={(value) => setActiveTab(readDesignTab(value))}
        />
      </div>
      {activeTab === "buttons" ? (
        <DesignButtonPage
          darkMode={darkMode}
          messages={messages.buttons}
        />
      ) : (
        <DesignColorPage darkMode={darkMode} messages={messages.colors} />
      )}
    </section>
  );
}

function PreviewControls({
  darkMode,
  messages,
  previewLanguage,
  previewTheme,
  onLanguageChange,
  onThemeChange,
}: {
  darkMode: boolean;
  messages: DesignMessages["preview"];
  previewLanguage: SupportedLanguage;
  previewTheme: ThemeMode;
  onLanguageChange: (language: LanguagePreference) => void;
  onThemeChange: (theme: ThemePreference) => void;
}) {
  const themeOptions = [
    {
      value: "light",
      label: messages.light,
      icon: <Sun size={14} aria-hidden="true" />,
    },
    {
      value: "dark",
      label: messages.dark,
      icon: <Moon size={14} aria-hidden="true" />,
    },
  ];
  const languageOptions = [
    { value: "en", label: messages.english },
    { value: "zh-CN", label: messages.simplifiedChinese },
  ];

  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        darkMode={darkMode}
        icon={<SlidersHorizontal size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
      />
      <List darkMode={darkMode}>
        <SettingsControlRow
          darkMode={darkMode}
          title={messages.themeTitle}
          support={messages.themeDescription}
          control={
            <SingleChoiceGroup
              darkMode={darkMode}
              options={themeOptions}
              value={previewTheme}
              className="shrink-0 justify-start sm:justify-end"
              onChange={(value) => onThemeChange(readPreviewTheme(value))}
            />
          }
        />
        <SettingsControlRow
          darkMode={darkMode}
          title={messages.languageTitle}
          support={messages.languageDescription}
          control={
            <SingleChoiceGroup
              darkMode={darkMode}
              options={languageOptions}
              value={previewLanguage}
              className="shrink-0 justify-start sm:justify-end"
              onChange={(value) => onLanguageChange(readPreviewLanguage(value))}
            />
          }
        />
      </List>
    </Panel>
  );
}

function readDesignTab(value: string): DesignTab {
  return value === "buttons" ? "buttons" : "colors";
}

function readPreviewTheme(value: string): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

function readPreviewLanguage(value: string): SupportedLanguage {
  return value === "zh-CN" ? "zh-CN" : "en";
}

function useRestoreDesignPreferences({
  languagePreference,
  themePreference,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
}: {
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  onLanguagePreferenceChange: (language: LanguagePreference) => void;
  onThemePreferenceChange: (theme: ThemePreference) => void;
}) {
  const initialPreferencesRef = useRef<{
    languagePreference: LanguagePreference;
    themePreference: ThemePreference;
  }>({ languagePreference, themePreference });
  const latestPreferencesRef = useRef<{
    languagePreference: LanguagePreference;
    themePreference: ThemePreference;
  }>({ languagePreference, themePreference });

  useEffect(() => {
    latestPreferencesRef.current = { languagePreference, themePreference };
  }, [languagePreference, themePreference]);

  useEffect(
    () => () => {
      const initialPreferences = initialPreferencesRef.current;
      const latestPreferences = latestPreferencesRef.current;

      if (
        latestPreferences.themePreference !==
        initialPreferences.themePreference
      ) {
        onThemePreferenceChange(initialPreferences.themePreference);
      }

      if (
        latestPreferences.languagePreference !==
        initialPreferences.languagePreference
      ) {
        onLanguagePreferenceChange(initialPreferences.languagePreference);
      }
    },
    [onLanguagePreferenceChange, onThemePreferenceChange],
  );
}
