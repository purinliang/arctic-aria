import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import {
  mapMilestone,
  mapProject,
  mapProjectTask,
  projectTaskSelect,
  type MilestoneRow,
  type ProjectRow,
  type ProjectTaskRow,
} from "./postgres-project-mappers.ts";
import {
  saveMilestone,
  saveProject,
  saveTask,
} from "./postgres-project-save-queries.ts";
import {
  applyProjectTreeTemplate,
} from "./postgres-project-template-queries.ts";
import {
  createProjectTreeTemplate,
} from "./postgres-project-template-create-queries.ts";
import { listPostgresDashboardTasks } from "./postgres-project-dashboard-queries.ts";
import type {
  ApplyProjectTreeTemplateInput,
  CreateProjectTreeTemplateInput,
  ProjectPinResult,
  ProjectRepository,
  ProjectTaskStatus,
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository.ts";

export class PostgresProjectRepository implements ProjectRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  async listProjects(userId: string) {
    const [projectRows, milestoneRows, taskRows] = await Promise.all([
      this.getProjectRows(userId),
      this.getMilestoneRows(userId),
      this.getProjectTaskRows(userId),
    ]);

    return assembleProjects(projectRows, milestoneRows, taskRows);
  }

  async listDashboardTasks(userId: string, today: string, occurredAt: Date) {
    return listPostgresDashboardTasks(this.getSql(), {
      userId,
      today,
      occurredAt,
    });
  }

  saveProject(input: SaveProjectInput) {
    return saveProject(this.getSql(), input);
  }

  saveMilestone(input: SaveMilestoneInput) {
    return saveMilestone(this.getSql(), input);
  }

  saveTask(input: SaveProjectTaskInput) {
    return saveTask(this.getSql(), input);
  }

  applyProjectTreeTemplate(input: ApplyProjectTreeTemplateInput) {
    return applyProjectTreeTemplate(this.getSql(), input);
  }

  createProjectTreeTemplate(input: CreateProjectTreeTemplateInput) {
    return createProjectTreeTemplate(this.getSql(), input);
  }

  async archiveProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql()`
      UPDATE projects
      SET sidebar_pin_order = NULL,
          deleted_at = ${input.occurredAt},
          updated_at = ${input.occurredAt}
      WHERE user_id = ${input.userId}
        AND id = ${input.projectId}
        AND deleted_at IS NULL
      RETURNING id
    `) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async pinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }): Promise<ProjectPinResult> {
    const rows = (await this.getSql().query(
      `WITH target AS (
         SELECT id, sidebar_pin_order
         FROM projects
         WHERE user_id = $1
           AND id = $2
           AND deleted_at IS NULL
       ),
       available_slot AS (
         SELECT slot
         FROM generate_series(1, 3) AS slots(slot)
         WHERE NOT EXISTS (
           SELECT 1
           FROM projects
           WHERE user_id = $1
             AND sidebar_pin_order = slot
         )
         ORDER BY slot
         LIMIT 1
       ),
       updated AS (
         UPDATE projects
         SET sidebar_pin_order = COALESCE(
               sidebar_pin_order,
               (SELECT slot FROM available_slot)
             ),
             updated_at = $3::timestamptz
         WHERE user_id = $1
           AND id = $2
           AND deleted_at IS NULL
           AND (
             sidebar_pin_order IS NOT NULL
             OR EXISTS (SELECT 1 FROM available_slot)
           )
         RETURNING id
       )
       SELECT
         EXISTS (SELECT 1 FROM target) AS found,
         EXISTS (SELECT 1 FROM updated) AS pinned`,
      [input.userId, input.projectId, input.occurredAt],
    )) as Array<{ found: boolean; pinned: boolean }>;
    const result = rows[0];

    if (!result?.found) {
      return "not_found";
    }

    return result.pinned ? "pinned" : "limit_reached";
  }

  async unpinProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `UPDATE projects
       SET sidebar_pin_order = NULL,
           updated_at = CASE
             WHEN sidebar_pin_order IS NULL THEN updated_at
             ELSE $3::timestamptz
           END
       WHERE user_id = $1
         AND id = $2
         AND deleted_at IS NULL
       RETURNING id`,
      [input.userId, input.projectId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async archiveMilestone(input: {
    userId: string;
    milestoneId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `WITH deleted_milestone AS (
         UPDATE project_milestones
         SET deleted_at = $3::timestamptz,
             updated_at = $3::timestamptz
         WHERE user_id = $1
           AND id = $2
           AND deleted_at IS NULL
         RETURNING id
       ),
       deleted_tasks AS (
         UPDATE project_tasks
         SET deleted_at = $3::timestamptz,
             updated_at = $3::timestamptz
         WHERE user_id = $1
           AND milestone_id IN (SELECT id FROM deleted_milestone)
           AND deleted_at IS NULL
         RETURNING id
       )
       SELECT id FROM deleted_milestone`,
      [input.userId, input.milestoneId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async archiveTask(input: {
    userId: string;
    taskId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `UPDATE project_tasks
       SET deleted_at = $3::timestamptz,
           updated_at = $3::timestamptz
       WHERE user_id = $1
         AND id = $2
         AND deleted_at IS NULL
       RETURNING id`,
      [input.userId, input.taskId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: ProjectTaskStatus;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `WITH updated_task AS (
         UPDATE project_tasks
         SET completed_at = CASE
             WHEN $3::text = 'done' THEN $4::timestamptz
             ELSE NULL
           END,
           updated_at = $4::timestamptz
         WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *
       ),
       event AS (
         INSERT INTO completion_events (
           user_id, target_type, target_id, event_type, occurred_at, source
         )
         SELECT user_id, 'task', id, $5, $4::timestamptz, 'web'
         FROM updated_task
         WHERE $3::text IN ('done', 'todo')
         RETURNING id
       )
       SELECT id FROM updated_task`,
      [
        input.userId,
        input.taskId,
        input.status,
        input.occurredAt,
        eventTypeForStatus(input.status),
      ],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  private async getProjectRows(userId: string) {
    return (await this.getSql()`
      SELECT *
      FROM projects
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
      ORDER BY start_date DESC, created_at DESC
    `) as ProjectRow[];
  }

  private async getMilestoneRows(userId: string) {
    return (await this.getSql()`
      SELECT project_milestones.*
      FROM project_milestones
      INNER JOIN projects ON projects.id = project_milestones.project_id
      WHERE project_milestones.user_id = ${userId}
        AND project_milestones.deleted_at IS NULL
        AND projects.deleted_at IS NULL
      ORDER BY project_milestones.sort_order, project_milestones.created_at
    `) as MilestoneRow[];
  }

  private async getProjectTaskRows(userId: string) {
    return (await this.getSql().query(
      `${projectTaskSelect}
       WHERE project_tasks.user_id = $1
         AND project_tasks.deleted_at IS NULL
         AND projects.deleted_at IS NULL
         AND (
           project_tasks.milestone_id IS NULL
           OR project_milestones.deleted_at IS NULL
         )
       ORDER BY project_tasks.sort_order, project_tasks.created_at`,
      [userId],
    )) as ProjectTaskRow[];
  }

}

function assembleProjects(
  projectRows: ProjectRow[],
  milestoneRows: MilestoneRow[],
  taskRows: ProjectTaskRow[],
) {
  const projects = projectRows.map(mapProject);
  const milestones = milestoneRows.map(mapMilestone);
  const tasks = taskRows.map(mapProjectTask);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const milestoneById = new Map(
    milestones.map((milestone) => [milestone.id, milestone]),
  );

  tasks.forEach((task) => {
    projectById.get(task.projectId)?.tasks.push(task);

    if (task.milestoneId) {
      milestoneById.get(task.milestoneId)?.tasks.push(task);
    }
  });

  milestones.forEach((milestone) => {
    projectById.get(milestone.projectId)?.milestones.push(milestone);
  });

  return projects;
}

function eventTypeForStatus(status: ProjectTaskStatus) {
  if (status === "done") {
    return "completed";
  }

  return "reopened";
}
