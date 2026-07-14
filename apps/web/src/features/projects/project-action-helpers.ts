import type { Task } from "@/features/dashboard/types";
import type {
  ProjectMilestoneRecord,
  ProjectPriority,
  ProjectRecord,
  ProjectTaskRecord,
  ProjectTaskStatus,
} from "./server/project-repository";
import { projectService } from "./server/project-service";

export type ProjectView = {
  id: string;
  title: string;
  objective: string;
  importanceReason: string;
  status: ProjectRecord["status"];
  priority: ProjectPriority;
  startDate: string;
  deadlineDate: string;
  expectedDurationDays: string;
  timelineText: string;
  currentMilestone: string;
  progressText: string;
  milestones: MilestoneView[];
};

export type MilestoneView = {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  status: ProjectMilestoneRecord["status"];
  startDate: string;
  deadlineDate: string;
  expectedDurationDays: string;
  progressText: string;
  tasks: ProjectTaskView[];
};

export type ProjectTaskView = Task & {
  projectId: string;
  milestoneId: string;
};

export type ProjectInput = {
  id?: string;
  title: string;
  objective: string;
  importanceReason: string;
  priority: ProjectPriority;
  startDate: string;
  deadlineDate: string;
  expectedDurationDays: string;
};

export type MilestoneInput = {
  id?: string;
  projectId: string;
  title: string;
  objective: string;
  startDate: string;
  deadlineDate: string;
  expectedDurationDays: string;
};

export type ProjectTaskInput = {
  id?: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectTaskStatus;
  scheduledDate: string;
  startDate: string;
  deadlineDate: string;
  subtasks: Array<{
    id?: string;
    title: string;
    description: string;
    isDone: boolean;
  }>;
};

export type ProjectDashboardData = {
  tasks: ProjectTaskView[];
  projects: ProjectView[];
};

export type ProjectActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    };

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

export function unauthorizedResult<T>(): ProjectActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
  };
}

export async function loadProjectDashboardData(
  userId: string,
): Promise<ProjectDashboardData> {
  const [tasks, projects] = await Promise.all([
    projectService.listDashboardTasks(userId),
    projectService.listProjects(userId),
  ]);

  return {
    tasks: tasks.map(toTaskView),
    projects: projects.map(toProjectView),
  };
}

export function validateProjectInput(input: ProjectInput) {
  const title = input.title.trim();
  const objective = input.objective.trim();
  const importanceReason = input.importanceReason.trim();
  const startDate = input.startDate.trim();
  const deadlineDate = input.deadlineDate.trim() || null;
  const expectedDurationDays = parseOptionalInteger(input.expectedDurationDays);

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Project title must be 1-120 characters." };
  }

  if (objective.length < 1 || objective.length > 500) {
    return { ok: false as const, message: "Objective must be 1-500 characters." };
  }

  if (importanceReason.length > 1000) {
    return {
      ok: false as const,
      message: "Importance reason must be 1000 characters or fewer.",
    };
  }

  if (!validateDate(startDate)) {
    return { ok: false as const, message: "Start date must use YYYY-MM-DD." };
  }

  if (deadlineDate && !validateDate(deadlineDate)) {
    return { ok: false as const, message: "Deadline date must use YYYY-MM-DD." };
  }

  if (deadlineDate && deadlineDate < startDate) {
    return { ok: false as const, message: "Deadline cannot be before start date." };
  }

  if (expectedDurationDays !== null && expectedDurationDays <= 0) {
    return { ok: false as const, message: "Expected duration must be positive." };
  }

  return {
    ok: true as const,
    title,
    objective,
    importanceReason,
    startDate,
    deadlineDate,
    expectedDurationDays,
  };
}

export function validateMilestoneInput(input: MilestoneInput) {
  const title = input.title.trim();
  const objective = input.objective.trim();
  const startDate = input.startDate.trim() || null;
  const deadlineDate = input.deadlineDate.trim() || null;
  const expectedDurationDays = parseOptionalInteger(input.expectedDurationDays);

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Milestone title must be 1-120 characters." };
  }

  if (objective.length > 500) {
    return { ok: false as const, message: "Milestone objective must be 500 characters or fewer." };
  }

  if (startDate && !validateDate(startDate)) {
    return { ok: false as const, message: "Start date must use YYYY-MM-DD." };
  }

  if (deadlineDate && !validateDate(deadlineDate)) {
    return { ok: false as const, message: "Deadline date must use YYYY-MM-DD." };
  }

  if (startDate && deadlineDate && deadlineDate < startDate) {
    return { ok: false as const, message: "Deadline cannot be before start date." };
  }

  if (expectedDurationDays !== null && expectedDurationDays <= 0) {
    return { ok: false as const, message: "Expected duration must be positive." };
  }

  return {
    ok: true as const,
    title,
    objective,
    startDate,
    deadlineDate,
    expectedDurationDays,
  };
}

