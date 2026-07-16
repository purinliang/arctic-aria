// Settings Page.
import { Info } from "lucide-react";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { CardHeader } from "@/components/card";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { VersionStatusRows } from "@/components/version-status";

export function SettingsPage({
  darkMode,
  versionStatus,
}: {
  darkMode: boolean;
  versionStatus: DatabaseVersionStatus;
}) {
  return (
    <section className="aa-split-container">
      <Panel darkMode={darkMode} className="min-w-0">
        <CardHeader
          darkMode={darkMode}
          icon={<Info size={18} aria-hidden="true" />}
          title="App Information"
          description="Version and database status."
        />
        <List darkMode={darkMode}>
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
