// Routines Page - Routine Instances List.
import { Clock3 } from "lucide-react";
import { Button } from "@/components/button";
import { formatDateKey } from "@/components/forms/date-format";
import { formatTimeDisplay } from "@/components/forms/time-display";
import { CheckboxControl } from "@/components/forms/selection-field";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { PagedList } from "@/components/paged-list";
import type { Routine, RoutineStatus } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";

const routineInstancePageSize = 6;

export function RoutineInstancesList({
  darkMode,
  loading,
  pending,
  paginationKey,
  instances,
  messages,
  formMessages,
  timeFormatPreference,
  onStatusChange,
  onLater,
  laterPendingIds,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  paginationKey: string;
  instances: Routine[];
  messages: RoutineMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onStatusChange: (instanceId: string, status: RoutineStatus) => void;
  onLater: (instanceId: string) => void;
  laterPendingIds: Set<string>;
}) {
  return (
    <PagedList
      ariaLabel={messages.instances.pagination.ariaLabel}
      darkMode={darkMode}
      emptyText={messages.instances.empty}
      items={instances}
      loading={loading}
      loadingText={messages.instances.loading}
      messages={messages.instances.pagination}
      pageSize={routineInstancePageSize}
      resetKey={paginationKey}
      renderItem={(instance) => (
        <ListItem
          key={instance.id}
          darkMode={darkMode}
          className="items-start"
        >
          <div className="grid min-w-0 w-full flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
            <CheckboxControl
              darkMode={darkMode}
              className="mt-1"
              disabled={pending}
              checked={instance.status === "completed"}
              aria-label={
                instance.status === "completed" || instance.status === "skipped"
                  ? messages.instances.reopenItem(instance.title)
                  : messages.instances.markDone(instance.title)
              }
              onChange={(event) =>
                onStatusChange(
                  instance.id,
                  instance.status === "skipped"
                    ? "pending"
                    : event.target.checked
                      ? "completed"
                      : "pending",
                )
              }
            />
            <ListItemContent
              title={<ListItemTitle>{instance.title}</ListItemTitle>}
              main={
                <ListItemDescription>
                  {instance.description || messages.page.noDescription}
                </ListItemDescription>
              }
              support={
                <ListItemSupportingText>
                  {instanceMetadataText({
                    instance,
                    messages,
                    formMessages,
                    timeFormatPreference,
                  })}
                </ListItemSupportingText>
              }
            />
          </div>
          {instance.status === "pending" && instance.wasReminded ? (
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="sm"
              icon={<Clock3 size={14} aria-hidden="true" />}
              disabled={laterPendingIds.has(instance.id)}
              title={messages.instances.laterHint(instance.title)}
              aria-label={messages.instances.laterHint(instance.title)}
              onClick={() => onLater(instance.id)}
            >
              {messages.instances.later}
            </Button>
          ) : null}
        </ListItem>
      )}
    />
  );
}

function instanceMetadataText({
  instance,
  messages,
  formMessages,
  timeFormatPreference,
}: {
  instance: Routine;
  messages: RoutineMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return [
    formatDateKey(instance.scheduledDate, formMessages.datePicker),
    formatTimeDisplay(
      instance.scheduledTime,
      formMessages.timePicker,
      timeFormatPreference,
    ) || instance.scheduledTime,
    messages.instances.status[instance.status],
  ].join(" · ");
}
