// Routines Page.
import { Bell, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
import type {
  Routine,
  RoutineDefinition,
  RoutineGroupOption,
  RoutineStatus,
} from "@/features/dashboard/types";
import {
  filterInstancesByDate,
  type InstanceDateFilter,
} from "@/features/instance-date-filters";
import type {
  RoutineGroupInput,
  RoutineInput,
  RoutineTemplateParseData,
} from "@/features/routines/actions";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";
import { RoutineEditorDialog } from "./RoutineEditorDialog";
import { RoutineFiltersPanel } from "./RoutineFiltersPanel";
import { RoutineGroupManagerDialog } from "./RoutineGroupManagerDialog";
import { RoutineGroupsPanel } from "./RoutineGroupsPanel";
import { RoutineInstancesList } from "./RoutineInstancesList";
import { RoutinesList } from "./RoutinesList";
import { RoutineTemplateEditorDialog } from "./RoutineTemplateEditorDialog";
import { localScheduledDateKey } from "@/features/settings/time-zones";
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
type RoutineTemplateTarget =
  | {
      mode: "create";
      draft: RoutineInput;
    }
  | {
      mode: "update";
      routineId: string;
    };
const emptyGroupDraft: RoutineGroupInput = {
  name: "",
  description: "",
};

export function RoutinesPage({
  darkMode,
  routines,
  routineInstances,
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
  onRoutineInstanceStatus,
  onRoutineTemplateParse,
  onRoutineTemplateApply,
  onRoutineGroupSave,
  onRoutineGroupDelete,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  routines: RoutineDefinition[];
  routineInstances: Routine[];
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
  onRoutineInstanceStatus: (
    instanceId: string,
    status: RoutineStatus,
  ) => RoutineResult;
  onRoutineTemplateParse: (
    routineId: string | null,
    source: string,
  ) => Promise<RoutineTemplateParseData | null>;
  onRoutineTemplateApply: (
    routineId: string | null,
    source: string,
  ) => RoutineResult;
  onRoutineGroupSave: (input: RoutineGroupInput) => RoutineGroupResult;
  onRoutineGroupDelete: (groupId: string) => RoutineGroupResult;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const sortedGroups = useMemo(
    () => sortRoutineGroups(routineGroups),
    [routineGroups],
  );
  const [groupFilter, setGroupFilter] = useState<RoutineGroupFilter>("All");
  const [instanceFilter, setInstanceFilter] =
    useState<InstanceDateFilter>("recent");
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
  const [templateTarget, setTemplateTarget] =
    useState<RoutineTemplateTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const activeGroupFilter =
    groupFilter === "All" ||
    groupFilter === "none" ||
    sortedGroups.some((group) => group.id === groupFilter)
      ? groupFilter
      : "All";
  const visibleRoutines = filterRoutinesByGroup(routines, activeGroupFilter);
  const referenceDate = localScheduledDateKey({
    date: new Date(),
    timeZone: resolvedTimeZone,
  });
  const visibleRoutineInstances = filterInstancesByDate(
    routineInstances,
    instanceFilter,
    referenceDate,
  );
  const templateRoutine =
    templateTarget?.mode === "update"
      ? routines.find((routine) => routine.id === templateTarget.routineId) ??
        null
      : null;

  function selectedGroupId() {
    return sortedGroups.some((group) => group.id === activeGroupFilter)
      ? activeGroupFilter
      : null;
  }

  function closeEditor() {
    if (!pending && dialogAction === null) {
      setEditorOpen(false);
      setTemplateTarget(null);
      setDraft(emptyDraft(resolvedTimeZone));
    }
  }

  function closeRoutineTemplate() {
    if (!pending && dialogAction === null) {
      setTemplateTarget(null);
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

  function openRoutineDeleteConfirmation() {
    if (!draft.id) {
      return;
    }

    setConfirmationTarget({
      type: "routine",
      id: draft.id,
      title: draft.title || messages.confirm.fallback,
    });
  }

  async function applyRoutineTemplate(routineId: string | null, source: string) {
    const applied = await onRoutineTemplateApply(routineId, source);

    if (applied) {
      setTemplateTarget(null);
      setEditorOpen(false);
      setDraft(emptyDraft(resolvedTimeZone));
    }

    return applied;
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

            <Panel darkMode={darkMode}>
              <CardHeader
                darkMode={darkMode}
                icon={<Bell size={18} aria-hidden="true" />}
                title={messages.instances.title}
                description={messages.instances.description}
              />
              <RoutineInstancesList
                darkMode={darkMode}
                instances={visibleRoutineInstances}
                loading={loading}
                pending={pending}
                messages={messages}
                formMessages={formMessages}
                timeFormatPreference={timeFormatPreference}
                onStatusChange={(instanceId, status) => {
                  void onRoutineInstanceStatus(instanceId, status);
                }}
              />
            </Panel>
          </div>

          <aside className="grid content-start gap-4">
            <RoutineFiltersPanel
              darkMode={darkMode}
              disabled={pending}
              filter={instanceFilter}
              messages={messages.filters}
              onFilterChange={setInstanceFilter}
            />
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
          onDelete={draft.id ? openRoutineDeleteConfirmation : undefined}
          onTemplate={() =>
            setTemplateTarget(
              draft.id
                ? { mode: "update", routineId: draft.id }
                : { mode: "create", draft },
            )
          }
        />
      ) : null}

      {templateTarget && (templateTarget.mode === "create" || templateRoutine) ? (
        <RoutineTemplateEditorDialog
          key={
            templateTarget.mode === "update"
              ? templateTarget.routineId
              : "create"
          }
          darkMode={darkMode}
          pending={pending}
          mode={templateTarget.mode}
          routine={templateTarget.mode === "update" ? templateRoutine : null}
          draft={templateTarget.mode === "create" ? templateTarget.draft : null}
          groups={sortedGroups}
          messages={messages.editor.template}
          showErrorNotification={showErrorNotification}
          showSuccessNotification={showSuccessNotification}
          onClose={closeRoutineTemplate}
          onParse={onRoutineTemplateParse}
          onApply={applyRoutineTemplate}
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
