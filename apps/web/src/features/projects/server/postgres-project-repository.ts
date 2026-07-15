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
import type {
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

  async listDashboardTasks(userId: string) {
    const taskRows = (await this.getSql().query(
      `${projectTaskSelect}
       WHERE project_tasks.user_id = $1
         AND project_tasks.status NOT IN ('archived', 'done')
         AND projects.status = 'active'
         AND (
           project_tasks.milestone_id IS NULL
           OR project_milestones.status = 'active'
         )
       ORDER BY
         project_tasks.deadline_date NULLS LAST,
         project_tasks.start_date NULLS LAST,
         project_tasks.updated_at DESC
       LIMIT 8`,
      [userId],
    )) as ProjectTaskRow[];
    return taskRows.map(mapProjectTask);
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

  async archiveProject(input: {
    userId: string;
    projectId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql()`
      UPDATE projects
      SET status = 'archived',
          archived_at = ${input.occurredAt},
          updated_at = ${input.occurredAt}
      WHERE user_id = ${input.userId}
        AND id = ${input.projectId}
        AND status != 'archived'
      RETURNING id
    `) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async archiveMilestone(input: {
    userId: string;
    milestoneId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `WITH archived_milestone AS (
         UPDATE project_milestones
         SET status = 'archived',
             archived_at = $3::timestamptz,
             updated_at = $3::timestamptz
         WHERE user_id = $1
           AND id = $2
           AND status != 'archived'
         RETURNING id
       ),
       detached_tasks AS (
         UPDATE project_tasks
         SET milestone_id = NULL,
             updated_at = $3::timestamptz
         WHERE user_id = $1
           AND milestone_id IN (SELECT id FROM archived_milestone)
         RETURNING id
       )
       SELECT id FROM archived_milestone`,
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
       SET status = 'archived',
           archived_at = $3::timestamptz,
           updated_at = $3::timestamptz
       WHERE user_id = $1
         AND id = $2
         AND status != 'archived'
       RETURNING id`,
      [input.userId, input.taskId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async updateTaskStatus(input: {
    userId: string;
    taskId: string;
    status: Exclude<ProjectTaskStatus, "archived">;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `WITH updated_task AS (
         UPDATE project_tasks
         SET status = $3::text,
           completed_at = CASE WHEN $3::text = 'done' THEN $4::timestamptz ELSE NULL END,
           skipped_at = CASE WHEN $3::text = 'skipped' THEN $4::timestamptz ELSE NULL END,
           blocked_at = CASE WHEN $3::text = 'blocked' THEN $4::timestamptz ELSE NULL END,
           updated_at = $4::timestamptz
         WHERE user_id = $1 AND id = $2
         RETURNING *
       ),
       event AS (
         INSERT INTO completion_events (
           user_id, target_type, target_id, event_type, occurred_at, source
         )
         SELECT user_id, 'task', id, $5, $4::timestamptz, 'web'
         FROM updated_task
         WHERE $3::text IN ('done', 'skipped', 'blocked', 'todo', 'doing')
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
        AND status != 'archived'
      ORDER BY start_date DESC, created_at DESC
    `) as ProjectRow[];
  }

  private async getMilestoneRows(userId: string) {
    return (await this.getSql()`
      SELECT project_milestones.*
      FROM project_milestones
      INNER JOIN projects ON projects.id = project_milestones.project_id
      WHERE project_milestones.user_id = ${userId}
        AND project_milestones.status != 'archived'
        AND projects.status != 'archived'
      ORDER BY project_milestones.sort_order, project_milestones.created_at
    `) as MilestoneRow[];
  }

  private async getProjectTaskRows(userId: string) {
    return (await this.getSql().query(
      `${projectTaskSelect}
       WHERE project_tasks.user_id = $1
         AND project_tasks.status != 'archived'
         AND projects.status != 'archived'
         AND (
           project_tasks.milestone_id IS NULL
           OR project_milestones.status != 'archived'
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

function eventTypeForStatus(status: Exclude<ProjectTaskStatus, "archived">) {
  if (status === "done") {
    return "completed";
  }

  if (status === "skipped") {
    return "skipped";
  }

  if (status === "blocked") {
    return "blocked";
  }

  if (status === "doing") {
    return "unblocked";
  }

  return "reopened";
}
