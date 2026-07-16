import type {
  ProjectPinResult,
  ProjectRecord,
  ProjectRepository,
  ProjectTaskRecord,
  ProjectTaskStatus,
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository-types.ts";
import {
  cloneProject,
  cloneTask,
  compareDashboardTasks,
  normalizeProjectForStorage,
  syncMilestoneTasks,
} from "./in-memory-project-records.ts";

export class InMemoryProjectRepository implements ProjectRepository {
  private projects: ProjectRecord[];

  constructor(seed?: { projects?: ProjectRecord[] }) {
    this.projects = (seed?.projects ?? []).map(normalizeProjectForStorage);
  }

  async listProjects(userId: string) {
    return this.projects
      .filter((project) => project.userId === userId && project.status !== "archived")
      .map(cloneProject);
  }

  async listDashboardTasks(userId: string) {
    return this.projects
      .filter((project) => project.userId === userId && project.status === "active")
      .flatMap((project) =>
        project.tasks.filter((task) => {
          if (!task.milestoneId) {
            return true;
          }

          return project.milestones.some(
            (milestone) =>
              milestone.id === task.milestoneId &&
              milestone.status === "active",
          );
        }),
      )
      .filter((task) => task.status !== "archived" && task.status !== "done")
      .sort(compareDashboardTasks)
      .slice(0, 8)
      .map(cloneTask);
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
        importanceReason: input.importanceReason,
        priority: input.priority,
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
      importanceReason: input.importanceReason,
      status: "active",
      priority: input.priority,
      startDate: input.startDate,
      deadlineDate: input.deadlineDate,
      expectedDurationDays: input.expectedDurationDays,
      sidebarPinOrder: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      archivedAt: null,
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
      status: "active",
      sortOrder: project.milestones.length,
      startDate: input.startDate,
      deadlineDate: input.deadlineDate,
      expectedDurationDays: input.expectedDurationDays,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      archivedAt: null,
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
      status: input.status,
      priority: input.priority,
      scheduledDate: input.scheduledDate,
      startDate: input.startDate,
      deadlineDate: input.deadlineDate,
      updatedAt: input.occurredAt,
      completedAt: input.status === "done" ? input.occurredAt : null,
      skippedAt: input.status === "skipped" ? input.occurredAt : null,
      blockedAt: input.status === "blocked" ? input.occurredAt : null,
      archivedAt: input.status === "archived" ? input.occurredAt : null,
    };

    target.project.tasks = [
      ...target.project.tasks.filter((task) => task.id !== taskId),
      nextTask,
    ];
    syncMilestoneTasks(target.project);
    return true;
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

    project.status = "archived";
    project.sidebarPinOrder = null;
    project.archivedAt = input.occurredAt;
    project.updatedAt = input.occurredAt;
    return true;
  }

  async pinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }): Promise<ProjectPinResult> {
    const project = this.findProject(input.userId, input.projectId);

    if (!project || project.status !== "active") {
      return "not_found";
    }

    if (project.sidebarPinOrder) {
      return "pinned";
    }

    const usedSlots = new Set(
      this.projects
        .filter(
          (current) =>
            current.userId === input.userId &&
            current.status !== "archived" &&
            current.sidebarPinOrder !== null,
        )
        .map((current) => current.sidebarPinOrder),
    );
    const slot = [1, 2, 3].find((candidate) => !usedSlots.has(candidate));

    if (!slot) {
      return "limit_reached";
    }

    project.sidebarPinOrder = slot;
    project.updatedAt = input.occurredAt;
    return "pinned";
  }

  async unpinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }) {
    const project = this.findProject(input.userId, input.projectId);

    if (!project || project.status === "archived") {
      return false;
    }

    if (project.sidebarPinOrder !== null) {
      project.sidebarPinOrder = null;
      project.updatedAt = input.occurredAt;
    }

    return true;
  }

  async archiveMilestone(input: {
    userId: string;
    milestoneId: string;
    occurredAt: Date;
  }) {
    const project = this.projects
      .filter((current) => current.userId === input.userId)
      .find((current) =>
        current.milestones.some(
          (milestone) => milestone.id === input.milestoneId,
        ),
      );
    const milestone = project?.milestones.find(
      (current) => current.id === input.milestoneId,
    );

    if (!project || !milestone) {
      return false;
    }

    milestone.status = "archived";
    milestone.archivedAt = input.occurredAt;
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

    task.status = "archived";
    task.archivedAt = input.occurredAt;
    task.updatedAt = input.occurredAt;
    this.projects
      .filter((project) => project.userId === input.userId)
      .forEach(syncMilestoneTasks);
    return true;
  }

  async updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: Exclude<ProjectTaskStatus, "archived">;
    occurredAt: Date;
  }) {
    const task = this.findTask(input.userId, input.taskId);

    if (!task) {
      return false;
    }

    task.status = input.status;
    task.completedAt = input.status === "done" ? input.occurredAt : null;
    task.skippedAt = input.status === "skipped" ? input.occurredAt : null;
    task.blockedAt = input.status === "blocked" ? input.occurredAt : null;
    task.updatedAt = input.occurredAt;
    this.projects
      .filter((project) => project.userId === input.userId)
      .forEach(syncMilestoneTasks);
    return true;
  }

  private findProject(userId: string, projectId: string) {
    return this.projects.find(
      (project) => project.userId === userId && project.id === projectId,
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
      (current) => current.id === input.milestoneId,
    );

    return milestone ? { project, milestone } : null;
  }

  private findTask(userId: string, taskId: string) {
    return this.projects
      .filter((project) => project.userId === userId)
      .flatMap((project) => project.tasks)
      .find((task) => task.id === taskId);
  }
}
