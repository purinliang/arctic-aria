import { defaultProjectDurationRange } from "./project-duration.ts";
import {
  validateMilestoneInput,
  validateProjectInput,
  validateProjectTaskInput,
} from "./project-action-helpers.ts";
import type {
  MilestoneInput,
  ProjectInput,
  ProjectTaskInput,
} from "./project-action-helpers.ts";
import type {
  ProjectImportCommand,
  ProjectImportDocument,
  ProjectImportMilestone,
  ProjectImportResult,
  ProjectImportTask,
  ProjectImportTimeline,
} from "./project-import-types.ts";

export function normalizeProjectImportDocument(
  document: ProjectImportDocument,
  today: string,
): ProjectImportResult<ProjectImportCommand> {
  const projectInput = projectImportToInput(document, today);
  const projectValidation = validateProjectInput(projectInput);

  if (!projectValidation.ok) {
    return projectValidation;
  }

  const milestones = [];

  for (const milestone of document.milestones ?? []) {
    const input = milestoneImportToInput(milestone, today);
    const validation = validateMilestoneInput(input);

    if (!validation.ok) {
      return validation;
    }

    const tasks = normalizeMilestoneTasks(milestone.tasks ?? [], today);
    if (!tasks.ok) {
      return tasks;
    }

    milestones.push({
      title: validation.title,
      objective: validation.objective,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      expectedDurationDays: validation.expectedDurationDays,
      tasks: tasks.data,
    });
  }

  return {
    ok: true,
    data: {
      project: {
        title: projectValidation.title,
        objective: projectValidation.objective,
        startDate: projectValidation.startDate,
        deadlineDate: projectValidation.deadlineDate,
        expectedDurationDays: projectValidation.expectedDurationDays,
      },
      milestones,
    },
  };
}

function normalizeMilestoneTasks(
  tasks: ProjectImportTask[],
  today: string,
): ProjectImportResult<ProjectImportCommand["milestones"][number]["tasks"]> {
  const normalizedTasks = [];

  for (const task of tasks) {
    const input = taskImportToInput(task, today);
    const validation = validateProjectTaskInput(input);

    if (!validation.ok) {
      return validation;
    }

    normalizedTasks.push({
      title: validation.title,
      description: validation.description,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
    });
  }

  return { ok: true, data: normalizedTasks };
}

function projectImportToInput(
  document: ProjectImportDocument,
  today: string,
): ProjectInput {
  const timeline = document.project.timeline ?? defaultTimeline();

  return {
    title: document.project.title,
    description: document.project.objective ?? "",
    startDate: document.project.startDate ?? today,
    ...timelineInput(timeline),
  };
}

function milestoneImportToInput(
  milestone: ProjectImportMilestone,
  today: string,
): MilestoneInput {
  const timeline = milestone.timeline ?? defaultTimeline();

  return {
    projectId: "project-import-placeholder",
    title: milestone.title,
    objective: milestone.objective ?? "",
    startDate: milestone.startDate ?? today,
    ...timelineInput(timeline),
  };
}

function taskImportToInput(task: ProjectImportTask, today: string): ProjectTaskInput {
  return {
    projectId: "project-import-placeholder",
    milestoneId: "project-import-milestone-placeholder",
    title: task.title,
    description: task.description ?? "",
    startDate: task.startDate ?? today,
    deadlineDate: task.deadlineDate ?? "",
  };
}

function timelineInput(timeline: ProjectImportTimeline): Pick<
  ProjectInput,
  "deadlineDate" | "durationRange" | "timelineType"
> {
  if (timeline.type === "deadline") {
    return {
      timelineType: "deadline",
      deadlineDate: timeline.deadlineDate,
      durationRange: defaultProjectDurationRange,
    };
  }

  return {
    timelineType: "duration",
    deadlineDate: "",
    durationRange: timeline.durationRange,
  };
}

function defaultTimeline(): ProjectImportTimeline {
  return {
    type: "duration",
    durationRange: defaultProjectDurationRange,
  };
}
