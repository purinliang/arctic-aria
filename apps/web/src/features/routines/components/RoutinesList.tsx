// Routines Page - Routines List.
import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { secondaryTextColorClass } from "@/components/color";
import { formatTimeDisplay } from "@/components/forms/time-display";
import { List, ListItem, ListItemContent } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { DescriptionText, SupportingText } from "@/components/text";
import type { RoutineDefinition } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { RoutineMessages } from "@/messages/app-messages";
import type { TimePickerMessages } from "@/messages/form-messages";
import { ruleSummary } from "./routine-page-helpers";

export function RoutinesList({
  darkMode,
  loading,
  pending,
  routines,
  messages,
  ruleMessages,
  timeMessages,
  timeFormatPreference,
  onEdit,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  routines: RoutineDefinition[];
  messages: RoutineMessages["page"];
  ruleMessages: RoutineMessages;
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: (routine: RoutineDefinition) => void;
}) {
  return (
    <List darkMode={darkMode}>
      {loading ? (
        <LoadingLine darkMode={darkMode} text={messages.loading} />
      ) : null}
      {!loading && routines.length === 0 ? (
        <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
          {messages.empty}
        </p>
      ) : null}
      {routines.map((routine) => (
        <ListItem key={routine.id} darkMode={darkMode}>
          <ListItemContent
            grow={false}
            title={
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{routine.title}</h3>
              </div>
            }
            main={
              <DescriptionText darkMode={darkMode}>
                {routine.description || messages.noDescription}
              </DescriptionText>
            }
            support={
              <SupportingText darkMode={darkMode}>
                {routineTimeText(
                  routine.preferredTime,
                  messages.flexible,
                  timeMessages,
                  timeFormatPreference,
                )} ·{" "}
                {ruleSummary(routine, ruleMessages)}
              </SupportingText>
            }
          />
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={() => onEdit(routine)}
          >
            {messages.edit}
          </Button>
        </ListItem>
      ))}
    </List>
  );
}

function routineTimeText(
  value: string | null,
  fallback: string,
  messages: TimePickerMessages,
  preference: TimeFormatPreference,
) {
  return value ? formatTimeDisplay(value, messages, preference) || value : fallback;
}
