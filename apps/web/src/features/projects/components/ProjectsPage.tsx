// Projects Page.
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ConfirmDialog } from "@/components/dialog";
import { InlineMessage } from "@/components/text";
import type { TaskStatus } from "@/features/dashboard/types";
import type {
  MilestoneInput,
  ProjectInput,
  ProjectTaskInput,
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
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

export function ProjectsPage({
  darkMode,
  projects,
  loading,
  pending,
  projectDraft,
  setProjectDraft,
  message,
  selectedProjectId,
  onProjectSave,
  onProjectDelete,
  onMilestoneSave,
  onMilestoneDelete,
  onTaskSave,
  onTaskDelete,
  onTaskStatus,
  onProjectSelect,
  onMessageClear,
}: {
  darkMode: boolean;
  projects: ProjectView[];
  loading: boolean;
  pending: boolean;
  projectDraft: ProjectInput | null;
  setProjectDraft: Dispatch<SetStateAction<ProjectInput | null>>;
  message: string | null;
  selectedProjectId: string | null;
  onProjectSave: (input: ProjectInput) => ProjectResult;
  onProjectDelete: (projectId: string) => ProjectResult;
  onMilestoneSave: (input: MilestoneInput) => ProjectResult;
  onMilestoneDelete: (milestoneId: string) => ProjectResult;
  onTaskSave: (input: ProjectTaskInput) => ProjectResult;
  onTaskDelete: (taskId: string) => ProjectResult;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
  onProjectSelect: (projectId: string | null) => void;
  onMessageClear: () => void;
}) {
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneInput | null>(
    null,
  );
  const [taskDraft, setTaskDraft] = useState<ProjectTaskInput | null>(null);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
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
    if (!pending) {
      setProjectDraft(null);
      setMilestoneDraft(null);
      setTaskDraft(null);
      setConfirmationTarget(null);
      onMessageClear();
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

    const saved = await onProjectSave(projectDraft);

    if (saved) {
      setProjectDraft(null);
    }
  }

  async function submitMilestone() {
    if (!milestoneDraft) {
      return;
    }

    const saved = await onMilestoneSave(milestoneDraft);

    if (saved) {
      setMilestoneDraft(null);
    }
  }

  async function submitTask() {
    if (!taskDraft) {
      return;
    }

    const saved = await onTaskSave(taskDraft);

    if (saved) {
      setTaskDraft(null);
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

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
  }

  return (
    <>
      <div className="grid gap-3">
        {message ? (
          <InlineMessage darkMode={darkMode}>
            {message}
          </InlineMessage>
        ) : null}

        {selectedProject ? (
          <ProjectDetailPage
            darkMode={darkMode}
            pending={pending}
            project={selectedProject}
            onAddMilestone={(projectId) => {
              onMessageClear();
              setMilestoneDraft(emptyMilestoneDraft(projectId));
            }}
            onEditMilestone={(milestone) => {
              onMessageClear();
              setMilestoneDraft(milestoneToDraft(milestone));
            }}
            onAddTask={(projectId) => {
              onMessageClear();
              setTaskDraft(emptyTaskDraft(projectId));
            }}
            onEditTask={(task: ProjectTaskView) => {
              onMessageClear();
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
            onViewProject={(projectId) => onProjectSelect(projectId)}
            onAddProject={() => {
              onMessageClear();
              setProjectDraft(emptyProjectDraft());
            }}
          />
        )}
      </div>

      {projectDraft ? (
        <ProjectEditorDialog
          darkMode={darkMode}
          pending={pending}
          draft={projectDraft}
          setDraft={updateProjectDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitProject()}
          onDelete={
            projectDraft.id
              ? () =>
                  setConfirmationTarget({
                    type: "project",
                    id: projectDraft.id ?? "",
                    title: projectDraft.title || "this project",
                  })
              : undefined
          }
        />
      ) : null}

      {milestoneDraft ? (
        <MilestoneEditorDialog
          darkMode={darkMode}
          pending={pending}
          draft={milestoneDraft}
          setDraft={updateMilestoneDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitMilestone()}
          onDelete={
            milestoneDraft.id
              ? () =>
                  setConfirmationTarget({
                    type: "milestone",
                    id: milestoneDraft.id ?? "",
                    title: milestoneDraft.title || "this milestone",
                  })
              : undefined
          }
        />
      ) : null}

      {taskDraft ? (
        <ProjectTaskEditorDialog
          darkMode={darkMode}
          pending={pending}
          draft={taskDraft}
          milestones={selectedProject?.milestones ?? []}
          setDraft={updateTaskDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitTask()}
          onDelete={
            taskDraft.id
              ? () =>
                  setConfirmationTarget({
                    type: "task",
                    id: taskDraft.id ?? "",
                    title: taskDraft.title || "this task",
                  })
              : undefined
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title={`Delete ${confirmationTarget.type}`}
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
