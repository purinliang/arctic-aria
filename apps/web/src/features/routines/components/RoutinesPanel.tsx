// Dashboard - Routines Panel.
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { dividerClass, mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
import { ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { Routine, RoutineStatus } from "@/features/dashboard/types";

export function RoutinesPanel({
  darkMode,
  routines,
  loading,
  disabled,
  message,
  onRoutineStatus,
  onRoutineOpen,
}: {
  darkMode: boolean;
  routines: Routine[];
  loading: boolean;
  disabled: boolean;
  message: string | null;
  onRoutineStatus: (routineId: string, status: RoutineStatus) => void;
  onRoutineOpen: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<Bell size={18} aria-hidden="true" />}
        title="Routines"
        meta={`${routines.length} scheduled`}
        darkMode={darkMode}
      />
      <RoutinesPanelMessage darkMode={darkMode} message={message} />
      <div className={dividerClass(darkMode)}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text="Loading routines..." />
        ) : null}
        {!loading && routines.length === 0 ? (
          <EmptyLine darkMode={darkMode} text="No routines due today." />
        ) : null}
        {routines.map((routine) => (
          <RoutineRow
            key={routine.id}
            routine={routine}
            darkMode={darkMode}
            disabled={disabled}
            onStatusChange={(status) => onRoutineStatus(routine.id, status)}
            onOpen={onRoutineOpen}
          />
        ))}
      </div>
    </Panel>
  );
}

// Dashboard - Routines Panel - Routine row.
function RoutineRow({
  routine,
  darkMode,
  disabled,
  onStatusChange,
  onOpen,
}: {
  routine: Routine;
  darkMode: boolean;
  disabled: boolean;
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
          disabled={disabled}
          aria-label={
            routine.status === "completed"
              ? `Reopen ${routine.title}`
              : `Mark ${routine.title} done`
          }
          onChange={(event) =>
            onStatusChange(event.target.checked ? "completed" : "pending")
          }
        />
        <div className="min-w-0">
          <h3 className="min-w-0 text-sm font-semibold">{routine.title}</h3>
          <DescriptionText darkMode={darkMode} className="mt-1">
            {routine.description || "No description."}
          </DescriptionText>
          <SupportingText darkMode={darkMode} className="mt-2 block">
            {routine.scheduledTime} · {routine.streakText}
          </SupportingText>
        </div>
      </div>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon-sm"
        aria-label="Open routines"
        icon={<ChevronRight size={16} aria-hidden="true" />}
        onClick={onOpen}
      />
    </ListItem>
  );
}

function RoutinesPanelMessage({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`border-b px-4 py-3 text-xs font-semibold ${
        darkMode
          ? "border-neutral-900 text-amber-200"
          : "border-slate-200 text-amber-700"
      }`}
    >
      {message}
    </div>
  );
}

function EmptyLine({ darkMode, text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
