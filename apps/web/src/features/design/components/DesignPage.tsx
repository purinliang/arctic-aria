"use client";

// Design Page.
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ThemeMode, ThemePreference } from "@/app-shell/app-preferences";
import { CardHeader } from "@/components/card";
import { ContentSection } from "@/components/content-section";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { List } from "@/components/list";
import { Panel } from "@/components/panel";
import { SettingsControlRow } from "@/components/settings-control-row";
import { pageStackClass } from "@/components/spacing";
import { Tabs, type TabOption } from "@/components/tabs";
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
import { DesignSpacingPage } from "./DesignSpacingPage";
import { DesignTypographyPage } from "./DesignTypographyPage";

type DesignTab = "colors" | "buttons" | "typography" | "spacing";

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
  const activePageMessages = designPageMessages(messages, activeTab);
  const tabOptions = useMemo<TabOption[]>(
    () => [
      { value: "colors", label: messages.tabs.colors },
      { value: "buttons", label: messages.tabs.buttons },
      { value: "typography", label: messages.tabs.typography },
      { value: "spacing", label: messages.tabs.spacing },
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
    <section className={pageStackClass}>
      <PreviewControls
        darkMode={darkMode}
        messages={messages.preview}
        previewLanguage={resolvedLanguage}
        previewTheme={previewTheme}
        onLanguageChange={onLanguagePreferenceChange}
        onThemeChange={onThemePreferenceChange}
      />
      <ContentSection
        darkMode={darkMode}
        title={activePageMessages.title}
        description={activePageMessages.description}
        action={
          <Tabs
            ariaLabel={messages.tabs.ariaLabel}
            darkMode={darkMode}
            options={tabOptions}
            value={activeTab}
            onChange={(value) => setActiveTab(readDesignTab(value))}
          />
        }
      >
        <ActiveDesignPage
          activeTab={activeTab}
          darkMode={darkMode}
          messages={messages}
        />
      </ContentSection>
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
  if (value === "buttons" || value === "typography" || value === "spacing") {
    return value;
  }

  return "colors";
}

function readPreviewTheme(value: string): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

function readPreviewLanguage(value: string): SupportedLanguage {
  return value === "zh-CN" ? "zh-CN" : "en";
}

function designPageMessages(messages: DesignMessages, activeTab: DesignTab) {
  if (activeTab === "buttons") {
    return messages.buttons;
  }

  if (activeTab === "typography") {
    return messages.typography;
  }

  if (activeTab === "spacing") {
    return messages.spacing;
  }

  return messages.colors;
}

function ActiveDesignPage({
  activeTab,
  darkMode,
  messages,
}: {
  activeTab: DesignTab;
  darkMode: boolean;
  messages: DesignMessages;
}) {
  if (activeTab === "buttons") {
    return <DesignButtonPage darkMode={darkMode} messages={messages.buttons} />;
  }

  if (activeTab === "typography") {
    return (
      <DesignTypographyPage
        darkMode={darkMode}
        messages={messages.typography}
      />
    );
  }

  if (activeTab === "spacing") {
    return <DesignSpacingPage darkMode={darkMode} messages={messages.spacing} />;
  }

  return <DesignColorPage darkMode={darkMode} messages={messages.colors} />;
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
