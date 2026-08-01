import { fallbackRoutineScheduledTime } from "./routine-reminder-schedule.ts";

export type RoutineRuleType =
  | "once"
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
  groupId: string | null;
  groupName: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  rule: RoutineRuleRecord;
};

export type RoutineGroupRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type RoutineInstanceRecord = {
  id: string;
  userId: string;
  routineId: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  remindAt: Date | null;
  remindedAt: Date | null;
  movedAt: Date | null;
  movedFromDate: string | null;
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
  groupId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationMinutes: number | null;
  rule: RoutineRuleInput;
  occurredAt: Date;
};

export type SaveRoutineGroupInput = {
  userId: string;
  groupId?: string;
  name: string;
  description: string | null;
  occurredAt: Date;
};

export type RoutineRepository = {
  listRoutineGroups(userId: string): Promise<RoutineGroupRecord[]>;
  listRoutines(userId: string): Promise<RoutineRecord[]>;
  listActiveRoutines(userId: string): Promise<RoutineRecord[]>;
  listActiveRoutinesForReminders(): Promise<RoutineRecord[]>;
  createRoutineGroup(input: SaveRoutineGroupInput): Promise<RoutineGroupRecord>;
  updateRoutineGroup(
    input: SaveRoutineGroupInput & { groupId: string },
  ): Promise<RoutineGroupRecord | null>;
  deleteRoutineGroup(input: {
    userId: string;
    groupId: string;
    occurredAt: Date;
  }): Promise<boolean>;
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
    remindAt: Date | null;
    occurredAt: Date;
  }): Promise<RoutineInstanceRecord | null>;
  listPendingRoutineInstancesForReminderWindow(input: {
    occurredAt: Date;
    windowMinutes: number;
  }): Promise<RoutineInstanceRecord[]>;
  markRoutineInstanceReminded(input: {
    userId: string;
    instanceId: string;
    remindedAt: Date;
  }): Promise<RoutineInstanceRecord | null>;
  listRoutineInstancesForDate(
    userId: string,
    scheduledDate: string,
  ): Promise<RoutineInstanceRecord[]>;
  listRoutineInstances(userId: string): Promise<RoutineInstanceRecord[]>;
  deleteFuturePendingRoutineInstances(input: {
    userId: string;
    routineId: string;
    fromDate: string;
  }): Promise<number>;
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
  private groups: RoutineGroupRecord[] = [];
  private routines: RoutineRecord[] = [];
  private instances: RoutineInstanceRecord[] = [];

  constructor(seed?: {
    groups?: RoutineGroupRecord[];
    routines?: RoutineRecord[];
    instances?: RoutineInstanceRecord[];
  }) {
    this.groups = seed?.groups ?? [];
    this.routines = seed?.routines ?? [];
    this.instances = seed?.instances ?? [];
  }

  async listRoutineGroups(userId: string) {
    return this.groups.filter(
      (group) => group.userId === userId && group.deletedAt === null,
    );
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
      (routine) => routine.deletedAt === null,
    );
  }

  async createRoutineGroup(input: SaveRoutineGroupInput) {
    const group: RoutineGroupRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      name: input.name,
      description: input.description,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      deletedAt: null,
    };

    this.groups.push(group);

    return group;
  }

  async updateRoutineGroup(input: SaveRoutineGroupInput & { groupId: string }) {
    const group = this.groups.find(
      (current) =>
        current.userId === input.userId && current.id === input.groupId,
    );

    if (!group || group.deletedAt !== null) {
      return null;
    }

    group.name = input.name;
    group.description = input.description;
    group.updatedAt = input.occurredAt;

    this.routines
      .filter((routine) => routine.groupId === group.id)
      .forEach((routine) => {
        routine.groupName = group.name;
      });

    return group;
  }

  async deleteRoutineGroup(input: {
    userId: string;
    groupId: string;
    occurredAt: Date;
  }) {
    const group = this.groups.find(
      (current) =>
        current.userId === input.userId && current.id === input.groupId,
    );

    if (!group || group.deletedAt !== null) {
      return false;
    }

    group.deletedAt = input.occurredAt;
    group.updatedAt = input.occurredAt;

    this.routines
      .filter((routine) => routine.groupId === group.id)
      .forEach((routine) => {
        routine.groupId = null;
        routine.groupName = null;
        routine.updatedAt = input.occurredAt;
      });

    return true;
  }

  async createRoutine(input: SaveRoutineInput) {
    const group = input.groupId
      ? this.groups.find(
          (current) =>
            current.userId === input.userId &&
            current.id === input.groupId &&
            current.deletedAt === null,
        ) ?? null
      : null;
    const routine: RoutineRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      groupId: group?.id ?? null,
      groupName: group?.name ?? null,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
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
    routine.estimatedDurationMinutes = input.estimatedDurationMinutes;
    const group = input.groupId
      ? this.groups.find(
          (current) =>
            current.userId === input.userId &&
            current.id === input.groupId &&
            current.deletedAt === null,
        ) ?? null
      : null;

    routine.groupId = group?.id ?? null;
    routine.groupName = group?.name ?? null;
    routine.startDate = input.startDate;
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
    remindAt: Date | null;
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
        (instance.scheduledTime === input.scheduledTime ||
          (input.scheduledTime === fallbackRoutineScheduledTime &&
            instance.scheduledTime === null)),
    );

    if (existing) {
      if (!existing.remindAt && input.remindAt && existing.status === "pending") {
        existing.remindAt = input.remindAt;
        existing.updatedAt = input.occurredAt;
      }

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
      remindAt: input.remindAt,
      remindedAt: null,
      movedAt: null,
      movedFromDate: null,
      status: "pending",
      completedAt: null,
      skippedAt: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.instances.push(instance);

    return instance;
  }

  async listPendingRoutineInstancesForReminderWindow(input: {
    occurredAt: Date;
    windowMinutes: number;
  }) {
    const minRemindAt = new Date(
      input.occurredAt.getTime() - input.windowMinutes * 60 * 1000,
    );
    const maxRemindAt = new Date(
      input.occurredAt.getTime() + input.windowMinutes * 60 * 1000,
    );
    const activeRoutineIds = new Set(
      this.routines
        .filter((routine) => routine.deletedAt === null)
        .map((routine) => routine.id),
    );

    return this.instances.filter(
      (instance) =>
        activeRoutineIds.has(instance.routineId) &&
        instance.status === "pending" &&
        instance.remindAt !== null &&
        instance.remindedAt === null &&
        instance.remindAt <= maxRemindAt &&
        instance.remindAt >= minRemindAt,
    );
  }

  async markRoutineInstanceReminded(input: {
    userId: string;
    instanceId: string;
    remindedAt: Date;
  }) {
    const instance = this.instances.find(
      (current) =>
        current.userId === input.userId && current.id === input.instanceId,
    );

    if (!instance || instance.status !== "pending") {
      return null;
    }

    instance.remindedAt = input.remindedAt;
    instance.updatedAt = input.remindedAt;

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

  async listRoutineInstances(userId: string) {
    const activeRoutineIds = new Set(
      this.routines
        .filter(
          (routine) => routine.userId === userId && routine.deletedAt === null,
        )
        .map((routine) => routine.id),
    );

    return this.instances
      .filter(
        (instance) =>
          instance.userId === userId && activeRoutineIds.has(instance.routineId),
      )
      .sort(compareRoutineInstances);
  }

  async deleteFuturePendingRoutineInstances(input: {
    userId: string;
    routineId: string;
    fromDate: string;
  }) {
    const beforeLength = this.instances.length;

    this.instances = this.instances.filter(
      (instance) =>
        !(
          instance.userId === input.userId &&
          instance.routineId === input.routineId &&
          instance.scheduledDate >= input.fromDate &&
          instance.status === "pending" &&
          instance.movedAt === null &&
          instance.movedFromDate === null
        ),
    );

    return beforeLength - this.instances.length;
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

function compareRoutineInstances(
  left: RoutineInstanceRecord,
  right: RoutineInstanceRecord,
) {
  return (
    left.scheduledDate.localeCompare(right.scheduledDate) ||
    timeSortValue(left.scheduledTime) - timeSortValue(right.scheduledTime) ||
    left.title.localeCompare(right.title) ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

function timeSortValue(time: string | null) {
  if (!time) {
    return Number.POSITIVE_INFINITY;
  }

  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}
