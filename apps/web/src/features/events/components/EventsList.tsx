// Events Page - Event Definitions List.
import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { secondaryTextColorClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
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
import type { EventDefinition } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";
import { eventRuleSummary } from "./event-page-helpers";

export function EventsList({
  darkMode,
  loading,
  pending,
  events,
  messages,
  formMessages,
  timeFormatPreference,
  onEdit,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  events: EventDefinition[];
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: (event: EventDefinition) => void;
}) {
  return (
    <List darkMode={darkMode}>
      {loading ? (
        <LoadingLine darkMode={darkMode} text={messages.page.loading} />
      ) : null}
      {!loading && events.length === 0 ? (
        <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
          {messages.page.empty}
        </p>
      ) : null}
      {events.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          darkMode={darkMode}
          pending={pending}
          messages={messages}
          formMessages={formMessages}
          timeFormatPreference={timeFormatPreference}
          onEdit={() => onEdit(event)}
        />
      ))}
    </List>
  );
}

function EventRow({
  event,
  darkMode,
  pending,
  messages,
  formMessages,
  timeFormatPreference,
  onEdit,
}: {
  event: EventDefinition;
  darkMode: boolean;
  pending: boolean;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: () => void;
}) {
  return (
    <ListItem darkMode={darkMode} className="items-start">
      <ListItemContent
        grow={false}
        title={<ListItemTitle>{event.title}</ListItemTitle>}
        main={
          <ListItemDescription>
            {event.description || messages.page.noDescription}
          </ListItemDescription>
        }
        support={
          <ListItemSupportingText className="block min-w-0 truncate">
            {eventMetadataText({
              event,
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
          onClick={onEdit}
        >
          {messages.page.edit}
        </Button>
      </ListItemActions>
    </ListItem>
  );
}

function eventMetadataText({
  event,
  messages,
  formMessages,
  timeFormatPreference,
}: {
  event: EventDefinition;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return [
    event.groupName || messages.groups.noGroup,
    eventRuleSummary(event, messages),
    formatDateKey(event.startDate, formMessages.datePicker),
    formatTimeDisplay(
      event.scheduledTime,
      formMessages.timePicker,
      timeFormatPreference,
    ) || event.scheduledTime,
    event.estimatedDurationHours
      ? messages.metadata.durationHours(event.estimatedDurationHours)
      : null,
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");
}
