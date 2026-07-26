import { PostgresProjectRepository } from "./postgres-project-repository.ts";
import {
  defaultResolvedTimeZone,
  localScheduledDateKey,
} from "../../settings/time-zones.ts";
import type {
  ImportProjectTreeInput,
  ProjectRepository,
  ProjectTaskStatus,
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository.ts";

export type ProjectServiceOptions = {
  projects?: ProjectRepository;
  now?: () => Date;
};

export function createProjectService(options: ProjectServiceOptions = {}) {
  const projects = options.projects ?? new PostgresProjectRepository();
  const now = options.now ?? (() => new Date());

  return {
    async listProjects(userId: string) {
      return projects.listProjects(userId);
    },

    async listDashboardTasks(
      userId: string,
      timeZone = defaultResolvedTimeZone,
    ) {
      const occurredAt = now();

      return projects.listDashboardTasks(
        userId,
        localScheduledDateKey({
          date: occurredAt,
          timeZone,
        }),
        occurredAt,
      );
    },

    async saveProject(
      userId: string,
      input: Omit<SaveProjectInput, "userId" | "occurredAt">,
    ) {
      return projects.saveProject({
        ...input,
        userId,
        occurredAt: now(),
      });
    },

    async saveMilestone(
      userId: string,
      input: Omit<SaveMilestoneInput, "userId" | "occurredAt">,
    ) {
      return projects.saveMilestone({
        ...input,
        userId,
        occurredAt: now(),
      });
    },

    async saveTask(
      userId: string,
      input: Omit<SaveProjectTaskInput, "userId" | "occurredAt">,
    ) {
      return projects.saveTask({
        ...input,
        userId,
        occurredAt: now(),
      });
    },

    async importProjectTree(
      userId: string,
      input: Omit<ImportProjectTreeInput, "userId" | "occurredAt">,
    ) {
      return projects.importProjectTree({
        ...input,
        userId,
        occurredAt: now(),
      });
    },

    async archiveProject(userId: string, projectId: string) {
      return projects.archiveProject({
        userId,
        projectId,
        occurredAt: now(),
      });
    },

    async pinProject(userId: string, projectId: string) {
      return projects.pinProject({
        userId,
        projectId,
        occurredAt: now(),
      });
    },

    async unpinProject(userId: string, projectId: string) {
      return projects.unpinProject({
        userId,
        projectId,
        occurredAt: now(),
      });
    },

    async archiveMilestone(userId: string, milestoneId: string) {
      return projects.archiveMilestone({
        userId,
        milestoneId,
        occurredAt: now(),
      });
    },

    async archiveTask(userId: string, taskId: string) {
      return projects.archiveTask({
        userId,
        taskId,
        occurredAt: now(),
      });
    },

    async updateTaskStatus(
      userId: string,
      taskId: string,
      status: ProjectTaskStatus,
    ) {
      return projects.updateTaskStatus({
        userId,
        taskId,
        status,
        occurredAt: now(),
      });
    },

  };
}

export const projectService = createProjectService();
