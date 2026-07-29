// Events Page - Event Filters Panel.
import { ListFilter } from "lucide-react";
import { CardHeader } from "@/components/card";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { Panel } from "@/components/panel";
import type { EventMessages } from "@/messages/app-messages";
import type { EventTimeFilter } from "./event-page-helpers";

export function EventFiltersPanel({
  darkMode,
  disabled,
  filter,
  messages,
  onFilterChange,
}: {
  darkMode: boolean;
  disabled: boolean;
  filter: EventTimeFilter;
  messages: EventMessages["filters"];
  onFilterChange: (filter: EventTimeFilter) => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<ListFilter size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
      />
      <div className="px-4 py-3">
        <SingleChoiceGroup
          darkMode={darkMode}
          value={filter}
          disabled={disabled}
          options={[
            {
              value: "all",
              label: messages.all,
            },
            {
              value: "upcoming",
              label: messages.upcoming,
            },
            {
              value: "past",
              label: messages.past,
            },
          ]}
          onChange={(value) => onFilterChange(value as EventTimeFilter)}
        />
      </div>
    </Panel>
  );
}
