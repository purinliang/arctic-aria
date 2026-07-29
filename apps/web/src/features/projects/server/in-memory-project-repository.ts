import type {
  ApplyProjectTreeTemplateInput,
  CreateProjectTreeTemplateInput,
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

  async applyProjectTreeTemplate(input: ApplyProjectTreeTemplateInput) {
    const project = this.findProject(input.userId, input.project.projectId);

    if (!project) {
      return false;
    }

    Object.assign(project, {
      title: input.project.title,
      objective: input.project.objective,
      startDate: input.project.startDate,
      deadlineDate: input.project.deadlineDate,
      expectedDurationDays: input.project.expectedDurationDays,
      updatedAt: input.occurredAt,
    });
    project.tasks = project.tasks.map((task) => ({
      ...task,
      projectTitle: input.project.title,
    }));

    for (const milestone of input.milestones) {
      if (milestone.operation === "create") {
        project.milestones.push({
          id: milestone.milestoneId,
          userId: input.userId,
          projectId: project.id,
          title: milestone.title,
          objective: milestone.objective,
          sortOrder: nextMilestoneSortOrder(project),
          startDate: milestone.startDate,
          deadlineDate: milestone.deadlineDate,
          expectedDurationDays: milestone.expectedDurationDays,
          createdAt: input.occurredAt,
          updatedAt: input.occurredAt,
          completedAt: null,
          deletedAt: null,
          tasks: [],
        });
        continue;
      }

      const existing = project.milestones.find(
        (current) =>
          current.id === milestone.milestoneId &&
          current.deletedAt === null,
      );

      if (!existing) {
        return false;
      }

      if (milestone.operation === "delete") {
        existing.deletedAt = input.occurredAt;
        existing.updatedAt = input.occurredAt;
        project.tasks = project.tasks.map((task) =>
          task.milestoneId === existing.id && task.deletedAt === null
            ? {
                ...task,
                deletedAt: input.occurredAt,
                updatedAt: input.occurredAt,
              }
            : task,
        );
        continue;
      }

      Object.assign(existing, {
        title: milestone.title,
        objective: milestone.objective,
        startDate: milestone.startDate,
        deadlineDate: milestone.deadlineDate,
        expectedDurationDays: milestone.expectedDurationDays,
        updatedAt: input.occurredAt,
      });
      project.tasks = project.tasks.map((task) =>
        task.milestoneId === existing.id
          ? { ...task, milestoneTitle: milestone.title }
          : task,
      );
    }

    for (const task of input.tasks) {
      if (task.operation === "delete") {
        const existing = project.tasks.find(
          (current) => current.id === task.taskId,
        );

        if (!existing) {
          return false;
        }

        if (existing.deletedAt === null) {
          existing.deletedAt = input.occurredAt;
          existing.updatedAt = input.occurredAt;
        }
        continue;
      }

      const milestone = task.milestoneId
        ? project.milestones.find(
            (current) =>
              current.id === task.milestoneId && current.deletedAt === null,
          ) ?? null
        : null;

      if (task.milestoneId && !milestone) {
        return false;
      }

      const existing =
        task.operation === "update"
          ? project.tasks.find(
              (current) => current.id === task.taskId && current.deletedAt === null,
            )
          : null;

      if (task.operation === "update" && !existing) {
        return false;
      }

      const nextTask: ProjectTaskRecord = {
        ...(existing ?? {
          id: task.taskId,
          userId: input.userId,
          projectId: project.id,
          projectTitle: project.title,
          status: "todo" as const,
          sortOrder: nextTaskSortOrder(project, task.milestoneId),
          createdAt: input.occurredAt,
          completedAt: null,
          deletedAt: null,
        }),
        milestoneId: milestone?.id ?? null,
        milestoneTitle: milestone?.title ?? "",
        title: task.title,
        description: task.description,
        startDate: task.startDate,
        deadlineDate: task.deadlineDate,
        estimatedDurationMinutes: task.estimatedDurationMinutes,
        updatedAt: input.occurredAt,
      };

      project.tasks = [
        ...project.tasks.filter((current) => current.id !== task.taskId),
        nextTask,
      ];
    }

    syncMilestoneTasks(project);
    return true;
  }

  async createProjectTreeTemplate(input: CreateProjectTreeTemplateInput) {
    if (
      !input.project.projectId ||
      this.projects.some((project) => project.id === input.project.projectId)
    ) {
      return null;
    }

    const milestoneIds = new Set<string>();
    const taskIds = new Set<string>();

    for (const milestone of input.milestones) {
      if (!milestone.milestoneId || milestoneIds.has(milestone.milestoneId)) {
        return null;
      }

      milestoneIds.add(milestone.milestoneId);
    }

    for (const task of input.tasks) {
      if (
        !task.taskId ||
        taskIds.has(task.taskId) ||
        (task.milestoneId && !milestoneIds.has(task.milestoneId))
      ) {
        return null;
      }

      taskIds.add(task.taskId);
    }

    const milestones = input.milestones.map((milestone, index) => ({
      id: milestone.milestoneId,
      userId: input.userId,
      projectId: input.project.projectId,
      title: milestone.title,
      objective: milestone.objective,
      sortOrder: index,
      startDate: milestone.startDate,
      deadlineDate: milestone.deadlineDate,
      expectedDurationDays: milestone.expectedDurationDays,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      deletedAt: null,
      tasks: [],
    }));
    const milestoneById = new Map(
      milestones.map((milestone) => [milestone.id, milestone]),
    );
    const taskSortOrders = new Map<string, number>();
    const tasks = input.tasks.map((task) => {
      const milestone = task.milestoneId
        ? milestoneById.get(task.milestoneId) ?? null
        : null;
      const groupKey = task.milestoneId ?? "";
      const sortOrder = taskSortOrders.get(groupKey) ?? 0;

      taskSortOrders.set(groupKey, sortOrder + 1);

      return {
        id: task.taskId,
        userId: input.userId,
        projectId: input.project.projectId,
        projectTitle: input.project.title,
        milestoneId: milestone?.id ?? null,
        milestoneTitle: milestone?.title ?? "",
        title: task.title,
        description: task.description,
        status: "todo" as const,
        startDate: task.startDate,
        deadlineDate: task.deadlineDate,
        estimatedDurationMinutes: task.estimatedDurationMinutes,
        sortOrder,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
        completedAt: null,
        deletedAt: null,
      };
    });
    const project: ProjectRecord = {
      id: input.project.projectId,
      userId: input.userId,
      title: input.project.title,
      objective: input.project.objective,
      startDate: input.project.startDate,
      deadlineDate: input.project.deadlineDate,
      expectedDurationDays: input.project.expectedDurationDays,
      sidebarPinOrder: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      deletedAt: null,
      tasks,
      milestones,
    };

    syncMilestoneTasks(project);
    this.projects.push(project);
    return project.id;
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
      task.milestoneId === milestone.id && task.deletedAt === null
        ? {
            ...task,
            deletedAt: input.occurredAt,
            updatedAt: input.occurredAt,
          }
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

function nextMilestoneSortOrder(project: ProjectRecord) {
  return (
    Math.max(
      -1,
      ...project.milestones
        .filter((milestone) => milestone.deletedAt === null)
        .map((milestone) => milestone.sortOrder),
    ) + 1
  );
}

function nextTaskSortOrder(
  project: ProjectRecord,
  milestoneId: string | null,
) {
  return (
    Math.max(
      -1,
      ...project.tasks
        .filter(
          (task) =>
            task.deletedAt === null &&
            (task.milestoneId ?? null) === (milestoneId ?? null),
        )
        .map((task) => task.sortOrder),
    ) + 1
  );
}
