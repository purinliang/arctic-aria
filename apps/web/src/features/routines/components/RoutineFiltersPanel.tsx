// Routines Page - Routine Instance Filters Panel.
import { ListFilter } from "lucide-react";
import { CardHeader } from "@/components/card";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { Panel } from "@/components/panel";
import { cardBodyPaddingClass } from "@/components/spacing";
import type { InstanceDateFilter } from "@/features/instance-date-filters";
import type { RoutineMessages } from "@/messages/app-messages";

export function RoutineFiltersPanel({
  darkMode,
  disabled,
  filter,
  messages,
  onFilterChange,
}: {
  darkMode: boolean;
  disabled: boolean;
  filter: InstanceDateFilter;
  messages: RoutineMessages["filters"];
  onFilterChange: (filter: InstanceDateFilter) => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<ListFilter size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
      />
      <div className={cardBodyPaddingClass}>
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
              value: "recent",
              label: messages.recent,
            },
            {
              value: "future",
              label: messages.future,
            },
            {
              value: "past",
              label: messages.past,
            },
          ]}
          onChange={(value) => onFilterChange(value as InstanceDateFilter)}
        />
      </div>
    </Panel>
  );
}
