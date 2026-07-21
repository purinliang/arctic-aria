import type { ProjectTaskRecord } from "./project-repository-types.ts";
import { projectTaskAutoScheduleHorizonDays } from "./project-repository-types.ts";

export type ProjectTaskDailySelectionRecord = {
  id: string;
  userId: string;
  taskId: string;
  scheduledDate: string;
  createdAt: Date;
  movedAt: Date | null;
  movedFromDate: string | null;
  source: "manual" | "scheduler";
};

export function taskCanBeAutoScheduled(
  task: ProjectTaskRecord,
  today: string,
) {
  if (task.startDate && task.startDate > today) {
    return false;
  }

  if (!task.deadlineDate) {
    return false;
  }

  return daysBetween(today, task.deadlineDate) <= projectTaskAutoScheduleHorizonDays;
}

function daysBetween(left: string, right: string) {
  const leftDate = Date.parse(`${left}T00:00:00.000Z`);
  const rightDate = Date.parse(`${right}T00:00:00.000Z`);

  return Math.floor((rightDate - leftDate) / (24 * 60 * 60 * 1000));
}
