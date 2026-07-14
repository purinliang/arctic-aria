import { useMemo, useState } from "react";
import type { SetStateAction } from "react";
import { Panel } from "@/components/ui/panel";
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
  onProjectSave,
  onMilestoneSave,
  onTaskSave,
  onTaskStatus,
  onMessageClear,
}: {
  darkMode: boolean;
  projects: ProjectView[];
  loading: boolean;
  pending: boolean;
  message: string | null;
  onProjectSave: (input: ProjectInput) => ProjectResult;
  onMilestoneSave: (input: MilestoneInput) => ProjectResult;
  onTaskSave: (input: ProjectTaskInput) => ProjectResult;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => ProjectResult;
  onMessageClear: () => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectInput | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneInput | null>(
    null,
  );
  const [taskDraft, setTaskDraft] = useState<ProjectTaskInput | null>(null);
  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === selectedProjectId) ??
      projects[0] ??
      null,
    [projects, selectedProjectId],
  );

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
      <Panel darkMode={darkMode}>
        {message ? (
          <InlineMessage darkMode={darkMode} className="m-4">
            {message}
          </InlineMessage>
        ) : null}
        <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
          <ProjectsList
            darkMode={darkMode}
            loading={loading}
            pending={pending}
            projects={projects}
            selectedProjectId={selectedProject?.id ?? null}
            onSelectProject={setSelectedProjectId}
            onAddProject={() => {
              onMessageClear();
              setProjectDraft(emptyProjectDraft());
            }}
            onEditProject={(project) => {
              onMessageClear();
              setProjectDraft(projectToDraft(project));
            }}
          />
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
            onAddTask={(projectId, milestoneId) => {
              onMessageClear();
              setTaskDraft(emptyTaskDraft(projectId, milestoneId));
            }}
            onEditTask={(task: ProjectTaskView) => {
              onMessageClear();
              setTaskDraft(taskToDraft(task));
            }}
            onTaskStatus={(taskId, status) => void onTaskStatus(taskId, status)}
          />
        </div>
      </Panel>

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
