// Dashboard - Events Panel.
import { CalendarDays } from "lucide-react";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { formatTimeDisplay } from "@/components/forms/time-display";
import {
  List,
  ListFooterAction,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
  ListItemTitleButton,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { todayPanelItemLimit } from "@/features/dashboard/today-panel-display";
import type { ScheduledEvent } from "@/features/dashboard/types";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { DashboardMessages } from "@/messages/app-messages";
import type { TimePickerMessages } from "@/messages/form-messages";

export function EventsPanel({
  darkMode,
  events,
  loading,
  messages,
  timeMessages,
  timeFormatPreference,
  onEventOpen,
}: {
  darkMode: boolean;
  events: ScheduledEvent[];
  loading: boolean;
  messages: DashboardMessages["events"];
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
  onEventOpen: () => void;
}) {
  const visibleEvents = events.slice(0, todayPanelItemLimit);
  const hasMoreEvents = events.length > visibleEvents.length;

  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<CalendarDays size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {!loading && events.length === 0 ? (
          <EmptyLine text={messages.empty} />
        ) : null}
        {visibleEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            darkMode={darkMode}
            messages={messages}
            timeMessages={timeMessages}
            timeFormatPreference={timeFormatPreference}
            onOpen={onEventOpen}
          />
        ))}
        {!loading && hasMoreEvents ? (
          <ListFooterAction
            darkMode={darkMode}
            label={messages.open}
            onClick={onEventOpen}
          />
        ) : null}
      </List>
    </Panel>
  );
}

function EventRow({
  event,
  darkMode,
  messages,
  timeMessages,
  timeFormatPreference,
  onOpen,
}: {
  event: ScheduledEvent;
  darkMode: boolean;
  messages: DashboardMessages["events"];
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
  onOpen: () => void;
}) {
  return (
    <ListItem darkMode={darkMode} className="items-start">
      <ListItemContent
        grow
        title={
          <ListItemTitle truncate>
            <ListItemTitleButton
              onClick={onOpen}
              className="max-w-full"
            >
              {event.title}
            </ListItemTitleButton>
          </ListItemTitle>
        }
        main={
          <ListItemDescription className="line-clamp-2">
            {event.description || messages.noDescription}
          </ListItemDescription>
        }
      />
      <EventRowMeta
        event={event}
        timeMessages={timeMessages}
        timeFormatPreference={timeFormatPreference}
      />
    </ListItem>
  );
}

function EventRowMeta({
  event,
  timeMessages,
  timeFormatPreference,
}: {
  event: ScheduledEvent;
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return (
    <div className="grid min-w-20 max-w-32 shrink-0 justify-items-end gap-1 text-right">
      <ListItemSupportingText className="whitespace-nowrap">
        {formatTimeDisplay(
          event.eventTime,
          timeMessages,
          timeFormatPreference,
        ) || event.eventTime}
      </ListItemSupportingText>
      {event.location ? (
        <ListItemSupportingText className="block max-w-full truncate">
          {event.location}
        </ListItemSupportingText>
      ) : null}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
      {text}
    </p>
  );
}
