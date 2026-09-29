import { addDaysToDateKey } from "../../settings/time-zones.ts";
import type { ProjectRecord } from "./project-repository-types.ts";
import type { ProjectTaskDailySelectionRecord } from "./project-task-daily-selection.ts";

export function moveInMemoryDashboardTaskToTomorrow(input: {
  projects: ProjectRecord[];
  dailySelections: ProjectTaskDailySelectionRecord[];
  userId: string;
  taskId: string;
  today: string;
  occurredAt: Date;
}) {
  const task = input.projects
    .filter((project) => project.userId === input.userId && project.deletedAt === null)
    .flatMap((project) =>
      project.tasks.filter(
        (candidate) =>
          candidate.deletedAt === null &&
          (!candidate.milestoneId ||
            project.milestones.some(
              (milestone) =>
                milestone.id === candidate.milestoneId && milestone.deletedAt === null,
            )),
      ),
    )
    .find((candidate) => candidate.id === input.taskId && candidate.status === "todo");
  const source = input.dailySelections.find(
    (selection) =>
      selection.userId === input.userId &&
      selection.taskId === input.taskId &&
      selection.scheduledDate === input.today,
  );

  if (!task || !source) {
    return false;
  }

  const tomorrow = addDaysToDateKey(input.today, 1);
  const target = input.dailySelections.find(
    (selection) =>
      selection.userId === input.userId &&
      selection.taskId === input.taskId &&
      selection.scheduledDate === tomorrow,
  );

  if (target && (target.source !== "scheduler" || target.movedAt !== null)) {
    return false;
  }

  if (target) {
    input.dailySelections.splice(input.dailySelections.indexOf(target), 1);
  }

  source.scheduledDate = tomorrow;
  source.movedFromDate = input.today;
  source.movedAt = input.occurredAt;
  return true;
}
