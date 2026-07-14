import { useEffect, useMemo, useState } from "react";
import type { SetStateAction } from "react";
import { InlineMessage } from "@/components/ui/text";
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
  projectToDraft,
  taskToDraft,
} from "./project-page-helpers";

type ProjectResult = Promise<boolean>;

export function ProjectsPage({
  darkMode,
  projects,
  loading,
  pending,
  message,
  selectedProjectId,
  onProjectSave,
  onMilestoneSave,
  onTaskSave,
  onTaskStatus,
  onSubtaskToggle,
  onProjectSelect,
  onMessageClear,
}: {
  darkMode: boolean;
  projects: ProjectView[];
  loading: boolean;
  pending: boolean;
  message: string | null;
  selectedProjectId: string | null;
  onProjectSave: (input: ProjectInput) => ProjectResult;
  onMilestoneSave: (input: MilestoneInput) => ProjectResult;
  onTaskSave: (input: ProjectTaskInput) => ProjectResult;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => ProjectResult;
  onSubtaskToggle: (subtaskId: string, done: boolean) => ProjectResult;
  onProjectSelect: (projectId: string | null) => void;
  onMessageClear: () => void;
}) {
  const [projectDraft, setProjectDraft] = useState<ProjectInput | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneInput | null>(
    null,
  );
  const [taskDraft, setTaskDraft] = useState<ProjectTaskInput | null>(null);
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
        ? next(
            current ??
              emptyTaskDraft(
                selectedProject?.id ?? "",
                selectedProject?.milestones[0]?.id ?? "",
              ),
          )
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
            onEditProject={(project) => {
              onMessageClear();
              setProjectDraft(projectToDraft(project));
            }}
            onAddMilestone={(projectId) => {
              onMessageClear();
              setMilestoneDraft(emptyMilestoneDraft(projectId));
            }}
            onEditMilestone={(milestone) => {
              onMessageClear();
              setMilestoneDraft(milestoneToDraft(milestone));
            }}
            onAddTask={(projectId, milestoneId) => {
              onMessageClear();
              setTaskDraft(emptyTaskDraft(projectId, milestoneId));
            }}
            onEditTask={(task: ProjectTaskView) => {
              onMessageClear();
              setTaskDraft(taskToDraft(task));
            }}
            onTaskStatus={(taskId, status) => void onTaskStatus(taskId, status)}
            onSubtaskToggle={(subtaskId, done) =>
              void onSubtaskToggle(subtaskId, done)
            }
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
          message={message}
          draft={projectDraft}
          setDraft={updateProjectDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitProject()}
        />
      ) : null}

      {milestoneDraft ? (
        <MilestoneEditorDialog
          darkMode={darkMode}
          pending={pending}
          message={message}
          draft={milestoneDraft}
          setDraft={updateMilestoneDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitMilestone()}
        />
      ) : null}

      {taskDraft ? (
        <ProjectTaskEditorDialog
          darkMode={darkMode}
          pending={pending}
          message={message}
          draft={taskDraft}
          setDraft={updateTaskDraft}
          onClose={closeDialogs}
          onSubmit={() => void submitTask()}
        />
      ) : null}
    </>
  );
}
