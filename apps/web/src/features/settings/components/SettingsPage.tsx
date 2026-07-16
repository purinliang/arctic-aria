// Settings Page.
import { Settings } from "lucide-react";
import type {
  LanguagePreference,
  ThemePreference,
} from "@/app-shell/app-preferences";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import { SelectInput } from "@/components/forms/selection-field";
import { FieldLabel } from "@/components/forms/input-field";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText } from "@/components/text";
import { VersionStatusRows } from "@/components/version-status";

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Use system setting" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const languageOptions: { value: LanguagePreference; label: string }[] = [
  { value: "en", label: "English" },
];

export function SettingsPage({
  darkMode,
  languagePreference,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  themePreference,
  versionStatus,
}: {
  darkMode: boolean;
  languagePreference: LanguagePreference;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
  versionStatus: DatabaseVersionStatus;
}) {
  return (
    <section className="aa-split-container">
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<Settings size={18} aria-hidden="true" />}
          title="Settings"
          description="Theme, language, and app information."
        />
        <List darkMode={darkMode}>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label="Theme">
                <SelectInput
                  darkMode={darkMode}
                  value={themePreference}
                  options={themeOptions}
                  onChange={(value) =>
                    onThemePreferenceChange(value as ThemePreference)
                  }
                />
              </FieldLabel>
              <DescriptionText darkMode={darkMode}>
                System follows your browser or operating-system preference.
              </DescriptionText>
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="grid w-full gap-2 sm:max-w-sm">
              <FieldLabel darkMode={darkMode} label="Language">
                <SelectInput
                  darkMode={darkMode}
                  value={languagePreference}
                  options={languageOptions}
                  onChange={(value) =>
                    onLanguagePreferenceChange(value as LanguagePreference)
                  }
                />
              </FieldLabel>
              <DescriptionText darkMode={darkMode}>
                English is the only supported interface language in this build.
              </DescriptionText>
            </div>
          </ListItem>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="min-w-0 flex-1">
              <VersionStatusRows darkMode={darkMode} status={versionStatus} />
            </div>
          </ListItem>
        </List>
      </Panel>
    </section>
  );
}
