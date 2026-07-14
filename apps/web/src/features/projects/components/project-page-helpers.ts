import type {
  MilestoneInput,
  ProjectInput,
  ProjectTaskInput,
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import {
  defaultProjectDurationRange,
  durationRangeForDays,
} from "@/features/projects/project-duration";
import type { ProjectPriority } from "@/features/projects/server/project-repository";

export const priorityOptions: Array<{
  value: ProjectPriority;
  label: string;
}> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const taskStatusOptions: Array<{
  value: ProjectTaskInput["status"];
  label: string;
}> = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "blocked", label: "Blocked" },
  { value: "skipped", label: "Skipped" },
  { value: "done", label: "Done" },
];

export function emptyProjectDraft(): ProjectInput {
  return {
    title: "",
    description: "",
    priority: "medium",
    startDate: new Date().toISOString().slice(0, 10),
    timelineType: "duration",
    deadlineDate: "",
    durationRange: defaultProjectDurationRange,
  };
}

export function projectToDraft(project: ProjectView): ProjectInput {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    priority: project.priority,
    startDate: project.startDate,
    timelineType: project.deadlineDate ? "deadline" : "duration",
    deadlineDate: project.deadlineDate,
    durationRange: durationRangeForDays(Number(project.expectedDurationDays)),
  };
}

export function emptyMilestoneDraft(projectId: string): MilestoneInput {
  return {
    projectId,
    title: "",
    objective: "",
    startDate: "",
    deadlineDate: "",
    expectedDurationDays: "",
  };
}

export function milestoneToDraft(
  milestone: ProjectView["milestones"][number],
): MilestoneInput {
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    objective: milestone.objective,
    startDate: milestone.startDate,
    deadlineDate: milestone.deadlineDate,
    expectedDurationDays: milestone.expectedDurationDays,
  };
}

export function emptyTaskDraft(
  projectId: string,
  milestoneId: string,
): ProjectTaskInput {
  return {
    projectId,
    milestoneId,
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    scheduledDate: "",
    startDate: "",
    deadlineDate: "",
    subtasks: [],
  };
}

export function taskToDraft(task: ProjectTaskView): ProjectTaskInput {
  return {
    id: task.id,
    projectId: task.projectId,
    milestoneId: task.milestoneId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    scheduledDate: task.scheduledDate,
    startDate: task.startDate,
    deadlineDate: task.deadlineDate,
    subtasks:
      task.subtasks?.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        isDone: subtask.isDone,
      })) ?? [],
  };
}

export function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
