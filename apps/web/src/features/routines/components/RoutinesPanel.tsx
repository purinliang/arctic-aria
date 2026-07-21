// Dashboard - Routines Panel.
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem, ListItemContent } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import { formatTimeDisplay } from "@/components/forms/time-display";
import type { Routine, RoutineStatus } from "@/features/dashboard/types";
import type { DashboardMessages } from "@/messages/app-messages";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { TimePickerMessages } from "@/messages/form-messages";

export function RoutinesPanel({
  darkMode,
  routines,
  loading,
  messages,
  timeMessages,
  timeFormatPreference,
  onRoutineStatus,
  onRoutineOpen,
}: {
  darkMode: boolean;
  routines: Routine[];
  loading: boolean;
  messages: DashboardMessages["routines"];
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
  onRoutineStatus: (routineId: string, status: RoutineStatus) => void;
  onRoutineOpen: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<Bell size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {!loading && routines.length === 0 ? (
          <EmptyLine darkMode={darkMode} text={messages.empty} />
        ) : null}
        {routines.map((routine) => (
          <RoutineRow
            key={routine.id}
            routine={routine}
            darkMode={darkMode}
            messages={messages}
            timeMessages={timeMessages}
            timeFormatPreference={timeFormatPreference}
            onStatusChange={(status) => onRoutineStatus(routine.id, status)}
            onOpen={onRoutineOpen}
          />
        ))}
      </List>
    </Panel>
  );
}

// Dashboard - Routines Panel - Routine row.
function RoutineRow({
  routine,
  darkMode,
  messages,
  timeMessages,
  timeFormatPreference,
  onStatusChange,
  onOpen,
}: {
  routine: Routine;
  darkMode: boolean;
  messages: DashboardMessages["routines"];
  timeMessages: TimePickerMessages;
  timeFormatPreference: TimeFormatPreference;
  onStatusChange: (status: RoutineStatus) => void;
  onOpen: () => void;
}) {
  return (
    <ListItem darkMode={darkMode} className="items-start">
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
        <CheckboxControl
          darkMode={darkMode}
          className="mt-1"
          checked={routine.status === "completed"}
          aria-label={
            routine.status === "completed"
              ? messages.reopen(routine.title)
              : messages.markDone(routine.title)
          }
          onChange={(event) =>
            onStatusChange(event.target.checked ? "completed" : "pending")
          }
        />
        <ListItemContent
          grow={false}
          title={
            <h3 className="min-w-0 text-sm font-semibold">{routine.title}</h3>
          }
          main={
            <DescriptionText darkMode={darkMode} className="line-clamp-4">
              {displayDescription(
                routine.description,
                routine.title,
                messages.defaultDescriptions,
              )}
            </DescriptionText>
          }
          support={
            <SupportingText darkMode={darkMode}>
              {routineTimeText(
                routine,
                messages,
                timeMessages,
                timeFormatPreference,
              )} ·{" "}
              {routine.status === "pending"
                ? messages.dueToday
                : messages.answeredToday}
            </SupportingText>
          }
        />
      </div>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon-sm"
        aria-label={messages.open}
        icon={<ChevronRight size={16} aria-hidden="true" />}
        onClick={onOpen}
      />
    </ListItem>
  );
}

function routineTimeText(
  routine: Routine,
  messages: DashboardMessages["routines"],
  timeMessages: TimePickerMessages,
  timeFormatPreference: TimeFormatPreference,
) {
  return routine.scheduledTime === "Flexible"
    ? messages.flexible
    : formatTimeDisplay(
        routine.scheduledTime,
        timeMessages,
        timeFormatPreference,
      ) || routine.scheduledTime;
}

function EmptyLine({ text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
      {text}
    </p>
  );
}
