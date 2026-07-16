import type {
  ProjectRecord,
  ProjectTaskRecord,
} from "./project-repository-types.ts";

export function cloneProject(project: ProjectRecord): ProjectRecord {
  const milestones = project.milestones.filter(
    (milestone) => milestone.status !== "archived",
  );
  const visibleMilestoneIds = new Set(
    milestones.map((milestone) => milestone.id),
  );
  const tasks = project.tasks
    .filter((task) => task.status !== "archived")
    .map((task) =>
      task.milestoneId && !visibleMilestoneIds.has(task.milestoneId)
        ? { ...task, milestoneId: null, milestoneTitle: "" }
        : cloneTask(task),
    );

  return {
    ...project,
    tasks,
    milestones: milestones.map((milestone) => ({
      ...milestone,
      tasks: tasks.filter((task) => task.milestoneId === milestone.id),
    })),
  };
}

export function normalizeProjectForStorage(
  project: ProjectRecord,
): ProjectRecord {
  const tasks =
    project.tasks.length > 0
      ? project.tasks.map(cloneTask)
      : project.milestones.flatMap((milestone) =>
          milestone.tasks.map(cloneTask),
        );
  const normalized = {
    ...project,
    tasks,
    milestones: project.milestones.map((milestone) => ({
      ...milestone,
      tasks: [],
    })),
  };

  syncMilestoneTasks(normalized);
  return normalized;
}

export function syncMilestoneTasks(project: ProjectRecord) {
  project.milestones.forEach((milestone) => {
    milestone.tasks = project.tasks.filter(
      (task) => task.milestoneId === milestone.id,
    );
  });
}

export function compareDashboardTasks(
  left: ProjectTaskRecord,
  right: ProjectTaskRecord,
) {
  return (
    dateSortValue(left.deadlineDate) - dateSortValue(right.deadlineDate) ||
    dateSortValue(left.startDate) - dateSortValue(right.startDate)
  );
}

export function cloneTask(task: ProjectTaskRecord): ProjectTaskRecord {
  return { ...task };
}

function dateSortValue(date: string | null) {
  return date ? Date.parse(date) : Number.POSITIVE_INFINITY;
}
