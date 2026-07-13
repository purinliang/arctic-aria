import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import {
  buildTree,
  type SaveTaskInput,
  type TaskPriority,
  type TaskRecord,
  type TaskRepository,
  type TaskStatus,
} from "./task-repository.ts";

type TaskRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_title: string | null;
  parent_task_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight: string | number;
  completed_weight: string | number;
  deadline_at: Date | string | null;
  scheduled_date: Date | string | null;
  sort_order: number;
  completed_at: Date | string | null;
  skipped_at: Date | string | null;
  blocked_at: Date | string | null;
  archived_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const taskSelect = `
  SELECT
    tasks.id,
    tasks.user_id,
    tasks.plan_id,
    plans.title AS plan_title,
    tasks.parent_task_id,
    tasks.title,
    tasks.description,
    tasks.status,
    tasks.priority,
    tasks.weight,
    tasks.completed_weight,
    tasks.deadline_at,
    tasks.scheduled_date,
    tasks.sort_order,
    tasks.completed_at,
    tasks.skipped_at,
    tasks.blocked_at,
    tasks.archived_at,
    tasks.created_at,
    tasks.updated_at
  FROM tasks
  LEFT JOIN plans ON plans.id = tasks.plan_id
`;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value: Date | string | null) {
  return value ? toDate(value) : null;
}

function toDateString(value: Date | string | null) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function mapTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    planTitle: row.plan_title,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    weight: Number(row.weight),
    completedWeight: Number(row.completed_weight),
    deadlineAt: toNullableDate(row.deadline_at),
    scheduledDate: toDateString(row.scheduled_date),
    sortOrder: row.sort_order,
    completedAt: toNullableDate(row.completed_at),
    skippedAt: toNullableDate(row.skipped_at),
    blockedAt: toNullableDate(row.blocked_at),
    archivedAt: toNullableDate(row.archived_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    children: [],
  };
}

function taskParams(input: SaveTaskInput, planId: string | null) {
  return [
    input.userId,
    planId,
    input.title,
    input.description,
    input.status,
    input.priority,
    input.weight,
    input.completedWeight,
    input.deadlineAt,
    input.scheduledDate,
    input.occurredAt,
  ];
}

export class PostgresTaskRepository implements TaskRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  async listTaskTree(userId: string) {
    const rows = (await this.getSql().query(
      `${taskSelect}
       WHERE tasks.user_id = $1
         AND tasks.status != 'archived'
       ORDER BY tasks.parent_task_id NULLS FIRST, tasks.sort_order, tasks.created_at DESC`,
      [userId],
    )) as TaskRow[];

