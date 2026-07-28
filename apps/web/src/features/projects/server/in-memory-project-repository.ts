import type {
  ImportProjectTreeInput,
  ProjectPinResult,
  ProjectRecord,
  ProjectRepository,
  ProjectTaskRecord,
  ProjectTaskStatus,
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository-types.ts";
import type { ProjectTaskDailySelectionRecord } from "./project-task-daily-selection.ts";
import { listInMemoryDashboardTasks } from "./in-memory-project-dashboard.ts";
import {
  pinInMemoryProject,
  unpinInMemoryProject,
} from "./in-memory-project-pinning.ts";
import {
  cloneProject,
  normalizeProjectForStorage,
  syncMilestoneTasks,
} from "./in-memory-project-records.ts";

export class InMemoryProjectRepository implements ProjectRepository {
  private projects: ProjectRecord[];
  private dailySelections: ProjectTaskDailySelectionRecord[];

  constructor(seed?: {
    projects?: ProjectRecord[];
    dailySelections?: ProjectTaskDailySelectionRecord[];
  }) {
    this.projects = (seed?.projects ?? []).map(normalizeProjectForStorage);
    this.dailySelections = seed?.dailySelections ?? [];
  }

  async listProjects(userId: string) {
    return this.projects
      .filter((project) => project.userId === userId && project.deletedAt === null)
      .map(cloneProject);
  }

  async listDashboardTasks(
    userId: string,
    today: string,
    occurredAt: Date,
  ) {
    return listInMemoryDashboardTasks({
      projects: this.projects,
      dailySelections: this.dailySelections,
      userId,
      today,
      occurredAt,
    });
  }

  async saveProject(input: SaveProjectInput) {
    const existing = input.projectId
      ? this.projects.find(
          (project) =>
            project.userId === input.userId && project.id === input.projectId,
        )
      : null;

    if (input.projectId && !existing) {
      return null;
    }

    if (existing) {
      Object.assign(existing, {
        title: input.title,
        objective: input.objective,
        startDate: input.startDate,
        deadlineDate: input.deadlineDate,
        expectedDurationDays: input.expectedDurationDays,
        updatedAt: input.occurredAt,
      });
      return existing.id;
    }

    const projectId = crypto.randomUUID();
    this.projects.push({
      id: projectId,
      userId: input.userId,
      title: input.title,
      objective: input.objective,
      startDate: input.startDate,
      deadlineDate: input.deadlineDate,
      expectedDurationDays: input.expectedDurationDays,
      sidebarPinOrder: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      deletedAt: null,
      tasks: [],
      milestones: [],
    });

    return projectId;
  }

  async saveMilestone(input: SaveMilestoneInput) {
    const project = this.findProject(input.userId, input.projectId);

    if (!project) {
      return null;
    }

    const existing = input.milestoneId
      ? project.milestones.find((milestone) => milestone.id === input.milestoneId)
      : null;

    if (input.milestoneId && !existing) {
      return null;
    }

    if (existing) {
      Object.assign(existing, {
        title: input.title,
        objective: input.objective,
        startDate: input.startDate,
        deadlineDate: input.deadlineDate,
        expectedDurationDays: input.expectedDurationDays,
        updatedAt: input.occurredAt,
      });
      project.tasks = project.tasks.map((task) =>
        task.milestoneId === existing.id
          ? { ...task, milestoneTitle: input.title }
          : task,
      );
      syncMilestoneTasks(project);
      return existing.id;
    }

    const milestoneId = crypto.randomUUID();
    project.milestones.push({
      id: milestoneId,
      userId: input.userId,
      projectId: project.id,
      title: input.title,
      objective: input.objective,
      sortOrder: project.milestones.length,
      startDate: input.startDate,
      deadlineDate: input.deadlineDate,
      expectedDurationDays: input.expectedDurationDays,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      deletedAt: null,
      tasks: [],
    });

    return milestoneId;
  }

  async saveTask(input: SaveProjectTaskInput) {
    const target = this.findProjectAndOptionalMilestone(input);

    if (!target) {
      return false;
    }

    const existing = input.taskId
      ? target.project.tasks.find((task) => task.id === input.taskId)
      : null;

    if (input.taskId && !existing) {
      return false;
    }

    const taskId = existing?.id ?? crypto.randomUUID();
    const nextTask: ProjectTaskRecord = {
      ...(existing ?? {
        id: taskId,
        userId: input.userId,
        projectId: target.project.id,
        projectTitle: target.project.title,
        sortOrder: target.project.tasks.length,
        createdAt: input.occurredAt,
      }),
      milestoneId: target.milestone?.id ?? null,
      milestoneTitle: target.milestone?.title ?? "",
      title: input.title,
      description: input.description,
      status: existing?.status ?? "todo",
      startDate: input.startDate,
      deadlineDate: input.deadlineDate,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      updatedAt: input.occurredAt,
      completedAt: existing?.completedAt ?? null,
      deletedAt: existing?.deletedAt ?? null,
    };

    target.project.tasks = [
      ...target.project.tasks.filter((task) => task.id !== taskId),
      nextTask,
    ];
    syncMilestoneTasks(target.project);
    return true;
  }

  async importProjectTree(input: ImportProjectTreeInput) {
    const projectId = await this.saveProject({
      userId: input.userId,
      ...input.project,
      occurredAt: input.occurredAt,
    });

    if (!projectId) {
      return null;
    }

    for (const milestone of input.milestones) {
      const milestoneId = await this.saveMilestone({
        userId: input.userId,
        projectId,
        title: milestone.title,
        objective: milestone.objective,
        startDate: milestone.startDate,
        deadlineDate: milestone.deadlineDate,
        expectedDurationDays: milestone.expectedDurationDays,
        occurredAt: input.occurredAt,
      });

      if (!milestoneId) {
        return null;
      }

      for (const task of milestone.tasks) {
        const saved = await this.saveTask({
          userId: input.userId,
          projectId,
          milestoneId,
          title: task.title,
          description: task.description,
          startDate: task.startDate,
          deadlineDate: task.deadlineDate,
          estimatedDurationMinutes: task.estimatedDurationMinutes,
          occurredAt: input.occurredAt,
        });

        if (!saved) {
          return null;
        }
      }
    }

    return projectId;
  }

  async archiveProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }) {
    const project = this.findProject(input.userId, input.projectId);

    if (!project) {
      return false;
    }

    project.sidebarPinOrder = null;
    project.deletedAt = input.occurredAt;
    project.updatedAt = input.occurredAt;
    return true;
  }

  async pinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }): Promise<ProjectPinResult> {
    return pinInMemoryProject({
      projects: this.projects,
      ...input,
    });
  }

  async unpinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }) {
    return unpinInMemoryProject({
      projects: this.projects,
      ...input,
    });
  }

  async archiveMilestone(input: {
    userId: string;
    milestoneId: string;
    occurredAt: Date;
  }) {
    const project = this.projects
      .filter(
        (current) => current.userId === input.userId && current.deletedAt === null,
      )
      .find((current) =>
        current.milestones.some(
          (milestone) =>
            milestone.id === input.milestoneId && milestone.deletedAt === null,
        ),
      );
    const milestone = project?.milestones.find(
      (current) =>
        current.id === input.milestoneId && current.deletedAt === null,
    );

    if (!project || !milestone) {
      return false;
    }

    milestone.deletedAt = input.occurredAt;
    milestone.updatedAt = input.occurredAt;
    project.tasks = project.tasks.map((task) =>
      task.milestoneId === milestone.id
        ? { ...task, milestoneId: null, milestoneTitle: "" }
        : task,
    );
    syncMilestoneTasks(project);
    return true;
  }

  async archiveTask(input: {
    userId: string;
    taskId: string;
    occurredAt: Date;
  }) {
    const task = this.findTask(input.userId, input.taskId);

    if (!task) {
      return false;
    }

    task.deletedAt = input.occurredAt;
    task.updatedAt = input.occurredAt;
    this.projects
      .filter((project) => project.userId === input.userId)
      .forEach(syncMilestoneTasks);
    return true;
  }

  async updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: ProjectTaskStatus;
    occurredAt: Date;
  }) {
    const task = this.findTask(input.userId, input.taskId);

    if (!task) {
      return false;
    }

    task.status = input.status;
    task.completedAt = input.status === "done" ? input.occurredAt : null;
    task.updatedAt = input.occurredAt;
    this.projects
      .filter((project) => project.userId === input.userId)
      .forEach(syncMilestoneTasks);
    return true;
  }

  private findProject(userId: string, projectId: string) {
    return this.projects.find(
      (project) =>
        project.userId === userId &&
        project.id === projectId &&
        project.deletedAt === null,
    );
  }

  private findProjectAndOptionalMilestone(input: {
    userId: string;
    projectId: string;
    milestoneId: string | null;
  }) {
    const project = this.findProject(input.userId, input.projectId);
    if (!project) {
      return null;
    }

    if (!input.milestoneId) {
      return { project, milestone: null };
    }

    const milestone = project?.milestones.find(
      (current) =>
        current.id === input.milestoneId && current.deletedAt === null,
    );

    return milestone ? { project, milestone } : null;
  }

  private findTask(userId: string, taskId: string) {
    return this.projects
      .filter((project) => project.userId === userId && project.deletedAt === null)
      .flatMap((project) => project.tasks)
      .find((task) => task.id === taskId && task.deletedAt === null);
  }
}
