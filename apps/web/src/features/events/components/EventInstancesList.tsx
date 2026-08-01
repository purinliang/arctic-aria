// Events Page - Event Instances List.
import { secondaryTextColorClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { formatTimeDisplay } from "@/components/forms/time-display";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
import type { ScheduledEvent } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";

export function EventInstancesList({
  darkMode,
  loading,
  instances,
  messages,
  formMessages,
  timeFormatPreference,
}: {
  darkMode: boolean;
  loading: boolean;
  instances: ScheduledEvent[];
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
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
          <ListItemContent
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
  instance: ScheduledEvent;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return [
    formatDateKey(instance.eventDate, formMessages.datePicker),
    formatTimeDisplay(
      instance.eventTime,
      formMessages.timePicker,
      timeFormatPreference,
    ) || instance.eventTime,
    instance.location,
    instance.estimatedDurationHours
      ? messages.metadata.durationHours(instance.estimatedDurationHours)
      : null,
    messages.instances.status[instance.status],
  ]
    .filter(Boolean)
    .join(" · ");
}
