import { CheckboxControl } from "@/components/forms/selection-field";
import { ListItem } from "@/components/list";
import { DescriptionText, SupportingText } from "@/components/text";
import type { Routine, RoutineStatus } from "@/features/dashboard/types";

export function RoutineCard({
  routine,
  darkMode,
  disabled,
  onStatusChange,
}: {
  routine: Routine;
  darkMode: boolean;
  disabled: boolean;
  onStatusChange: (status: RoutineStatus) => void;
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
    </ListItem>
  );
}
