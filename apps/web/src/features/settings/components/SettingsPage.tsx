// Settings Page.
import { Settings } from "lucide-react";
import { getAppMetadata } from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, LabelText, SupportingText } from "@/components/text";

export function SettingsPage({ darkMode }: { darkMode: boolean }) {
  const metadata = getAppMetadata();

  return (
    <section className="aa-split-container">
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<Settings size={18} aria-hidden="true" />}
          title="App metadata"
          description="Current build identity for release and migration checks."
        />
        <List darkMode={darkMode}>
          <ListItem darkMode={darkMode} className="items-start">
            <div className="min-w-0 flex-1">
              <LabelText darkMode={darkMode}>Version metadata</LabelText>
              <DescriptionText darkMode={darkMode} className="mt-1">
                Use this information to compare the deployed app with database
                migration records.
              </DescriptionText>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <MetadataItem
                  darkMode={darkMode}
                  label="Version"
                  value={metadata.version}
                />
                <MetadataItem
                  darkMode={darkMode}
                  label="Commit"
                  value={metadata.commit}
                />
                <MetadataItem
                  darkMode={darkMode}
                  label="Source"
                  value={metadata.sourceState}
                />
              </dl>
            </div>
          </ListItem>
        </List>
      </Panel>
    </section>
  );
}

function MetadataItem({
  darkMode,
  label,
  value,
}: {
  darkMode: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt>
        <SupportingText darkMode={darkMode}>{label}</SupportingText>
      </dt>
      <dd className="mt-1 truncate font-mono text-sm">{value}</dd>
    </div>
  );
}
