export type TaskStatus =
  | "todo"
  | "doing"
  | "blocked"
  | "skipped"
  | "done"
  | "archived";

export type TaskPriority = "high" | "medium" | "low";

export type TaskRecord = {
  id: string;
  userId: string;
  planId: string | null;
  planTitle: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight: number;
  completedWeight: number;
  deadlineAt: Date | null;
  scheduledDate: string | null;
  sortOrder: number;
  completedAt: Date | null;
  skippedAt: Date | null;
  blockedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  children: TaskRecord[];
};

export type TaskChildInput = {
  id?: string;
  title: string;
  description: string;
  weight: number;
  completedWeight: number;
  status: TaskStatus;
};

export type SaveTaskInput = {
  userId: string;
  taskId?: string;
  title: string;
  description: string;
  planTitle: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  weight: number;
  completedWeight: number;
  deadlineAt: Date | null;
  scheduledDate: string | null;
  children: TaskChildInput[];
  occurredAt: Date;
};

export type TaskRepository = {
  listTaskTree(userId: string): Promise<TaskRecord[]>;
  listDashboardTaskTree(userId: string, today: string): Promise<TaskRecord[]>;
  saveTask(input: SaveTaskInput): Promise<boolean>;
  deleteTask(input: {
    userId: string;
    taskId: string;
  }): Promise<boolean>;
  archiveTask(input: {
    userId: string;
    taskId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: Exclude<TaskStatus, "archived">;
    occurredAt: Date;
  }): Promise<boolean>;
  updateTaskProgress(input: {
    userId: string;
    taskId: string;
    weight: number;
    completedWeight: number;
    occurredAt: Date;
  }): Promise<boolean>;
};

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: TaskRecord[] = [];

  constructor(seed?: { tasks?: TaskRecord[] }) {
    this.tasks = seed?.tasks ?? [];
  }

  async listTaskTree(userId: string) {
    return buildTree(
      this.tasks.filter(
        (task) => task.userId === userId && task.status !== "archived",
      ),
    );
  }

  async listDashboardTaskTree(userId: string, today: string) {
    const topLevelTasks = (await this.listTaskTree(userId))
      .filter((task) => task.status !== "done")
      .sort((left, right) => taskRank(left, today) - taskRank(right, today));

    return topLevelTasks.slice(0, 8);
  }

  async saveTask(input: SaveTaskInput) {
    const planId = input.planTitle ? `plan:${input.planTitle}` : null;
    const existing = input.taskId
      ? this.tasks.find(
          (task) => task.userId === input.userId && task.id === input.taskId,
        )
      : null;
    const taskId = existing?.id ?? crypto.randomUUID();
    const nextTask: TaskRecord = {
      ...(existing ?? {
        id: taskId,
        userId: input.userId,
        parentTaskId: null,
        sortOrder: 0,
        createdAt: input.occurredAt,
        children: [],
      }),
      planId,
      planTitle: input.planTitle,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      weight: input.weight,
      completedWeight: input.completedWeight,
      deadlineAt: input.deadlineAt,
      scheduledDate: input.scheduledDate,
      completedAt: input.status === "done" ? input.occurredAt : null,
      skippedAt: input.status === "skipped" ? input.occurredAt : null,
      blockedAt: input.status === "blocked" ? input.occurredAt : null,
      archivedAt: input.status === "archived" ? input.occurredAt : null,
      updatedAt: input.occurredAt,
      children: [],
    };

    this.tasks = this.tasks.filter(
      (task) => task.id !== taskId && task.parentTaskId !== taskId,
    );
    this.tasks.push(nextTask);
    input.children.forEach((child, index) => {
      this.tasks.push({
        id: child.id ?? crypto.randomUUID(),
        userId: input.userId,
        planId,
        planTitle: input.planTitle,
        parentTaskId: taskId,
        title: child.title,
        description: child.description,
        status: child.status,
        priority: input.priority,
        weight: child.weight,
        completedWeight: child.completedWeight,
        deadlineAt: null,
        scheduledDate: input.scheduledDate,
        sortOrder: index,
        completedAt: child.status === "done" ? input.occurredAt : null,
        skippedAt: null,
        blockedAt: null,
        archivedAt: null,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
        children: [],
      });
    });

    return true;
  }

  async deleteTask(input: { userId: string; taskId: string }) {
    const before = this.tasks.length;

    this.tasks = this.tasks.filter(
      (task) =>
        task.userId !== input.userId ||
        (task.id !== input.taskId && task.parentTaskId !== input.taskId),
    );

    return this.tasks.length < before;
  }

  async archiveTask(input: {
    userId: string;
    taskId: string;
    occurredAt: Date;
  }) {
    return this.setStatus(input.userId, input.taskId, "archived", input.occurredAt);
  }

  async updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: Exclude<TaskStatus, "archived">;
    occurredAt: Date;
  }) {
    return this.setStatus(
      input.userId,
      input.taskId,
      input.status,
      input.occurredAt,
    );
  }

  async updateTaskProgress(input: {
    userId: string;
    taskId: string;
    weight: number;
    completedWeight: number;
    occurredAt: Date;
  }) {
    const task = this.tasks.find(
      (current) => current.userId === input.userId && current.id === input.taskId,
    );

    if (!task) {
      return false;
    }

    task.weight = input.weight;
    task.completedWeight = input.completedWeight;
    task.status = input.completedWeight >= input.weight ? "done" : "doing";
    task.completedAt = task.status === "done" ? input.occurredAt : null;
    task.updatedAt = input.occurredAt;
    this.refreshParentProgress(task.parentTaskId, input.occurredAt);

    return true;
  }

  private setStatus(
    userId: string,
    taskId: string,
    status: TaskStatus,
    occurredAt: Date,
  ) {
    const task = this.tasks.find(
      (current) => current.userId === userId && current.id === taskId,
    );

    if (!task) {
      return false;
    }

    task.status = status;
    task.completedWeight = status === "done" ? task.weight : task.completedWeight;
    task.completedAt = status === "done" ? occurredAt : null;
    task.skippedAt = status === "skipped" ? occurredAt : null;
    task.blockedAt = status === "blocked" ? occurredAt : null;
    task.archivedAt = status === "archived" ? occurredAt : null;
    task.updatedAt = occurredAt;
    this.refreshParentProgress(task.parentTaskId, occurredAt);

    return true;
  }

  private refreshParentProgress(parentTaskId: string | null, occurredAt: Date) {
    if (!parentTaskId) {
      return;
    }

    const parent = this.tasks.find((task) => task.id === parentTaskId);
    const children = this.tasks.filter((task) => task.parentTaskId === parentTaskId);

    if (!parent || children.length === 0) {
      return;
    }

    parent.weight = children.reduce((sum, child) => sum + child.weight, 0);
    parent.completedWeight = children.reduce(
      (sum, child) => sum + child.completedWeight,
      0,
    );
    parent.status =
      parent.completedWeight >= parent.weight
        ? "done"
        : parent.completedWeight > 0
          ? "doing"
          : parent.status === "done"
            ? "doing"
            : parent.status;
    parent.updatedAt = occurredAt;
  }
}

export function buildTree(tasks: TaskRecord[]) {
  const byId = new Map<string, TaskRecord>(
    tasks.map((task) => [task.id, { ...task, children: [] }]),
  );
  const roots: TaskRecord[] = [];

  byId.forEach((task) => {
    if (task.parentTaskId && byId.has(task.parentTaskId)) {
      byId.get(task.parentTaskId)?.children.push(task);
      return;
    }

    roots.push(task);
  });

  return roots;
}

function taskRank(task: TaskRecord, today: string) {
  if (task.scheduledDate === today) {
    return 0;
  }

  if (task.deadlineAt && task.deadlineAt.toISOString().slice(0, 10) <= today) {
    return 1;
  }

  if (task.priority === "high") {
    return 2;
  }

  if (task.status === "doing") {
    return 3;
  }

  return 4;
}
