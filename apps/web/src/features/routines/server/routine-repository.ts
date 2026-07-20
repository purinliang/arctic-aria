export type RoutineRuleType =
  | "daily"
  | "weekly"
  | "bi_weekly"
  | "monthly_by_date"
  | "day_interval";
export type RoutineInstanceStatus = "pending" | "completed" | "skipped";

export type RoutineRuleRecord = {
  id: string;
  routineId: string;
  ruleType: RoutineRuleType;
  intervalValue: number | null;
  weekdays: number[] | null;
  dayOfMonth: number | null;
  preferredTime: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RoutineRecord = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  firstStartDate: string;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  rule: RoutineRuleRecord;
};

export type RoutineInstanceRecord = {
  id: string;
  userId: string;
  routineId: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  status: RoutineInstanceStatus;
  completedAt: Date | null;
  skippedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoutineRuleInput = {
  ruleType: RoutineRuleType;
  intervalValue: number | null;
  weekdays: number[] | null;
  dayOfMonth: number | null;
  preferredTime: string | null;
  timezone: string;
};

export type SaveRoutineInput = {
  userId: string;
  routineId?: string;
  title: string;
  description: string | null;
  firstStartDate: string;
  endDate: string | null;
  rule: RoutineRuleInput;
  occurredAt: Date;
};

export type RoutineRepository = {
  listRoutines(userId: string): Promise<RoutineRecord[]>;
  listActiveRoutines(userId: string): Promise<RoutineRecord[]>;
  listActiveRoutinesForReminders(): Promise<RoutineRecord[]>;
  createRoutine(input: SaveRoutineInput): Promise<RoutineRecord>;
  updateRoutine(input: SaveRoutineInput & { routineId: string }): Promise<RoutineRecord | null>;
  deleteRoutine(input: {
    userId: string;
    routineId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  ensureRoutineInstance(input: {
    userId: string;
    routineId: string;
    scheduledDate: string;
    scheduledTime: string | null;
    occurredAt: Date;
  }): Promise<RoutineInstanceRecord | null>;
  listRoutineInstancesForDate(
    userId: string,
    scheduledDate: string,
  ): Promise<RoutineInstanceRecord[]>;
  completeRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }): Promise<RoutineInstanceRecord | null>;
  skipRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }): Promise<RoutineInstanceRecord | null>;
  reopenRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }): Promise<RoutineInstanceRecord | null>;
};

export class InMemoryRoutineRepository implements RoutineRepository {
  private routines: RoutineRecord[] = [];
  private instances: RoutineInstanceRecord[] = [];

  constructor(seed?: {
    routines?: RoutineRecord[];
    instances?: RoutineInstanceRecord[];
  }) {
    this.routines = seed?.routines ?? [];
    this.instances = seed?.instances ?? [];
  }

  async listRoutines(userId: string) {
    return this.routines.filter(
      (routine) => routine.userId === userId && routine.deletedAt === null,
    );
  }

  async listActiveRoutines(userId: string) {
    return this.routines.filter(
      (routine) => routine.userId === userId && routine.deletedAt === null,
    );
  }

  async listActiveRoutinesForReminders() {
    return this.routines.filter(
      (routine) =>
        routine.deletedAt === null && routine.rule.preferredTime !== null,
    );
  }

  async createRoutine(input: SaveRoutineInput) {
    const routine: RoutineRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      firstStartDate: input.firstStartDate,
      endDate: input.endDate,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      deletedAt: null,
      rule: {
        id: crypto.randomUUID(),
        routineId: "",
        ...input.rule,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
      },
    };

    routine.rule.routineId = routine.id;
    this.routines.push(routine);

    return routine;
  }

  async updateRoutine(input: SaveRoutineInput & { routineId: string }) {
    const routine = this.routines.find(
      (current) =>
        current.userId === input.userId && current.id === input.routineId,
    );

    if (!routine || routine.deletedAt !== null) {
      return null;
    }

    routine.title = input.title;
    routine.description = input.description;
    routine.firstStartDate = input.firstStartDate;
    routine.endDate = input.endDate;
    routine.updatedAt = input.occurredAt;
    routine.rule = {
      ...routine.rule,
      ...input.rule,
      updatedAt: input.occurredAt,
    };

    return routine;
  }

  async deleteRoutine(input: {
    userId: string;
    routineId: string;
    occurredAt: Date;
  }) {
    const routine = this.routines.find(
      (current) =>
        current.userId === input.userId && current.id === input.routineId,
    );

    if (!routine || routine.deletedAt !== null) {
      return false;
    }

    routine.deletedAt = input.occurredAt;
    routine.updatedAt = input.occurredAt;

    return true;
  }

  async ensureRoutineInstance(input: {
    userId: string;
    routineId: string;
    scheduledDate: string;
    scheduledTime: string | null;
    occurredAt: Date;
  }) {
    const routine = this.routines.find(
      (current) =>
        current.userId === input.userId && current.id === input.routineId,
    );

    if (!routine || routine.deletedAt !== null) {
      return null;
    }

    const existing = this.instances.find(
      (instance) =>
        instance.routineId === input.routineId &&
        instance.scheduledDate === input.scheduledDate &&
        instance.scheduledTime === input.scheduledTime,
    );

    if (existing) {
      return existing;
    }

    const instance: RoutineInstanceRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      routineId: input.routineId,
      title: routine.title,
      description: routine.description,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      status: "pending",
      completedAt: null,
      skippedAt: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.instances.push(instance);

    return instance;
  }

  async listRoutineInstancesForDate(userId: string, scheduledDate: string) {
    const activeRoutineIds = new Set(
      this.routines
        .filter(
          (routine) => routine.userId === userId && routine.deletedAt === null,
        )
        .map((routine) => routine.id),
    );

    return this.instances.filter(
      (instance) =>
        instance.userId === userId &&
        instance.scheduledDate === scheduledDate &&
        activeRoutineIds.has(instance.routineId),
    );
  }

  async completeRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }) {
    return this.updateInstance(input.userId, input.instanceId, "completed", input.occurredAt);
  }

  async skipRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }) {
    return this.updateInstance(input.userId, input.instanceId, "skipped", input.occurredAt);
  }

  async reopenRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }) {
    return this.updateInstance(input.userId, input.instanceId, "pending", input.occurredAt);
  }

  private updateInstance(
    userId: string,
    instanceId: string,
    status: RoutineInstanceStatus,
    occurredAt: Date,
  ) {
    const instance = this.instances.find(
      (current) => current.userId === userId && current.id === instanceId,
    );

    if (!instance) {
      return null;
    }

    instance.status = status;
    instance.completedAt = status === "completed" ? occurredAt : null;
    instance.skippedAt = status === "skipped" ? occurredAt : null;
    instance.updatedAt = occurredAt;

    return instance;
  }
}
