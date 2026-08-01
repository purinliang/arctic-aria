// Routines Page - Routines List.
import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { displayDescription } from "@/components/default-description";
import { formatTimeDisplay } from "@/components/forms/time-display";
import {
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { PagedList } from "@/components/paged-list";
import type { RoutineDefinition } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { RoutineMessages } from "@/messages/app-messages";
import type { TimePickerMessages } from "@/messages/form-messages";
import { ruleSummary } from "./routine-page-helpers";

const routineDefinitionPageSize = 8;

export function RoutinesList({
  darkMode,
  loading,
  pending,
  paginationKey,
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
  paginationKey: string;
  routines: RoutineDefinition[];
  messages: RoutineMessages["page"];
  groupMessages: RoutineMessages["groups"];
  ruleMessages: RoutineMessages;
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: (routine: RoutineDefinition) => void;
}) {
  return (
    <PagedList
      ariaLabel={messages.pagination.ariaLabel}
      darkMode={darkMode}
      emptyText={messages.empty}
      items={routines}
      loading={loading}
      loadingText={messages.loading}
      messages={messages.pagination}
      pageSize={routineDefinitionPageSize}
      resetKey={paginationKey}
      renderItem={(routine) => (
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
      )}
    />
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
