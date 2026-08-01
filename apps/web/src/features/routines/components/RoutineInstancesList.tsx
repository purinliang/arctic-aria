// Routines Page - Routine Instances List.
import { secondaryTextColorClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { formatTimeDisplay } from "@/components/forms/time-display";
import { CheckboxControl } from "@/components/forms/selection-field";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
import type { Routine, RoutineStatus } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";

export function RoutineInstancesList({
  darkMode,
  loading,
  pending,
  instances,
  messages,
  formMessages,
  timeFormatPreference,
  onStatusChange,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  instances: Routine[];
  messages: RoutineMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onStatusChange: (instanceId: string, status: RoutineStatus) => void;
}) {
  return (
    <List darkMode={darkMode}>
      {loading ? (
        <LoadingLine darkMode={darkMode} text={messages.instances.loading} />
      ) : null}
      {!loading && instances.length === 0 ? (
        <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
          {messages.instances.empty}
        </p>
      ) : null}
      {instances.map((instance) => (
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
              grow={false}
              title={<ListItemTitle>{instance.title}</ListItemTitle>}
              main={
                <ListItemDescription>
                  {instance.description || messages.page.noDescription}
                </ListItemDescription>
              }
              support={
                <ListItemSupportingText className="block min-w-0 truncate">
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
        </ListItem>
      ))}
    </List>
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
