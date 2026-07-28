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

export function emptyProjectDraft(): ProjectInput {
  return {
    title: "",
    description: "",
    startDate: todayDate(),
    timelineType: "duration",
    deadlineDate: "",
    durationRange: defaultProjectDurationRange,
  };
}

export function todayDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function projectToDraft(project: ProjectView): ProjectInput {
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? "",
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
    startDate: todayDate(),
    timelineType: "duration",
    deadlineDate: "",
    durationRange: defaultProjectDurationRange,
  };
}

export function milestoneToDraft(
  milestone: ProjectView["milestones"][number],
): MilestoneInput {
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    objective: milestone.objective ?? "",
    startDate: milestone.startDate || todayDate(),
    timelineType: milestone.deadlineDate ? "deadline" : "duration",
    deadlineDate: milestone.deadlineDate,
    durationRange: durationRangeForDays(Number(milestone.expectedDurationDays)),
  };
}

export function emptyTaskDraft(
  projectId: string,
  milestoneId = "",
): ProjectTaskInput {
  return {
    projectId,
    milestoneId,
    title: "",
    description: "",
    startDate: todayDate(),
    deadlineDate: "",
    estimatedDurationMinutes: "",
  };
}

export function taskToDraft(task: ProjectTaskView): ProjectTaskInput {
  return {
    id: task.id,
    projectId: task.projectId,
    milestoneId: task.milestoneId,
    title: task.title,
    description: task.description ?? "",
    startDate: task.startDate,
    deadlineDate: task.deadlineDate,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
  };
}
