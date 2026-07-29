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
  ProjectTreeTemplateParseData,
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { FormMessages, ProjectMessages } from "@/messages/app-messages";
import { ProjectDetailPage } from "./ProjectDetailPage";
import {
  MilestoneEditorDialog,
  ProjectEditorDialog,
} from "./ProjectEditorDialog";
import { ProjectMilestoneManagerDialog } from "./ProjectMilestoneManagerDialog";
import { ProjectsList } from "./ProjectsList";
import { ProjectTaskEditorDialog } from "./ProjectTaskEditorDialog";
import { ProjectTreeTemplateDialog } from "./ProjectTreeTemplateDialog";
import {
  emptyMilestoneDraft,
  emptyProjectDraft,
  emptyTaskDraft,
  milestoneToDraft,
  projectToDraft,
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
  selectedMilestoneId,
  pendingProjectPinIds,
  onProjectSave,
  onProjectDelete,
  onProjectTemplateParse,
  onProjectTemplateApply,
  onProjectPin,
  onProjectUnpin,
  onMilestoneSave,
  onMilestoneDelete,
  onTaskSave,
  onTaskDelete,
  onTaskStatus,
  onProjectSelect,
  onMilestoneSelect,
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
  selectedMilestoneId: string | null;
  pendingProjectPinIds: string[];
  onProjectSave: (input: ProjectInput) => ProjectResult;
  onProjectDelete: (projectId: string) => ProjectResult;
  onProjectTemplateParse: (
    projectId: string,
    source: string,
  ) => Promise<ProjectTreeTemplateParseData | null>;
  onProjectTemplateApply: (projectId: string, source: string) => ProjectResult;
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
  onMilestoneSelect: (milestoneId: string | null) => void;
  messages: ProjectMessages;
  formMessages: FormMessages;
}) {
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneInput | null>(
    null,
  );
  const [milestoneManagerProjectId, setMilestoneManagerProjectId] = useState<
    string | null
  >(null);
  const [taskDraft, setTaskDraft] = useState<ProjectTaskInput | null>(null);
  const [templateProjectId, setTemplateProjectId] = useState<string | null>(null);
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
  const milestoneManagerOpen = selectedProject
    ? milestoneManagerProjectId === selectedProject.id
    : false;
  const templateProject = templateProjectId
    ? projects.find((project) => project.id === templateProjectId) ?? null
    : null;

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
      setTemplateProjectId(null);
      setConfirmationTarget(null);
    }
  }

  function closeMilestoneManager() {
    if (!pending && dialogAction === null) {
      setMilestoneManagerProjectId(null);
    }
  }

  function closeProjectTemplate() {
    if (!pending && dialogAction === null) {
      setTemplateProjectId(null);
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

  async function applyProjectTemplate(projectId: string, source: string) {
    const applied = await onProjectTemplateApply(projectId, source);

    if (applied) {
      setTemplateProjectId(null);
      setProjectDraft(null);
    }

    return applied;
  }

  function hasDialogAction(type: DialogEntityType) {
    return dialogAction?.type === type;
  }

  function isSaving(type: DialogEntityType) {
    return dialogAction?.type === type && dialogAction.action === "save";
  }

  return (
    <>
      <div className="grid min-w-0 gap-3">
        {selectedProject ? (
          <ProjectDetailPage
            darkMode={darkMode}
            pending={pending}
            project={selectedProject}
            selectedMilestoneId={selectedMilestoneId}
            messages={messages.detail}
            timelineMessages={messages.timeline}
            durationMessages={messages.duration}
            defaultDescriptions={messages.defaultDescriptions}
            dateMessages={formMessages.datePicker}
            onEditProject={(project) => {
              setProjectDraft(projectToDraft(project));
            }}
            onEditMilestone={(milestone) => {
              setMilestoneDraft(milestoneToDraft(milestone));
            }}
            onSelectMilestone={onMilestoneSelect}
            onManageMilestones={() =>
              setMilestoneManagerProjectId(selectedProject.id)
            }
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

      {selectedProject && milestoneManagerOpen ? (
        <ProjectMilestoneManagerDialog
          darkMode={darkMode}
          pending={pending}
          milestones={selectedProject.milestones}
          messages={messages.detail}
          timelineMessages={messages.timeline}
          durationMessages={messages.duration}
          defaultDescriptions={messages.defaultDescriptions}
          dateMessages={formMessages.datePicker}
          onClose={closeMilestoneManager}
          onOpenNew={() => {
            setMilestoneDraft(emptyMilestoneDraft(selectedProject.id));
          }}
          onOpenEdit={(milestone) => {
            setMilestoneDraft(milestoneToDraft(milestone));
          }}
        />
      ) : null}

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
          onTemplate={
            projectDraft.id
              ? () => setTemplateProjectId(projectDraft.id ?? null)
              : undefined
          }
        />
      ) : null}

      {templateProject ? (
        <ProjectTreeTemplateDialog
          key={templateProject.id}
          darkMode={darkMode}
          pending={pending}
          project={templateProject}
          messages={messages.editor.template}
          onClose={closeProjectTemplate}
          onParse={onProjectTemplateParse}
          onApply={applyProjectTemplate}
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
          zIndex={milestoneManagerOpen ? "z-[60]" : undefined}
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
