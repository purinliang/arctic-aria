export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type ProjectPriority = "high" | "medium" | "low";
export type ProjectTaskStatus =
  | "todo"
  | "doing"
  | "blocked"
  | "skipped"
  | "done"
  | "archived";

export type ProjectTaskRecord = {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  milestoneId: string | null;
  milestoneTitle: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  scheduledDate: string | null;
  startDate: string | null;
  deadlineDate: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  skippedAt: Date | null;
  blockedAt: Date | null;
  archivedAt: Date | null;
};

export type ProjectMilestoneRecord = {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  objective: string;
  status: ProjectStatus;
  sortOrder: number;
  startDate: string | null;
  deadlineDate: string | null;
  expectedDurationDays: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  archivedAt: Date | null;
  tasks: ProjectTaskRecord[];
};

export type ProjectRecord = {
  id: string;
  userId: string;
  title: string;
  objective: string;
  importanceReason: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  deadlineDate: string | null;
  expectedDurationDays: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  archivedAt: Date | null;
  tasks: ProjectTaskRecord[];
  milestones: ProjectMilestoneRecord[];
};

export type SaveProjectInput = {
  userId: string;
  projectId?: string;
  title: string;
  objective: string;
  importanceReason: string;
  priority: ProjectPriority;
  startDate: string;
  deadlineDate: string | null;
  expectedDurationDays: number | null;
  occurredAt: Date;
};

export type SaveMilestoneInput = {
  userId: string;
  milestoneId?: string;
  projectId: string;
  title: string;
  objective: string;
  startDate: string | null;
  deadlineDate: string | null;
  expectedDurationDays: number | null;
  occurredAt: Date;
};

export type SaveProjectTaskInput = {
  userId: string;
  taskId?: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectTaskStatus;
  scheduledDate: string | null;
  startDate: string | null;
  deadlineDate: string | null;
  occurredAt: Date;
};

export type ProjectRepository = {
  listProjects(userId: string): Promise<ProjectRecord[]>;
  listDashboardTasks(userId: string, today: string): Promise<ProjectTaskRecord[]>;
  saveProject(input: SaveProjectInput): Promise<string | null>;
  saveMilestone(input: SaveMilestoneInput): Promise<string | null>;
  saveTask(input: SaveProjectTaskInput): Promise<boolean>;
  archiveProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  archiveMilestone(input: {
    userId: string;
    milestoneId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  archiveTask(input: {
    userId: string;
    taskId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: Exclude<ProjectTaskStatus, "archived">;
    occurredAt: Date;
  }): Promise<boolean>;
};