    return buildTree(rows.map(mapTask));
  }

  async listDashboardTaskTree(userId: string, today: string) {
    const rows = (await this.getSql().query(
      `${taskSelect}
       WHERE tasks.user_id = $1
         AND tasks.status NOT IN ('archived', 'done')
       ORDER BY
         CASE
           WHEN tasks.scheduled_date = $2::date THEN 0
           WHEN tasks.deadline_at IS NOT NULL AND tasks.deadline_at < ($2::date + interval '1 day') THEN 1
           WHEN tasks.priority = 'high' THEN 2
           WHEN tasks.status = 'doing' THEN 3
           ELSE 4
         END,
         tasks.deadline_at NULLS LAST,
         tasks.updated_at DESC`,
      [userId, today],
    )) as TaskRow[];
    const tree = buildTree(rows.map(mapTask));

    return tree.slice(0, 8);
  }

  async saveTask(input: SaveTaskInput) {
    const planId = await this.resolvePlanId(input);

    if (input.taskId) {
      const updated = await this.updateRootTask(input, planId);

      if (!updated) {
        return false;
      }

      await this.replaceChildren(input, planId, input.taskId);
      await this.refreshParentFromChildren(input.userId, input.taskId, input.occurredAt);
      return true;
    }

    const taskId = await this.createRootTask(input, planId);

    await this.replaceChildren(input, planId, taskId);
    await this.refreshParentFromChildren(input.userId, taskId, input.occurredAt);
    return true;
  }

  async deleteTask(input: { userId: string; taskId: string }) {
    const rows = (await this.getSql()`
      DELETE FROM tasks
      WHERE user_id = ${input.userId}
        AND id = ${input.taskId}
      RETURNING id
    `) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async archiveTask(input: {
    userId: string;
    taskId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql()`
      UPDATE tasks
      SET status = 'archived',
          archived_at = ${input.occurredAt},
          updated_at = ${input.occurredAt}
      WHERE user_id = ${input.userId}
        AND id = ${input.taskId}
        AND status != 'archived'
      RETURNING id
    `) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: Exclude<TaskStatus, "archived">;
    occurredAt: Date;
  }) {
    const previousRows = (await this.getSql()`
      SELECT id, parent_task_id, weight, completed_weight
      FROM tasks
      WHERE user_id = ${input.userId}
        AND id = ${input.taskId}
      LIMIT 1
    `) as Array<{
      id: string;
      parent_task_id: string | null;
      weight: string | number;
      completed_weight: string | number;
    }>;
    const previous = previousRows[0];

    if (!previous) {
      return false;
    }

    const nextCompletedWeight =
      input.status === "done" ? Number(previous.weight) : Number(previous.completed_weight);
    const rows = (await this.getSql().query(
      `
      WITH updated_task AS (
        UPDATE tasks
        SET
          status = $3::text,
          completed_weight = $4,
          completed_at = CASE WHEN $3::text = 'done' THEN $5::timestamptz ELSE NULL END,
          skipped_at = CASE WHEN $3::text = 'skipped' THEN $5::timestamptz ELSE NULL END,
          blocked_at = CASE WHEN $3::text = 'blocked' THEN $5::timestamptz ELSE NULL END,
          updated_at = $5::timestamptz
        WHERE user_id = $1
          AND id = $2
        RETURNING *
      ),
      event AS (
        INSERT INTO completion_events (
          user_id,
          target_type,
          target_id,
          event_type,
          previous_completed_weight,
          new_completed_weight,
          occurred_at,
          source
        )
        SELECT
          user_id,
          'task',
          id,
          CASE
            WHEN $3::text = 'done' THEN 'completed'
            WHEN $3::text = 'skipped' THEN 'skipped'
            ELSE 'partially_completed'
          END,
          $6,
          $4,
          $5::timestamptz,
          'web'
        FROM updated_task
        WHERE $3::text IN ('done', 'skipped')
        RETURNING id
      )
      SELECT id FROM updated_task
      `,
      [
        input.userId,
        input.taskId,
        input.status,
        nextCompletedWeight,
        input.occurredAt,
        Number(previous.completed_weight),
      ],
    )) as Array<{ id: string }>;

    if (rows.length === 0) {
      return false;
    }

    await this.refreshParentFromChildren(
      input.userId,
      previous.parent_task_id,
      input.occurredAt,
    );
    return true;
  }

  async updateTaskProgress(input: {
    userId: string;
    taskId: string;
    weight: number;
    completedWeight: number;
    occurredAt: Date;
  }) {
    const previousRows = (await this.getSql()`
      SELECT parent_task_id, completed_weight
      FROM tasks
      WHERE user_id = ${input.userId}
        AND id = ${input.taskId}
      LIMIT 1
    `) as Array<{
      parent_task_id: string | null;
      completed_weight: string | number;
    }>;
    const previous = previousRows[0];

    if (!previous) {
      return false;
    }

    const nextStatus = input.completedWeight >= input.weight ? "done" : "doing";
    const rows = (await this.getSql().query(
      `
      WITH updated_task AS (
        UPDATE tasks
        SET
          weight = $3,
          completed_weight = $4,
          status = $5,
          completed_at = CASE WHEN $5 = 'done' THEN $6::timestamptz ELSE NULL END,
          updated_at = $6::timestamptz
        WHERE user_id = $1
          AND id = $2
        RETURNING *
      ),
      event AS (
        INSERT INTO completion_events (
          user_id,
          target_type,
          target_id,
          event_type,
          previous_completed_weight,
          new_completed_weight,
          occurred_at,
          source
        )
        SELECT
          user_id,
          'task',
          id,
          CASE WHEN $5 = 'done' THEN 'completed' ELSE 'partially_completed' END,
          $7,
          $4,
          $6::timestamptz,
          'web'
        FROM updated_task
        RETURNING id
      )
      SELECT id FROM updated_task
      `,
      [
        input.userId,
        input.taskId,
        input.weight,
        input.completedWeight,
        nextStatus,
        input.occurredAt,
        Number(previous.completed_weight),
      ],
    )) as Array<{ id: string }>;

    if (rows.length === 0) {
      return false;
    }

    await this.refreshParentFromChildren(
      input.userId,
      previous.parent_task_id,
      input.occurredAt,
    );
    return true;
  }

  private async resolvePlanId(input: SaveTaskInput) {
    const planTitle = input.planTitle?.trim();

    if (!planTitle) {
      return null;
    }

    const existing = (await this.getSql()`
      SELECT id
      FROM plans
      WHERE user_id = ${input.userId}
        AND lower(title) = lower(${planTitle})
        AND status != 'archived'
      ORDER BY created_at
      LIMIT 1
    `) as Array<{ id: string }>;

    if (existing[0]) {
      return existing[0].id;
    }

    const inserted = (await this.getSql()`
      INSERT INTO plans (user_id, title, created_at, updated_at)
      VALUES (${input.userId}, ${planTitle}, ${input.occurredAt}, ${input.occurredAt})
      RETURNING id
    `) as Array<{ id: string }>;

    return inserted[0]?.id ?? null;
  }

  private async createRootTask(input: SaveTaskInput, planId: string | null) {
    const rows = (await this.getSql().query(
      `
      INSERT INTO tasks (
        user_id,
        plan_id,
        title,
        description,
        status,
        priority,
        weight,
        completed_weight,
        deadline_at,
        scheduled_date,
        completed_at,
        skipped_at,
        blocked_at,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        CASE WHEN $5 = 'done' THEN $11::timestamptz ELSE NULL END,
        CASE WHEN $5 = 'skipped' THEN $11::timestamptz ELSE NULL END,
        CASE WHEN $5 = 'blocked' THEN $11::timestamptz ELSE NULL END,
        $11,
        $11
      )
      RETURNING id
      `,
      taskParams(input, planId),
    )) as Array<{ id: string }>;

    return rows[0].id;
  }

  private async updateRootTask(input: SaveTaskInput, planId: string | null) {
    const rows = (await this.getSql().query(
      `
      UPDATE tasks
      SET
        plan_id = $2,
        title = $3,
        description = $4,
        status = $5,
        priority = $6,
        weight = $7,
        completed_weight = $8,
        deadline_at = $9,
        scheduled_date = $10,
        completed_at = CASE WHEN $5 = 'done' THEN $11::timestamptz ELSE NULL END,
        skipped_at = CASE WHEN $5 = 'skipped' THEN $11::timestamptz ELSE NULL END,
        blocked_at = CASE WHEN $5 = 'blocked' THEN $11::timestamptz ELSE NULL END,
        updated_at = $11::timestamptz
      WHERE user_id = $1
        AND id = $12
        AND parent_task_id IS NULL
      RETURNING id
      `,
      [...taskParams(input, planId), input.taskId],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  private async replaceChildren(
    input: SaveTaskInput,
    planId: string | null,
    parentTaskId: string,
  ) {
    await this.getSql()`
      DELETE FROM tasks
      WHERE user_id = ${input.userId}
        AND parent_task_id = ${parentTaskId}
    `;

    for (const [index, child] of input.children.entries()) {
      await this.getSql().query(
        `
        INSERT INTO tasks (
          user_id,
          plan_id,
          parent_task_id,
          title,
          description,
          status,
          priority,
          weight,
          completed_weight,
          scheduled_date,
          sort_order,
          completed_at,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          CASE WHEN $6 = 'done' THEN $12::timestamptz ELSE NULL END,
          $12,
          $12
        )
        `,
        [
          input.userId,
          planId,
          parentTaskId,
          child.title,
          child.description,
          child.status,
          input.priority,
          child.weight,
          child.completedWeight,
          input.scheduledDate,
          index,
          input.occurredAt,
        ],
      );
    }
  }

  private async refreshParentFromChildren(
    userId: string,
    parentTaskId: string | null,
    occurredAt: Date,
  ) {
    if (!parentTaskId) {
      return;
    }

    await this.getSql().query(
      `
      WITH child_progress AS (
        SELECT
          parent_task_id,
          SUM(weight) AS weight,
          SUM(completed_weight) AS completed_weight
        FROM tasks
        WHERE user_id = $1
          AND parent_task_id = $2
          AND status != 'archived'
        GROUP BY parent_task_id
      )
      UPDATE tasks
      SET
        weight = child_progress.weight,
        completed_weight = child_progress.completed_weight,
        status = CASE
          WHEN child_progress.completed_weight >= child_progress.weight THEN 'done'
          WHEN child_progress.completed_weight > 0 THEN 'doing'
          WHEN tasks.status = 'done' THEN 'doing'
          ELSE tasks.status
        END,
        completed_at = CASE
          WHEN child_progress.completed_weight >= child_progress.weight THEN $3::timestamptz
          ELSE NULL
        END,
        updated_at = $3::timestamptz
      FROM child_progress
      WHERE tasks.user_id = $1
        AND tasks.id = child_progress.parent_task_id
      `,
      [userId, parentTaskId, occurredAt],
    );
  }
}
