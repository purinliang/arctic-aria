// Routines Page.
import { Bell, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
import type { RoutineDefinition } from "@/features/dashboard/types";
import type { RoutineInput } from "@/features/routines/actions";
import { RoutineEditorDialog } from "./RoutineEditorDialog";
import { RoutinesList } from "./RoutinesList";
import { emptyDraft, toDraft } from "./routine-page-helpers";

type RoutineResult = Promise<boolean>;
type ConfirmationTarget = {
  id: string;
  title: string;
};

export function RoutinesPage({
  darkMode,
  routines,
  loading,
  pending,
  message,
  onRoutineSave,
  onRoutineDelete,
  onMessageClear,
}: {
  darkMode: boolean;
  routines: RoutineDefinition[];
  loading: boolean;
  pending: boolean;
  message: string | null;
  onRoutineSave: (input: RoutineInput) => RoutineResult;
  onRoutineDelete: (routineId: string) => RoutineResult;
  onMessageClear: () => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<RoutineInput>(emptyDraft);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);

  function closeEditor() {
    if (!pending) {
      setEditorOpen(false);
      setDraft(emptyDraft());
      onMessageClear();
    }
  }

  function openNewEditor() {
    setDraft(emptyDraft());
    onMessageClear();
    setEditorOpen(true);
  }

  function openEditor(routine: RoutineDefinition) {
    setDraft(toDraft(routine));
    onMessageClear();
    setEditorOpen(true);
  }

  async function submitRoutine() {
    const saved = await onRoutineSave(draft);

    if (saved) {
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    const deleted = await onRoutineDelete(confirmationTarget.id);

    if (deleted) {
      setConfirmationTarget(null);
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

  return (
    <>
      <Panel darkMode={darkMode}>
        <RoutinesPageHeader
          darkMode={darkMode}
          pending={pending}
          onAdd={openNewEditor}
        />
        {message ? <RoutinesPageMessage darkMode={darkMode} message={message} /> : null}
        <RoutinesList
          darkMode={darkMode}
          routines={routines}
          loading={loading}
          pending={pending}
          onEdit={openEditor}
        />
      </Panel>

      {editorOpen ? (
        <RoutineEditorDialog
          darkMode={darkMode}
          pending={pending}
          message={message}
          draft={draft}
          setDraft={setDraft}
          onClose={closeEditor}
          onSubmit={() => void submitRoutine()}
          onDelete={() =>
            draft.id
              ? setConfirmationTarget({
                  id: draft.id,
                  title: draft.title || "this routine",
                })
              : undefined
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title="Delete routine"
          description={`Delete "${confirmationTarget.title}"? It will be removed from normal views.`}
          confirmIcon={<Trash2 size={14} aria-hidden="true" />}
          onCancel={() => {
            if (!pending) {
              setConfirmationTarget(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}

function RoutinesPageHeader({
  darkMode,
  pending,
  onAdd,
}: {
  darkMode: boolean;
  pending: boolean;
  onAdd: () => void;
}) {
  return (
    <CardHeader
      darkMode={darkMode}
      icon={<Bell size={18} aria-hidden="true" />}
      title="Routines"
      description="Repeatable checks for the current personal day."
      action={
        <Button
          darkMode={darkMode}
          disabled={pending}
          icon={<Plus size={15} aria-hidden="true" />}
          onClick={onAdd}
        >
          New
        </Button>
      }
    />
  );
}

function RoutinesPageMessage({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: string;
}) {
  return (
    <p
      className={`border-b px-4 py-3 text-sm ${
        darkMode
          ? "border-neutral-900 text-amber-200"
          : "border-slate-200 text-amber-700"
      }`}
    >
      {message}
    </p>
  );
}
