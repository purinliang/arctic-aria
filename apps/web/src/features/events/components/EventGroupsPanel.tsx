// Events Page - Event Groups Panel.
import { Folder, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { Panel } from "@/components/panel";
import type { EventGroupOption } from "@/features/dashboard/types";
import type { EventMessages } from "@/messages/app-messages";
import type { EventGroupFilter } from "./event-page-helpers";

export function EventGroupsPanel({
  darkMode,
  filter,
  groups,
  pending,
  messages,
  onFilterChange,
  onManage,
}: {
  darkMode: boolean;
  filter: EventGroupFilter;
  groups: EventGroupOption[];
  pending: boolean;
  messages: EventMessages["groups"];
  onFilterChange: (filter: EventGroupFilter) => void;
  onManage: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Folder size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Settings2 size={15} aria-hidden="true" />}
            onClick={onManage}
          >
            {messages.manage}
          </Button>
        }
      />
      <div className="px-4 py-3">
        <SingleChoiceGroup
          darkMode={darkMode}
          value={filter}
          disabled={pending}
          options={[
            {
              value: "All",
              label: messages.all,
            },
            {
              value: "none",
              label: messages.noGroup,
            },
            ...groups.map((group) => ({
              value: group.id,
              label: group.name,
            })),
          ]}
          onChange={(value) => onFilterChange(value as EventGroupFilter)}
        />
      </div>
    </Panel>
  );
}
