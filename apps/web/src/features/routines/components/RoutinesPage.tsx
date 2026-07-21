// Routines Page.
import { Bell, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
import type {
  RoutineDefinition,
  RoutineGroupOption,
} from "@/features/dashboard/types";
import type {
  RoutineGroupInput,
  RoutineInput,
} from "@/features/routines/actions";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";
import { RoutineEditorDialog } from "./RoutineEditorDialog";
import { RoutineGroupManagerDialog } from "./RoutineGroupManagerDialog";
import { RoutineGroupsPanel } from "./RoutineGroupsPanel";
import { RoutinesList } from "./RoutinesList";
import {
  emptyDraft,
  filterRoutinesByGroup,
  sortRoutineGroups,
  toDraft,
  type RoutineGroupFilter,
} from "./routine-page-helpers";

type RoutineResult = Promise<boolean>;
type RoutineGroupResult = Promise<boolean>;
type ConfirmationTarget = {
  type: "routine" | "group";
  id: string;
  title: string;
};
type DialogAction = "save" | "delete" | null;
const emptyGroupDraft: RoutineGroupInput = {
  name: "",
  description: "",
};

export function RoutinesPage({
  darkMode,
  routines,
  routineGroups,
  loading,
  pending,
  messages,
  formMessages,
  timeFormatPreference,
  multipleTimezonesEnabled,
  resolvedTimeZone,
  onRoutineSave,
  onRoutineDelete,
  onRoutineGroupSave,
  onRoutineGroupDelete,
}: {
  darkMode: boolean;
  routines: RoutineDefinition[];
  routineGroups: RoutineGroupOption[];
  loading: boolean;
  pending: boolean;
  messages: RoutineMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  multipleTimezonesEnabled: boolean;
  resolvedTimeZone: string;
  onRoutineSave: (input: RoutineInput) => RoutineResult;
  onRoutineDelete: (routineId: string) => RoutineResult;
  onRoutineGroupSave: (input: RoutineGroupInput) => RoutineGroupResult;
  onRoutineGroupDelete: (groupId: string) => RoutineGroupResult;
}) {
  const sortedGroups = useMemo(
    () => sortRoutineGroups(routineGroups),
    [routineGroups],
  );
  const [groupFilter, setGroupFilter] = useState<RoutineGroupFilter>("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<RoutineInput>(() =>
    emptyDraft(resolvedTimeZone),
  );
  const [groupManagerOpen, setGroupManagerOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [groupDraft, setGroupDraft] =
    useState<RoutineGroupInput>(emptyGroupDraft);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const activeGroupFilter =
    groupFilter === "All" ||
    groupFilter === "none" ||
    sortedGroups.some((group) => group.id === groupFilter)
      ? groupFilter
      : "All";
  const visibleRoutines = filterRoutinesByGroup(routines, activeGroupFilter);

  function selectedGroupId() {
    return sortedGroups.some((group) => group.id === activeGroupFilter)
      ? activeGroupFilter
      : null;
  }

  function closeEditor() {
    if (!pending && dialogAction === null) {
      setEditorOpen(false);
      setDraft(emptyDraft(resolvedTimeZone));
    }
  }

  function openNewEditor() {
    setDraft(emptyDraft(resolvedTimeZone, new Date(), selectedGroupId()));
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
        setDraft(emptyDraft(resolvedTimeZone));
      }
    } finally {
      setDialogAction(null);
    }
  }

  function closeGroupManager() {
    if (!pending && dialogAction === null) {
      setGroupManagerOpen(false);
      setGroupFormOpen(false);
      setGroupDraft(emptyGroupDraft);
    }
  }

  function closeGroupForm() {
    if (!pending && dialogAction === null) {
      setGroupFormOpen(false);
      setGroupDraft(emptyGroupDraft);
    }
  }

  function openNewGroupEditor() {
    setGroupDraft(emptyGroupDraft);
    setGroupFormOpen(true);
  }

  function openGroupEditor(group: RoutineGroupOption) {
    setGroupDraft({
      id: group.id,
      name: group.name,
      description: group.description ?? "",
    });
    setGroupFormOpen(true);
  }

  async function submitGroup() {
    setDialogAction("save");

    try {
      const saved = await onRoutineGroupSave(groupDraft);

      if (saved) {
        setGroupDraft(emptyGroupDraft);
        setGroupFormOpen(false);
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
      const deleted =
        confirmationTarget.type === "routine"
          ? await onRoutineDelete(confirmationTarget.id)
          : await onRoutineGroupDelete(confirmationTarget.id);

      if (deleted) {
        setConfirmationTarget(null);
        if (confirmationTarget.type === "routine") {
          setEditorOpen(false);
          setDraft(emptyDraft(resolvedTimeZone));
        } else {
          setGroupFilter((current) =>
            current === confirmationTarget.id ? "All" : current,
          );
          setGroupFormOpen(false);
          setGroupDraft(emptyGroupDraft);
        }
      }
    } finally {
      setDialogAction(null);
    }
  }

  return (
    <>
      <section className="aa-split-container">
        <div className="aa-split-panel gap-4">
          <div className="grid min-w-0 content-start gap-4">
            <Panel darkMode={darkMode}>
              <RoutinesPageHeader
                darkMode={darkMode}
                pending={pending}
                messages={messages.page}
                onAdd={openNewEditor}
              />
              <RoutinesList
                darkMode={darkMode}
                routines={visibleRoutines}
                loading={loading}
                pending={pending}
                messages={messages.page}
                groupMessages={messages.groups}
                ruleMessages={messages}
                timeMessages={formMessages.timePicker}
                timeFormatPreference={timeFormatPreference}
                onEdit={openEditor}
              />
            </Panel>
          </div>

          <aside className="grid content-start gap-4">
            <RoutineGroupsPanel
              darkMode={darkMode}
              filter={activeGroupFilter}
              groups={sortedGroups}
              pending={pending}
              messages={messages.groups}
              onFilterChange={setGroupFilter}
              onManage={() => setGroupManagerOpen(true)}
            />
          </aside>
        </div>
      </section>

      {editorOpen ? (
        <RoutineEditorDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          draft={draft}
          groups={sortedGroups}
          setDraft={setDraft}
          messages={messages}
          formMessages={formMessages}
          timeFormatPreference={timeFormatPreference}
          multipleTimezonesEnabled={multipleTimezonesEnabled}
          resolvedTimeZone={resolvedTimeZone}
          onClose={closeEditor}
          onSubmit={() => void submitRoutine()}
          onDelete={() =>
            draft.id
              ? setConfirmationTarget({
                  type: "routine",
                  id: draft.id,
                  title: draft.title || messages.confirm.fallback,
                })
              : undefined
          }
        />
      ) : null}

      {groupManagerOpen ? (
        <RoutineGroupManagerDialog
          darkMode={darkMode}
          pending={pending || dialogAction !== null}
          saving={dialogAction === "save"}
          groups={sortedGroups}
          groupDraft={groupDraft}
          groupFormOpen={groupFormOpen}
          messages={messages.groups}
          setGroupDraft={setGroupDraft}
          onCloseEditor={closeGroupManager}
          onCloseForm={closeGroupForm}
          onOpenNew={openNewGroupEditor}
          onOpenEdit={openGroupEditor}
          onSubmit={() => void submitGroup()}
          onDelete={(group) =>
            setConfirmationTarget({
              type: "group",
              id: group.id,
              title: group.name || messages.groups.confirmFallback,
            })
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending || dialogAction === "delete"}
          title={
            confirmationTarget.type === "routine"
              ? messages.confirm.title
              : messages.groups.confirmTitle
          }
          description={
            confirmationTarget.type === "routine"
              ? messages.confirm.description(confirmationTarget.title)
              : messages.groups.confirmDescription(confirmationTarget.title)
          }
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
