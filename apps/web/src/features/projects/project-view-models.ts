import type { Task } from "@/features/dashboard/types";
import {
  durationLabelForDays,
  durationRangeForDays,
} from "./project-duration";
import type { ProjectDurationRange } from "./project-duration";
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
  sidebarPinOrder: number | null;
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

export type ProjectDashboardData = {
  tasks: ProjectTaskView[];
  projects: ProjectView[];
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

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
    sidebarPinOrder: project.sidebarPinOrder,
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
