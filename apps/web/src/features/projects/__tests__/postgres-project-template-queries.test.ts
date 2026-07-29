import assert from "node:assert/strict";
import test from "node:test";
import { applyProjectTreeTemplate } from "../server/postgres-project-template-queries.ts";
import type { ApplyProjectTreeTemplateInput } from "../server/project-repository.ts";

type QueryRecord = {
  text: string;
  params: unknown[];
};

const occurredAt = new Date("2026-07-29T10:00:00.000Z");

test("project tree template apply uses one guarded SQL statement", async () => {
  const { records, sql } = createSqlStub();
  const input: ApplyProjectTreeTemplateInput = {
    userId: "user-1",
    project: {
      projectId: "project-1",
      title: "Find a job",
      objective: "Land a backend role.",
      startDate: "2026-07-29",
      deadlineDate: null,
      expectedDurationDays: 180,
    },
    milestones: [
      {
        operation: "create",
        milestoneId: "00000000-0000-0000-0000-000000000001",
        title: "Applications",
        objective: null,
        startDate: "2026-07-29",
        deadlineDate: null,
        expectedDurationDays: 90,
      },
    ],
    tasks: [
      {
        operation: "create",
        taskId: "00000000-0000-0000-0000-000000000002",
        milestoneId: "00000000-0000-0000-0000-000000000001",
        title: "Prepare resume",
        description: null,
        startDate: null,
        deadlineDate: "2026-08-01",
        estimatedDurationMinutes: 45,
      },
    ],
    occurredAt,
  };

  assert.equal(await applyProjectTreeTemplate(sql, input), true);

  const record = records[0];

  assert.ok(record);
  assert.equal(records.length, 1);
  assert.match(record.text, /WITH milestone_input AS/);
  assert.match(record.text, /target_project AS/);
  assert.match(record.text, /milestone_create AS/);
  assert.match(record.text, /task_create AS/);
  assert.match(record.text, /SELECT EXISTS \(SELECT 1 FROM project_update\) AS ok/);
  assert.equal(record.params.length, 10);
  assert.deepEqual(JSON.parse(String(record.params[8])), [
    {
      operation: "create",
      milestone_id: "00000000-0000-0000-0000-000000000001",
      title: "Applications",
      objective: null,
      start_date: "2026-07-29",
      deadline_date: null,
      expected_duration_days: 90,
      ordinal: 1,
    },
  ]);
  assert.deepEqual(JSON.parse(String(record.params[9])), [
    {
      operation: "create",
      task_id: "00000000-0000-0000-0000-000000000002",
      milestone_id: "00000000-0000-0000-0000-000000000001",
      title: "Prepare resume",
      description: null,
      start_date: null,
      deadline_date: "2026-08-01",
      estimated_duration_minutes: 45,
      ordinal: 1,
    },
  ]);
});

function createSqlStub() {
  const records: QueryRecord[] = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      records.push({ text, params });

      return [{ ok: true }];
    },
  };

  return { records, sql: sql as never };
}
