import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import {
  buildTree,
  type SaveTaskInput,
  type TaskRepository,
  type TaskStatus,
} from "./task-repository.ts";
import { mapTask, taskSelect, type TaskRow } from "./postgres-task-mappers.ts";
import {
  refreshParentFromChildren,
  saveTask,
} from "./postgres-task-save-queries.ts";

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

  saveTask(input: SaveTaskInput) {
    return saveTask(this.getSql(), input);
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
      input.status === "done"
        ? Number(previous.weight)
        : Number(previous.completed_weight);
    const rows = (await this.getSql().query(
      `WITH updated_task AS (
         UPDATE tasks
         SET status = $3::text, completed_weight = $4,
           completed_at = CASE WHEN $3::text = 'done' THEN $5::timestamptz ELSE NULL END,
           skipped_at = CASE WHEN $3::text = 'skipped' THEN $5::timestamptz ELSE NULL END,
           blocked_at = CASE WHEN $3::text = 'blocked' THEN $5::timestamptz ELSE NULL END,
           updated_at = $5::timestamptz
         WHERE user_id = $1 AND id = $2
         RETURNING *
       ),
       event AS (
         INSERT INTO completion_events (
           user_id, target_type, target_id, event_type,
           previous_completed_weight, new_completed_weight, occurred_at, source
         )
         SELECT user_id, 'task', id,
           CASE
             WHEN $3::text = 'done' THEN 'completed'
             WHEN $3::text = 'skipped' THEN 'skipped'
             ELSE 'partially_completed'
           END,
           $6, $4, $5::timestamptz, 'web'
         FROM updated_task
         WHERE $3::text IN ('done', 'skipped')
         RETURNING id
       )
       SELECT id FROM updated_task`,
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

    await refreshParentFromChildren(
      this.getSql(),
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
      `WITH updated_task AS (
         UPDATE tasks
         SET weight = $3, completed_weight = $4, status = $5,
           completed_at = CASE WHEN $5 = 'done' THEN $6::timestamptz ELSE NULL END,
           updated_at = $6::timestamptz
         WHERE user_id = $1 AND id = $2
         RETURNING *
       ),
       event AS (
         INSERT INTO completion_events (
           user_id, target_type, target_id, event_type,
           previous_completed_weight, new_completed_weight, occurred_at, source
         )
         SELECT user_id, 'task', id,
           CASE WHEN $5 = 'done' THEN 'completed' ELSE 'partially_completed' END,
           $7, $4, $6::timestamptz, 'web'
         FROM updated_task
         RETURNING id
       )
       SELECT id FROM updated_task`,
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

    await refreshParentFromChildren(
      this.getSql(),
      input.userId,
      previous.parent_task_id,
      input.occurredAt,
    );
    return true;
  }
}
