import assert from "node:assert/strict";
import test from "node:test";
import {
  mapMilestone,
  mapProject,
  mapProjectTask,
  type MilestoneRow,
  type ProjectRow,
  type ProjectTaskRow,
} from "../server/postgres-project-mappers.ts";

test("project date-only fields preserve the local calendar date", () => {
  const dateOnlyValue = new Date(2026, 6, 22);
  const timestamp = new Date("2026-07-22T00:00:00.000Z");
  const project = mapProject({
    id: "project-1",
    user_id: "user-1",
    title: "Project",
    objective: null,
    start_date: dateOnlyValue,
    deadline_date: dateOnlyValue,
    expected_duration_days: null,
    sidebar_pin_order: null,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: null,
    deleted_at: null,
  } satisfies ProjectRow);
  const milestone = mapMilestone({
    id: "milestone-1",
    user_id: "user-1",
    project_id: "project-1",
    title: "Milestone",
    objective: null,
    sort_order: 0,
    start_date: dateOnlyValue,
    deadline_date: dateOnlyValue,
    expected_duration_days: null,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: null,
    deleted_at: null,
  } satisfies MilestoneRow);
  const task = mapProjectTask({
    id: "task-1",
    user_id: "user-1",
    project_id: "project-1",
    project_title: "Project",
    milestone_id: "milestone-1",
    milestone_title: "Milestone",
    title: "Task",
    description: null,
    status: "todo",
    start_date: dateOnlyValue,
    deadline_date: dateOnlyValue,
    sort_order: 0,
    created_at: timestamp,
    updated_at: timestamp,
    completed_at: null,
    deleted_at: null,
  } satisfies ProjectTaskRow);

  assert.equal(project.startDate, "2026-07-22");
  assert.equal(project.deadlineDate, "2026-07-22");
  assert.equal(milestone.startDate, "2026-07-22");
  assert.equal(milestone.deadlineDate, "2026-07-22");
  assert.equal(task.startDate, "2026-07-22");
  assert.equal(task.deadlineDate, "2026-07-22");
});
