// Routines Page - Routines List.
import { Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { DescriptionText, SupportingText } from "@/components/text";
import type { RoutineDefinition } from "@/features/dashboard/types";
import { ruleSummary } from "./routine-page-helpers";

export function RoutinesList({
  darkMode,
  loading,
  pending,
  routines,
  onEdit,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  routines: RoutineDefinition[];
  onEdit: (routine: RoutineDefinition) => void;
}) {
  return (
    <List darkMode={darkMode}>
      {loading ? (
        <LoadingLine darkMode={darkMode} text="Loading routines..." />
      ) : null}
      {!loading && routines.length === 0 ? (
        <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
          No routines yet.
        </p>
      ) : null}
      {routines.map((routine) => (
        <ListItem key={routine.id} darkMode={darkMode}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{routine.title}</h3>
            </div>
            <DescriptionText darkMode={darkMode} className="mt-1">
              {routine.description || "No description."}
            </DescriptionText>
            <SupportingText darkMode={darkMode} className="mt-2 block">
              {routine.preferredTime ?? "Flexible"} · {ruleSummary(routine)}
            </SupportingText>
          </div>
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={() => onEdit(routine)}
          >
            Edit
          </Button>
        </ListItem>
      ))}
    </List>
  );
}
