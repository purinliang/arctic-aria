// Projects Page.
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ConfirmDialog } from "@/components/dialog";
import type { TaskStatus } from "@/features/dashboard/types";
import type {
  MilestoneInput,
  ProjectInput,
  ProjectTaskInput,
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { FormMessages, ProjectMessages } from "@/messages/app-messages";
import { ProjectDetailPage } from "./ProjectDetailPage";
import {
  MilestoneEditorDialog,
  ProjectEditorDialog,
} from "./ProjectEditorDialog";
import { ProjectsList } from "./ProjectsList";
import { ProjectTaskEditorDialog } from "./ProjectTaskEditorDialog";
import {
  emptyMilestoneDraft,
  emptyProjectDraft,
  emptyTaskDraft,
  milestoneToDraft,
  taskToDraft,
} from "./project-page-helpers";

type ProjectResult = Promise<boolean>;
type ConfirmationTarget = {
  type: "project" | "milestone" | "task";
  id: string;
  title: string;
};
type DialogEntityType = ConfirmationTarget["type"];
type DialogAction = {
  type: DialogEntityType;
  action: "save" | "delete";
} | null;

export function ProjectsPage({
  darkMode,
  projects,
  loading,
  pending,
  projectDraft,
  setProjectDraft,
  selectedProjectId,
  pendingProjectPinIds,
  onProjectSave,
  onProjectDelete,
  onProjectPin,
  onProjectUnpin,
  onMilestoneSave,
  onMilestoneDelete,
  onTaskSave,
  onTaskDelete,
  onTaskStatus,
  onProjectSelect,
  messages,
  formMessages,
}: {
  darkMode: boolean;
  projects: ProjectView[];
  loading: boolean;
  pending: boolean;
  projectDraft: ProjectInput | null;
  setProjectDraft: Dispatch<SetStateAction<ProjectInput | null>>;
  selectedProjectId: string | null;
  pendingProjectPinIds: string[];
  onProjectSave: (input: ProjectInput) => ProjectResult;
  onProjectDelete: (projectId: string) => ProjectResult;
  onProjectPin: (projectId: string) => void;
  onProjectUnpin: (projectId: string) => void;
  onMilestoneSave: (input: MilestoneInput) => ProjectResult;
  onMilestoneDelete: (milestoneId: string) => ProjectResult;
  onTaskSave: (input: ProjectTaskInput) => ProjectResult;
  onTaskDelete: (taskId: string) => ProjectResult;
  onTaskStatus: (
    taskId: string,
    status: TaskStatus,
  ) => void;
  onProjectSelect: (projectId: string | null) => void;
  messages: ProjectMessages;
  formMessages: FormMessages;
}) {
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneInput | null>(
    null,
  );
  const [taskDraft, setTaskDraft] = useState<ProjectTaskInput | null>(null);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const selectedProject = useMemo(
    () =>
      selectedProjectId
        ? projects.find((project) => project.id === selectedProjectId) ?? null
        : null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (selectedProjectId && !loading && !selectedProject) {
      onProjectSelect(null);
    }
  }, [loading, onProjectSelect, selectedProject, selectedProjectId]);

  function closeDialogs() {
    if (!pending && dialogAction === null) {
      setProjectDraft(null);
      setMilestoneDraft(null);
      setTaskDraft(null);
      setConfirmationTarget(null);
    }
  }

  function updateProjectDraft(next: SetStateAction<ProjectInput>) {
    setProjectDraft((current) =>
      typeof next === "function"
        ? next(current ?? emptyProjectDraft())
        : next,
    );
  }

  function updateMilestoneDraft(next: SetStateAction<MilestoneInput>) {
    setMilestoneDraft((current) =>
      typeof next === "function"
        ? next(current ?? emptyMilestoneDraft(selectedProject?.id ?? ""))
        : next,
    );
  }

  function updateTaskDraft(next: SetStateAction<ProjectTaskInput>) {
    setTaskDraft((current) =>
      typeof next === "function"
        ? next(current ?? emptyTaskDraft(selectedProject?.id ?? ""))
        : next,
    );
  }

  async function submitProject() {
    if (!projectDraft) {
      return;
    }

    setDialogAction({ type: "project", action: "save" });

    try {
      const saved = await onProjectSave(projectDraft);

      if (saved) {
        setProjectDraft(null);
      }
    } finally {
      setDialogAction(null);
    }
  }

  async function submitMilestone() {
    if (!milestoneDraft) {
      return;
    }

    setDialogAction({ type: "milestone", action: "save" });

    try {
      const saved = await onMilestoneSave(milestoneDraft);

      if (saved) {
        setMilestoneDraft(null);
      }
    } finally {
      setDialogAction(null);
    }
  }

  async function submitTask() {
    if (!taskDraft) {
      return;
    }

    setDialogAction({ type: "task", action: "save" });

    try {
      const saved = await onTaskSave(taskDraft);

      if (saved) {
        setTaskDraft(null);
      }
    } finally {
      setDialogAction(null);
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    setDialogAction({ type: confirmationTarget.type, action: "delete" });

    try {
      const deleted =
        confirmationTarget.type === "project"
          ? await onProjectDelete(confirmationTarget.id)
          : confirmationTarget.type === "milestone"
            ? await onMilestoneDelete(confirmationTarget.id)
            : await onTaskDelete(confirmationTarget.id);

      if (!deleted) {
        return;
      }

      if (confirmationTarget.type === "project") {
        onProjectSelect(null);
        setProjectDraft(null);
      }

      if (confirmationTarget.type === "milestone") {
        setMilestoneDraft(null);
      }

      if (confirmationTarget.type === "task") {
        setTaskDraft(null);
      }

      setConfirmationTarget(null);
    } finally {
      setDialogAction(null);
    }
  }

  function hasDialogAction(type: DialogEntityType) {
    return dialogAction?.type === type;
  }

  function isSaving(type: DialogEntityType) {
    return dialogAction?.type === type && dialogAction.action === "save";
  }

  return (
    <>
      <div className="grid gap-3">
        {selectedProject ? (
          <ProjectDetailPage
            darkMode={darkMode}
            pending={pending}
            project={selectedProject}
            messages={messages.detail}
            timelineMessages={messages.timeline}
            durationMessages={messages.duration}
            defaultDescriptions={messages.defaultDescriptions}
            dateMessages={formMessages.datePicker}
            onAddMilestone={(projectId) => {
              setMilestoneDraft(emptyMilestoneDraft(projectId));
            }}
            onEditMilestone={(milestone) => {
              setMilestoneDraft(milestoneToDraft(milestone));
            }}
            onAddTask={(projectId, milestoneId) => {
              setTaskDraft(emptyTaskDraft(projectId, milestoneId));
            }}
            onEditTask={(task: ProjectTaskView) => {
              setTaskDraft(taskToDraft(task));
            }}
            onTaskStatus={onTaskStatus}
          />
        ) : (
          <ProjectsList
            darkMode={darkMode}
            loading={loading}
            pending={pending}
            projects={projects}
            pendingProjectPinIds={pendingProjectPinIds}
            messages={messages.list}
            timelineMessages={messages.timeline}
            durationMessages={messages.duration}
            defaultDescriptions={messages.defaultDescriptions}
            dateMessages={formMessages.datePicker}
            onViewProject={(projectId) => onProjectSelect(projectId)}
            onPinProject={onProjectPin}
            onUnpinProject={onProjectUnpin}
            onAddProject={() => {
              setProjectDraft(emptyProjectDraft());
            }}
          />
        )}
      </div>

      {projectDraft ? (
        <ProjectEditorDialog
          darkMode={darkMode}
          pending={pending || hasDialogAction("project")}
          saving={isSaving("project")}
          draft={projectDraft}
          setDraft={updateProjectDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitProject()}
          messages={messages.editor}
          durationMessages={messages.duration}
          defaultDescriptions={messages.defaultDescriptions}
          formMessages={formMessages}
          onDelete={
            projectDraft.id
              ? () =>
                  setConfirmationTarget({
                    type: "project",
                    id: projectDraft.id ?? "",
                    title: projectDraft.title || messages.confirm.fallbackProject,
                  })
              : undefined
          }
        />
      ) : null}

      {milestoneDraft ? (
        <MilestoneEditorDialog
          darkMode={darkMode}
          pending={pending || hasDialogAction("milestone")}
          saving={isSaving("milestone")}
          draft={milestoneDraft}
          setDraft={updateMilestoneDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitMilestone()}
          messages={messages.editor}
          durationMessages={messages.duration}
          defaultDescriptions={messages.defaultDescriptions}
          formMessages={formMessages}
          onDelete={
            milestoneDraft.id
              ? () =>
                  setConfirmationTarget({
                    type: "milestone",
                    id: milestoneDraft.id ?? "",
                    title:
                      milestoneDraft.title || messages.confirm.fallbackMilestone,
                  })
              : undefined
          }
        />
      ) : null}

      {taskDraft ? (
        <ProjectTaskEditorDialog
          darkMode={darkMode}
          pending={pending || hasDialogAction("task")}
          saving={isSaving("task")}
          draft={taskDraft}
          milestones={selectedProject?.milestones ?? []}
          setDraft={updateTaskDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitTask()}
          messages={messages.editor}
          defaultDescriptions={messages.defaultDescriptions}
          formMessages={formMessages}
          onDelete={
            taskDraft.id
              ? () =>
                  setConfirmationTarget({
                    type: "task",
                    id: taskDraft.id ?? "",
                    title: taskDraft.title || messages.confirm.fallbackTask,
                  })
              : undefined
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending || dialogAction?.action === "delete"}
          title={confirmTitle(confirmationTarget.type, messages)}
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

function confirmTitle(
  type: ConfirmationTarget["type"],
  messages: ProjectMessages,
) {
  if (type === "project") {
    return messages.confirm.projectTitle;
  }

  if (type === "milestone") {
    return messages.confirm.milestoneTitle;
  }

  return messages.confirm.taskTitle;
}
