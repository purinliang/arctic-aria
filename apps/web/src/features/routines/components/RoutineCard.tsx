import { ChevronDown } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
import { ExpandableListItem } from "@/components/list";
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
      leading={
        <CheckboxControl
          darkMode={darkMode}
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
      }
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
