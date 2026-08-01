// Events Page - Event Instances List.
import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { formatDateKey } from "@/components/forms/date-format";
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
import type { ScheduledEvent } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";

const eventInstancePageSize = 6;

export function EventInstancesList({
  darkMode,
  loading,
  pending,
  paginationKey,
  instances,
  messages,
  formMessages,
  timeFormatPreference,
  onEdit,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  paginationKey: string;
  instances: ScheduledEvent[];
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: (instance: ScheduledEvent) => void;
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
      pageSize={eventInstancePageSize}
      resetKey={paginationKey}
      renderItem={(instance) => (
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
          <ListItemActions>
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Edit3 size={15} aria-hidden="true" />}
              onClick={() => onEdit(instance)}
            >
              {messages.instances.edit}
            </Button>
          </ListItemActions>
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
