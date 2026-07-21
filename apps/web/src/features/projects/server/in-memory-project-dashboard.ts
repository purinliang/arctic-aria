import {
  cloneTask,
  compareDashboardTasks,
} from "./in-memory-project-records.ts";
import {
  projectTaskDailySelectionLimit,
  type ProjectRecord,
  type ProjectTaskRecord,
} from "./project-repository-types.ts";
import {
  taskCanBeAutoScheduled,
  type ProjectTaskDailySelectionRecord,
} from "./project-task-daily-selection.ts";

export function listInMemoryDashboardTasks(input: {
  projects: ProjectRecord[];
  dailySelections: ProjectTaskDailySelectionRecord[];
  userId: string;
  today: string;
  occurredAt: Date;
}) {
  ensureDashboardTaskSelections(input);

  const visibleTasks = visibleDashboardTasks(input.projects, input.userId);
  const taskById = new Map(visibleTasks.map((task) => [task.id, task]));

  return input.dailySelections
    .filter(
      (selection) =>
        selection.userId === input.userId &&
        selection.scheduledDate === input.today,
    )
    .map((selection) => ({
      selection,
      task: taskById.get(selection.taskId),
    }))
    .filter(
      (entry): entry is {
        selection: ProjectTaskDailySelectionRecord;
        task: ProjectTaskRecord;
      } => Boolean(entry.task),
    )
    .sort(
      (left, right) =>
        left.selection.createdAt.getTime() -
          right.selection.createdAt.getTime() ||
        compareDashboardTasks(left.task, right.task) ||
        left.task.sortOrder - right.task.sortOrder ||
        left.task.createdAt.getTime() - right.task.createdAt.getTime(),
    )
    .slice(0, projectTaskDailySelectionLimit)
    .map(({ task }) => cloneTask(task));
}

function ensureDashboardTaskSelections(input: {
  projects: ProjectRecord[];
  dailySelections: ProjectTaskDailySelectionRecord[];
  userId: string;
  today: string;
  occurredAt: Date;
}) {
  const visibleTasks = visibleDashboardTasks(input.projects, input.userId);
  const visibleTaskIds = new Set(visibleTasks.map((task) => task.id));
  const selectedTaskIds = new Set(
    input.dailySelections
      .filter(
        (selection) =>
          selection.userId === input.userId &&
          selection.scheduledDate === input.today &&
          visibleTaskIds.has(selection.taskId),
      )
      .map((selection) => selection.taskId),
  );
  const remainingSlots = projectTaskDailySelectionLimit - selectedTaskIds.size;

  if (remainingSlots <= 0) {
    return;
  }

  visibleTasks
    .filter(
      (task) =>
        task.status !== "done" &&
        !selectedTaskIds.has(task.id) &&
        taskCanBeAutoScheduled(task, input.today),
    )
    .sort(compareDashboardTasks)
    .slice(0, remainingSlots)
    .forEach((task) => {
      input.dailySelections.push({
        id: crypto.randomUUID(),
        userId: input.userId,
        taskId: task.id,
        scheduledDate: input.today,
        createdAt: input.occurredAt,
        movedAt: null,
        movedFromDate: null,
        source: "scheduler",
      });
    });
}

function visibleDashboardTasks(projects: ProjectRecord[], userId: string) {
  return projects
    .filter((project) => project.userId === userId && project.deletedAt === null)
    .flatMap((project) =>
      project.tasks.filter((task) => {
        if (task.deletedAt !== null) {
          return false;
        }

        if (!task.milestoneId) {
          return true;
        }

        return project.milestones.some(
          (milestone) =>
            milestone.id === task.milestoneId && milestone.deletedAt === null,
        );
      }),
    );
}
