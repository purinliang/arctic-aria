import { PostgresProjectRepository } from "./postgres-project-repository.ts";
import type {
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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createProjectService(options: ProjectServiceOptions = {}) {
  const projects = options.projects ?? new PostgresProjectRepository();
  const now = options.now ?? (() => new Date());

  return {
    async listProjects(userId: string) {
      return projects.listProjects(userId);
    },

    async listDashboardTasks(userId: string) {
      return projects.listDashboardTasks(userId, dateKey(now()));
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

    async archiveProject(userId: string, projectId: string) {
      return projects.archiveProject({
        userId,
        projectId,
        occurredAt: now(),
      });
    },

    async updateTaskStatus(
      userId: string,
      taskId: string,
      status: Exclude<ProjectTaskStatus, "archived">,
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
