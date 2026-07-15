import type { Task } from "@/features/dashboard/types";
import {
  durationDaysForRange,
  durationLabelForDays,
  durationRangeForDays,
} from "./project-duration";
import { isValidProjectDate } from "./project-date-validation";
import type {
  ProjectDurationRange,
  ProjectTimelineType,
} from "./project-duration";
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
  description: string;
  status: ProjectRecord["status"];
  priority: ProjectPriority;
  startDate: string;
  deadlineDate: string;
  expectedDurationDays: string;
  durationRange: ProjectDurationRange;
  timelineText: string;
  currentMilestone: string;
  progressText: string;
  tasks: ProjectTaskView[];
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
  description: string;
  priority: ProjectPriority;
  startDate: string;
  timelineType: ProjectTimelineType;
  deadlineDate: string;
  durationRange: ProjectDurationRange;
};

export type MilestoneInput = {
  id?: string;
  projectId: string;
  title: string;
  objective: string;
  startDate: string;
  timelineType: ProjectTimelineType;
  deadlineDate: string;
  durationRange: ProjectDurationRange;
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
  const description = input.description.trim();
  const startDate = input.startDate.trim();
  let deadlineDate: string | null = null;
  let expectedDurationDays: number | null = null;

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Project title must be 1-120 characters." };
  }

  if (description.length < 1 || description.length > 1000) {
    return {
      ok: false as const,
      message: "Project description must be 1-1000 characters.",
    };
  }

  if (!validateDate(startDate)) {
    return {
      ok: false as const,
      message: "Start date must be a real date in YYYY-MM-DD format.",
    };
  }

  if (input.timelineType === "deadline") {
    deadlineDate = input.deadlineDate.trim();

    if (!deadlineDate || !validateDate(deadlineDate)) {
      return {
        ok: false as const,
        message: "Deadline date must be a real date in YYYY-MM-DD format.",
      };
    }

    if (deadlineDate < startDate) {
      return { ok: false as const, message: "Deadline cannot be before start date." };
    }
  } else {
    expectedDurationDays = durationDaysForRange(input.durationRange);

    if (!expectedDurationDays) {
      return { ok: false as const, message: "Choose an expected duration." };
    }
  }

  return {
    ok: true as const,
    title,
    objective: description.slice(0, 500),
    importanceReason: description,
    startDate,
    deadlineDate,
    expectedDurationDays,
  };
}

export function validateMilestoneInput(input: MilestoneInput) {
  const title = input.title.trim();
  const objective = input.objective.trim();
  const startDate = input.startDate.trim();
  let deadlineDate: string | null = null;
  let expectedDurationDays: number | null = null;

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Milestone title must be 1-120 characters." };
  }

  if (objective.length > 500) {
    return { ok: false as const, message: "Milestone objective must be 500 characters or fewer." };
  }

  if (!validateDate(startDate)) {
    return {
      ok: false as const,
      message: "Start date must be a real date in YYYY-MM-DD format.",
    };
  }

  if (input.timelineType === "deadline") {
    deadlineDate = input.deadlineDate.trim();

    if (!deadlineDate || !validateDate(deadlineDate)) {
      return {
        ok: false as const,
        message: "Deadline date must be a real date in YYYY-MM-DD format.",
      };
    }

    if (deadlineDate < startDate) {
      return { ok: false as const, message: "Deadline cannot be before start date." };
    }
  } else {
    expectedDurationDays = durationDaysForRange(input.durationRange);

    if (!expectedDurationDays) {
      return { ok: false as const, message: "Choose an expected duration." };
    }
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

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Task title must be 1-120 characters." };
  }

  if (description.length > 2000) {
    return { ok: false as const, message: "Task description must be 2000 characters or fewer." };
  }

  for (const value of [scheduledDate, startDate, deadlineDate]) {
    if (value && !validateDate(value)) {
      return {
        ok: false as const,
        message: "Dates must be real calendar dates in YYYY-MM-DD format.",
      };
    }
  }

  if (startDate && deadlineDate && deadlineDate < startDate) {
    return { ok: false as const, message: "Deadline cannot be before start date." };
  }

  return {
    ok: true as const,
    title,
    description,
    scheduledDate,
    startDate,
    deadlineDate,
  };
}

function toProjectView(project: ProjectRecord): ProjectView {
  const tasks = [...project.tasks].sort(compareProjectTasks);
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const activeMilestone = project.milestones.find(
    (milestone) => milestone.status === "active",
  );

  return {
    id: project.id,
    title: project.title,
    description: project.importanceReason || project.objective,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    deadlineDate: project.deadlineDate ?? "",
    expectedDurationDays: project.expectedDurationDays?.toString() ?? "",
    durationRange: durationRangeForDays(project.expectedDurationDays),
    timelineText: project.deadlineDate
      ? `Due ${formatDate(project.deadlineDate)}`
      : project.expectedDurationDays
        ? `${durationLabelForDays(project.expectedDurationDays)} expected`
        : "Open-ended",
    currentMilestone: activeMilestone?.title ?? "No active milestone",
    progressText: `${doneCount} of ${tasks.length} tasks done`,
    tasks: tasks.map(toTaskView),
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
    tasks: [...milestone.tasks].sort(compareProjectTasks).map(toTaskView),
  };
}

function toTaskView(task: ProjectTaskRecord): ProjectTaskView {
  return {
    id: task.id,
    projectId: task.projectId,
    milestoneId: task.milestoneId ?? "",
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
  };
}

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function validateDate(value: string) {
  return isValidProjectDate(value);
}

function compareProjectTasks(
  left: ProjectTaskRecord,
  right: ProjectTaskRecord,
) {
  const statusDifference = statusSortValue(left.status) - statusSortValue(right.status);

  return (
    statusDifference ||
    dateSortValue(left.deadlineDate) - dateSortValue(right.deadlineDate) ||
    dateSortValue(left.startDate) - dateSortValue(right.startDate)
  );
}

function statusSortValue(status: ProjectTaskStatus) {
  return status === "done" ? 1 : 0;
}

function dateSortValue(date: string | null) {
  return date ? Date.parse(date) : Number.POSITIVE_INFINITY;
}
