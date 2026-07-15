import type {
  ProjectMilestoneRecord,
  ProjectRecord,
  ProjectRepository,
  ProjectTaskRecord,
  ProjectTaskStatus,
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository-types.ts";

export class InMemoryProjectRepository implements ProjectRepository {
  private projects: ProjectRecord[];

  constructor(seed?: { projects?: ProjectRecord[] }) {
    this.projects = seed?.projects ?? [];
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
        project.milestones
          .filter((milestone) => milestone.status === "active")
          .flatMap((milestone) => milestone.tasks),
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
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      completedAt: null,
      archivedAt: null,
      milestones: [
        createDefaultMilestone(input.userId, projectId, input.occurredAt),
      ],
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
    const target = this.findProjectAndMilestone(input);

    if (!target) {
      return false;
    }

    const existing = input.taskId
      ? target.milestone.tasks.find((task) => task.id === input.taskId)
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
        milestoneId: target.milestone.id,
        milestoneTitle: target.milestone.title,
        sortOrder: target.milestone.tasks.length,
        createdAt: input.occurredAt,
      }),
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

    target.milestone.tasks = [
      ...target.milestone.tasks.filter((task) => task.id !== taskId),
      nextTask,
    ];
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
    project.archivedAt = input.occurredAt;
    project.updatedAt = input.occurredAt;
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
    return true;
  }

  private findProject(userId: string, projectId: string) {
    return this.projects.find(
      (project) => project.userId === userId && project.id === projectId,
    );
  }

  private findProjectAndMilestone(input: {
    userId: string;
    projectId: string;
    milestoneId: string;
  }) {
    const project = this.findProject(input.userId, input.projectId);
    const milestone = project?.milestones.find(
      (current) => current.id === input.milestoneId,
    );

    return project && milestone ? { project, milestone } : null;
  }

  private findTask(userId: string, taskId: string) {
    return this.projects
      .filter((project) => project.userId === userId)
      .flatMap((project) => project.milestones)
      .flatMap((milestone) => milestone.tasks)
      .find((task) => task.id === taskId);
  }
}

export function createDefaultMilestone(
  userId: string,
  projectId: string,
  occurredAt: Date,
): ProjectMilestoneRecord {
  return {
    id: crypto.randomUUID(),
    userId,
    projectId,
    title: "Completion",
    objective: "",
    status: "active",
    sortOrder: 0,
    startDate: occurredAt.toISOString().slice(0, 10),
    deadlineDate: null,
    expectedDurationDays: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    completedAt: null,
    archivedAt: null,
    tasks: [],
  };
}

function cloneProject(project: ProjectRecord): ProjectRecord {
  return {
    ...project,
    milestones: project.milestones.map((milestone) => ({
      ...milestone,
      tasks: milestone.tasks.map(cloneTask),
    })),
  };
}

function cloneTask(task: ProjectTaskRecord): ProjectTaskRecord {
  return { ...task };
}

function compareDashboardTasks(
  left: ProjectTaskRecord,
  right: ProjectTaskRecord,
) {
  return (
    dateSortValue(left.deadlineDate) - dateSortValue(right.deadlineDate) ||
    dateSortValue(left.startDate) - dateSortValue(right.startDate)
  );
}

function dateSortValue(date: string | null) {
  return date ? Date.parse(date) : Number.POSITIVE_INFINITY;
}
