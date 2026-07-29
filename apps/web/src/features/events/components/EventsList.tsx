// Events Page - Events List.
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
import { LabelText } from "@/components/text";
import type { ScheduledEvent } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { EventMessages, FormMessages } from "@/messages/app-messages";
import type { EventTimeFilter } from "./event-page-helpers";

export function EventsList({
  darkMode,
  loading,
  pending,
  upcomingEvents,
  pastEvents,
  filter,
  messages,
  formMessages,
  timeFormatPreference,
  onEdit,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  upcomingEvents: ScheduledEvent[];
  pastEvents: ScheduledEvent[];
  filter: EventTimeFilter;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: (event: ScheduledEvent) => void;
}) {
  const hasEvents = upcomingEvents.length > 0 || pastEvents.length > 0;

  return (
    <List darkMode={darkMode}>
      {loading ? (
        <LoadingLine darkMode={darkMode} text={messages.page.loading} />
      ) : null}
      {!loading && !hasEvents ? (
        <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
          {emptyTextForFilter(filter, messages)}
        </p>
      ) : null}
      <EventSection
        darkMode={darkMode}
        label={messages.page.upcoming}
        showLabel={false}
        events={upcomingEvents}
        pending={pending}
        messages={messages}
        formMessages={formMessages}
        timeFormatPreference={timeFormatPreference}
        onEdit={onEdit}
      />
      <EventSection
        darkMode={darkMode}
        label={messages.page.past}
        showLabel={filter === "all"}
        events={pastEvents}
        pending={pending}
        messages={messages}
        formMessages={formMessages}
        timeFormatPreference={timeFormatPreference}
        onEdit={onEdit}
      />
    </List>
  );
}

function emptyTextForFilter(
  filter: EventTimeFilter,
  messages: EventMessages,
) {
  if (filter === "upcoming") {
    return messages.page.emptyUpcoming;
  }

  if (filter === "past") {
    return messages.page.emptyPast;
  }

  return messages.page.empty;
}

function EventSection({
  darkMode,
  label,
  showLabel,
  events,
  pending,
  messages,
  formMessages,
  timeFormatPreference,
  onEdit,
}: {
  darkMode: boolean;
  label: string;
  showLabel: boolean;
  events: ScheduledEvent[];
  pending: boolean;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onEdit: (event: ScheduledEvent) => void;
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <>
      {showLabel ? (
        <div className="px-4 pb-1 pt-3">
          <LabelText darkMode={darkMode}>{label}</LabelText>
        </div>
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
    </>
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
  event: ScheduledEvent;
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
  event: ScheduledEvent;
  messages: EventMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return [
    formatDateKey(event.eventDate, formMessages.datePicker),
    formatTimeDisplay(
      event.eventTime,
      formMessages.timePicker,
      timeFormatPreference,
    ) || event.eventTime,
    event.estimatedDurationHours
      ? messages.metadata.durationHours(event.estimatedDurationHours)
      : null,
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");
}