export function validateProjectTaskInput(input: ProjectTaskInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const scheduledDate = input.scheduledDate.trim() || null;
  const startDate = input.startDate.trim() || null;
  const deadlineDate = input.deadlineDate.trim() || null;
  const subtasks = input.subtasks
    .map((subtask) => ({
      id: subtask.id,
      title: subtask.title.trim(),
      description: subtask.description.trim(),
      isDone: subtask.isDone,
    }))
    .filter((subtask) => subtask.title.length > 0);

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Task title must be 1-120 characters." };
  }

  if (description.length > 2000) {
    return { ok: false as const, message: "Task description must be 2000 characters or fewer." };
  }

  for (const value of [scheduledDate, startDate, deadlineDate]) {
    if (value && !validateDate(value)) {
      return { ok: false as const, message: "Dates must use YYYY-MM-DD." };
    }
  }

  if (startDate && deadlineDate && deadlineDate < startDate) {
    return { ok: false as const, message: "Deadline cannot be before start date." };
  }

  for (const subtask of subtasks) {
    if (subtask.title.length > 120) {
      return { ok: false as const, message: "Subtask title must be 120 characters or fewer." };
    }

    if (subtask.description.length > 2000) {
      return { ok: false as const, message: "Subtask description must be 2000 characters or fewer." };
    }
  }

  return {
    ok: true as const,
    title,
    description,
    scheduledDate,
    startDate,
    deadlineDate,
    subtasks,
  };
}

function toProjectView(project: ProjectRecord): ProjectView {
  const tasks = project.milestones.flatMap((milestone) => milestone.tasks);
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const activeMilestone = project.milestones.find(
    (milestone) => milestone.status === "active",
  );

  return {
    id: project.id,
    title: project.title,
    objective: project.objective,
    importanceReason: project.importanceReason,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    deadlineDate: project.deadlineDate ?? "",
    expectedDurationDays: project.expectedDurationDays?.toString() ?? "",
    timelineText: project.deadlineDate
      ? `Due ${formatDate(project.deadlineDate)}`
      : project.expectedDurationDays
        ? `${project.expectedDurationDays} days expected`
        : "Open-ended",
    currentMilestone: activeMilestone?.title ?? "No active milestone",
    progressText: `${doneCount} of ${tasks.length} tasks done`,
    milestones: project.milestones.map(toMilestoneView),
  };
}

function toMilestoneView(milestone: ProjectMilestoneRecord): MilestoneView {
  const doneCount = milestone.tasks.filter((task) => task.status === "done").length;

  return {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    objective: milestone.objective,
    status: milestone.status,
    startDate: milestone.startDate ?? "",
    deadlineDate: milestone.deadlineDate ?? "",
    expectedDurationDays: milestone.expectedDurationDays?.toString() ?? "",
    progressText: `${doneCount} of ${milestone.tasks.length} tasks done`,
    tasks: milestone.tasks.map(toTaskView),
  };
}

function toTaskView(task: ProjectTaskRecord): ProjectTaskView {
  const doneCount = task.subtasks.filter((subtask) => subtask.isDone).length;

  return {
    id: task.id,
    projectId: task.projectId,
    milestoneId: task.milestoneId,
    title: task.title,
    description: task.description,
    projectLabel: task.projectTitle,
    milestoneLabel: task.milestoneTitle,
    deadline: task.deadlineDate ? formatDate(task.deadlineDate) : "No deadline",
    priority: task.priority,
    status: task.status,
    scheduledDate: task.scheduledDate ?? "",
    startDate: task.startDate ?? "",
    deadlineDate: task.deadlineDate ?? "",
    subtaskSummary: `${doneCount} of ${task.subtasks.length} subtasks done`,
    subtasks: task.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      description: subtask.description,
      isDone: subtask.isDone,
      done: subtask.isDone,
    })),
  };
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function validateDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
