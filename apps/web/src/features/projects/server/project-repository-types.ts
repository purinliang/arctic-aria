export type ProjectTaskStatus = "todo" | "done";

export type ProjectPinResult = "pinned" | "limit_reached" | "not_found";

export const projectTaskDailySelectionLimit = 6;
export const projectTaskAutoScheduleHorizonDays = 5;

export type ProjectTaskRecord = {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  milestoneId: string | null;
  milestoneTitle: string;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  startDate: string | null;
  deadlineDate: string | null;
  estimatedDurationMinutes: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  deletedAt: Date | null;
};

export type ProjectMilestoneRecord = {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  objective: string | null;
  sortOrder: number;
  startDate: string | null;
  deadlineDate: string | null;
  expectedDurationDays: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  deletedAt: Date | null;
  tasks: ProjectTaskRecord[];
};

export type ProjectRecord = {
  id: string;
  userId: string;
  title: string;
  objective: string | null;
  startDate: string;
  deadlineDate: string | null;
  expectedDurationDays: number | null;
  sidebarPinOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  deletedAt: Date | null;
  tasks: ProjectTaskRecord[];
  milestones: ProjectMilestoneRecord[];
};

export type SaveProjectInput = {
  userId: string;
  projectId?: string;
  title: string;
  objective: string | null;
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
  objective: string | null;
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
  description: string | null;
  startDate: string | null;
  deadlineDate: string | null;
  estimatedDurationMinutes: number | null;
  occurredAt: Date;
};

export type ProjectTreeTemplateOperation = "create" | "update" | "delete";

export type ApplyProjectTreeTemplateInput = {
  userId: string;
  project: Omit<SaveProjectInput, "userId" | "occurredAt"> & {
    projectId: string;
  };
  milestones: ProjectTreeTemplateMilestoneInput[];
  tasks: ProjectTreeTemplateTaskInput[];
  occurredAt: Date;
};

export type CreateProjectTreeTemplateInput = {
  userId: string;
  project: Omit<SaveProjectInput, "userId" | "projectId" | "occurredAt"> & {
    projectId: string;
  };
  milestones: ProjectTreeTemplateCreateMilestoneInput[];
  tasks: ProjectTreeTemplateCreateTaskInput[];
  occurredAt: Date;
};

export type ProjectTreeTemplateMilestoneInput =
  | ({
      operation: "create" | "update";
      milestoneId: string;
    } & Omit<SaveMilestoneInput, "userId" | "projectId" | "occurredAt">)
  | {
      operation: "delete";
      milestoneId: string;
    };

export type ProjectTreeTemplateTaskInput =
  | ({
      operation: "create" | "update";
      taskId: string;
    } & Omit<SaveProjectTaskInput, "userId" | "projectId" | "occurredAt">)
  | {
      operation: "delete";
      taskId: string;
    };

export type ProjectTreeTemplateCreateMilestoneInput = {
  milestoneId: string;
} & Omit<
  SaveMilestoneInput,
  "userId" | "projectId" | "milestoneId" | "occurredAt"
>;

export type ProjectTreeTemplateCreateTaskInput = {
  taskId: string;
  milestoneId: string | null;
} & Omit<
  SaveProjectTaskInput,
  "userId" | "projectId" | "taskId" | "occurredAt" | "milestoneId"
>;

export type ProjectRepository = {
  listProjects(userId: string): Promise<ProjectRecord[]>;
  listDashboardTasks(
    userId: string,
    today: string,
    occurredAt: Date,
  ): Promise<ProjectTaskRecord[]>;
  saveProject(input: SaveProjectInput): Promise<string | null>;
  saveMilestone(input: SaveMilestoneInput): Promise<string | null>;
  saveTask(input: SaveProjectTaskInput): Promise<boolean>;
  applyProjectTreeTemplate(
    input: ApplyProjectTreeTemplateInput,
  ): Promise<boolean>;
  createProjectTreeTemplate(
    input: CreateProjectTreeTemplateInput,
  ): Promise<string | null>;
  archiveProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  pinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }): Promise<ProjectPinResult>;
  unpinProject(input: {
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
    status: ProjectTaskStatus;
    occurredAt: Date;
  }): Promise<boolean>;
};
