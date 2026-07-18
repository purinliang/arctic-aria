// Routines Page.
import { Bell, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
import type { RoutineDefinition } from "@/features/dashboard/types";
import type { RoutineInput } from "@/features/routines/actions";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";
import { RoutineEditorDialog } from "./RoutineEditorDialog";
import { RoutinesList } from "./RoutinesList";
import { emptyDraft, toDraft } from "./routine-page-helpers";

type RoutineResult = Promise<boolean>;
type ConfirmationTarget = {
  id: string;
  title: string;
};
type DialogAction = "save" | "delete" | null;

export function RoutinesPage({
  darkMode,
  routines,
  loading,
  pending,
  messages,
  formMessages,
  timeFormatPreference,
  onRoutineSave,
  onRoutineDelete,
}: {
  darkMode: boolean;
  routines: RoutineDefinition[];
  loading: boolean;
  pending: boolean;
  messages: RoutineMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  onRoutineSave: (input: RoutineInput) => RoutineResult;
  onRoutineDelete: (routineId: string) => RoutineResult;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<RoutineInput>(emptyDraft);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);

  function closeEditor() {
    if (!pending && dialogAction === null) {
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

  function openNewEditor() {
    setDraft(emptyDraft());
    setEditorOpen(true);
  }

  function openEditor(routine: RoutineDefinition) {
    setDraft(toDraft(routine));
    setEditorOpen(true);
  }

  async function submitRoutine() {
    setDialogAction("save");

    try {
      const saved = await onRoutineSave(draft);

      if (saved) {
        setEditorOpen(false);
        setDraft(emptyDraft());
      }
    } finally {
      setDialogAction(null);
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    setDialogAction("delete");

    try {
      const deleted = await onRoutineDelete(confirmationTarget.id);

      if (deleted) {
        setConfirmationTarget(null);
        setEditorOpen(false);
        setDraft(emptyDraft());
      }
    } finally {
      setDialogAction(null);
    }
  }

  return (
    <>
      <Panel darkMode={darkMode}>
        <RoutinesPageHeader
          darkMode={darkMode}
          pending={pending}
          messages={messages.page}
          onAdd={openNewEditor}
        />
        <RoutinesList
          darkMode={darkMode}
          routines={routines}
          loading={loading}
          pending={pending}
          messages={messages.page}
          ruleMessages={messages}
          timeMessages={formMessages.timePicker}
          timeFormatPreference={timeFormatPreference}
          onEdit={openEditor}
        />
      </Panel>

      {editorOpen ? (
        <RoutineEditorDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          draft={draft}
          setDraft={setDraft}
          messages={messages}
          formMessages={formMessages}
          timeFormatPreference={timeFormatPreference}
          onClose={closeEditor}
          onSubmit={() => void submitRoutine()}
          onDelete={() =>
            draft.id
              ? setConfirmationTarget({
                  id: draft.id,
                  title: draft.title || messages.confirm.fallback,
                })
              : undefined
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending || dialogAction === "delete"}
          title={messages.confirm.title}
          description={messages.confirm.description(confirmationTarget.title)}
          cancelText={messages.confirm.cancel}
          confirmText={messages.confirm.confirm}
          pendingConfirmText={messages.confirm.deleting}
          closeLabel={messages.confirm.close}
          confirmIcon={<Trash2 size={14} aria-hidden="true" />}
          onCancel={() => {
            if (!pending && dialogAction === null) {
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
  messages,
  onAdd,
}: {
  darkMode: boolean;
  pending: boolean;
  messages: RoutineMessages["page"];
  onAdd: () => void;
}) {
  return (
    <CardHeader
      darkMode={darkMode}
      icon={<Bell size={18} aria-hidden="true" />}
      title={messages.title}
      description={messages.description}
      action={
        <Button
          darkMode={darkMode}
          disabled={pending}
          icon={<Plus size={15} aria-hidden="true" />}
          onClick={onAdd}
        >
          {messages.new}
        </Button>
      }
    />
  );
}
