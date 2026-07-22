// Routines Page - Routines List.
import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatTimeDisplay } from "@/components/forms/time-display";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
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
  groupMessages,
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
  groupMessages: RoutineMessages["groups"];
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
        <ListItem key={routine.id} darkMode={darkMode} className="items-start">
          <ListItemContent
            grow={false}
            title={<ListItemTitle>{routine.title}</ListItemTitle>}
            main={
              <ListItemDescription>
                {displayDescription(
                  routine.description,
                  routine.title,
                  ruleMessages.defaultDescriptions,
                )}
              </ListItemDescription>
            }
            support={
              <ListItemSupportingText className="block min-w-0 truncate">
                {routineMetadataText({
                  routine,
                  groupMessages,
                  flexibleText: messages.flexible,
                  ruleMessages,
                  timeMessages,
                  timeFormatPreference,
                })}
              </ListItemSupportingText>
            }
          />
          <ListItemActions>
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Edit3 size={15} aria-hidden="true" />}
              onClick={() => onEdit(routine)}
            >
              {messages.edit}
            </Button>
          </ListItemActions>
        </ListItem>
      ))}
    </List>
  );
}

function routineMetadataText({
  routine,
  groupMessages,
  flexibleText,
  ruleMessages,
  timeMessages,
  timeFormatPreference,
}: {
  routine: RoutineDefinition;
  groupMessages: RoutineMessages["groups"];
  flexibleText: string;
  ruleMessages: RoutineMessages;
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return [
    routine.groupName || groupMessages.noGroup,
    routineTimeText(
      routine.preferredTime,
      flexibleText,
      timeMessages,
      timeFormatPreference,
    ),
    ruleSummary(routine, ruleMessages),
  ].join(" · ");
}

function routineTimeText(
  value: string | null,
  fallback: string,
  messages: TimePickerMessages,
  preference: TimeFormatPreference,
) {
  return value ? formatTimeDisplay(value, messages, preference) || value : fallback;
}
