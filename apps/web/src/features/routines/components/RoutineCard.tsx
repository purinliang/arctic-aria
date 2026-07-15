import { ChevronDown } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { ExpandableListItem } from "@/components/list";
import { Tag } from "@/components/tag";
import type { Routine, RoutineStatus } from "@/features/dashboard/types";

export function RoutineCard({
  routine,
  darkMode,
  disabled,
  expanded,
  onToggleExpanded,
  onStatusChange,
  onBusy,
}: {
  routine: Routine;
  darkMode: boolean;
  disabled: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: RoutineStatus) => void;
  onBusy: () => void;
}) {
  return (
    <ExpandableListItem
      darkMode={darkMode}
      expanded={expanded}
      disabled={disabled}
      bodyClassName="flex flex-wrap gap-2"
      onToggle={onToggleExpanded}
      header={
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-sm font-semibold">{routine.title}</h3>
            </div>
            <div
              className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${mutedTextClass(darkMode)}`}
            >
              <span>{routine.scheduledTime}</span>
              <span>{routine.streakText}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Tag darkMode={darkMode} tone={routineStatusTone(routine.status)}>
              {routine.status}
            </Tag>
            {routine.reminderState !== "idle" ? (
              <Tag darkMode={darkMode}>{routine.reminderState}</Tag>
            ) : null}
            <ChevronDown
              className={`transition ${expanded ? "rotate-180" : ""}`}
              size={18}
              aria-hidden="true"
            />
          </div>
        </>
      }
    >
      <Button
        darkMode={darkMode}
        className="basis-[88px] px-2"
        disabled={disabled}
        onClick={() => onStatusChange("completed")}
      >
        Done
      </Button>
      <Button
        darkMode={darkMode}
        className="basis-[88px] px-2"
        disabled={disabled}
        onClick={onBusy}
      >
        Busy
      </Button>
      <Button
        darkMode={darkMode}
        className="basis-[88px] px-2"
        disabled={disabled}
        onClick={() => onStatusChange("skipped")}
      >
        Skip
      </Button>
    </ExpandableListItem>
  );
}

function routineStatusTone(status: RoutineStatus) {
  if (status === "completed") {
    return "emerald";
  }

  if (status === "skipped") {
    return "neutral";
  }

  return "blue";
}
