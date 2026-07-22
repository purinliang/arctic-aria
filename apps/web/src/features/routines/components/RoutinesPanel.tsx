// Dashboard - Routines Panel.
import { Bell } from "lucide-react";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { CheckboxControl } from "@/components/forms/selection-field";
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
import { formatTimeDisplay } from "@/components/forms/time-display";
import { todayPanelItemLimit } from "@/features/dashboard/today-panel-display";
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
  const visibleRoutines = routines.slice(0, todayPanelItemLimit);
  const hasMoreRoutines = routines.length > visibleRoutines.length;

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
        {visibleRoutines.map((routine) => (
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
        {!loading && hasMoreRoutines ? (
          <ListFooterAction
            darkMode={darkMode}
            label={messages.open}
            onClick={onRoutineOpen}
          />
        ) : null}
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
      <div className="grid min-w-0 w-full flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
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
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <ListItemTitle truncate>
                <ListItemTitleButton onClick={onOpen}>
                  {routine.title}
                </ListItemTitleButton>
              </ListItemTitle>
              <ListItemSupportingText className="whitespace-nowrap">
                {routineTimeText(
                  routine,
                  messages,
                  timeMessages,
                  timeFormatPreference,
                )}
              </ListItemSupportingText>
            </div>
          }
          main={
            <ListItemDescription className="line-clamp-2">
              {displayDescription(
                routine.description,
                routine.title,
                messages.defaultDescriptions,
              )}
            </ListItemDescription>
          }
        />
      </div>
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
