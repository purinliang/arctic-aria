import assert from "node:assert/strict";
import test from "node:test";
import {
  saveMilestone,
  saveProject,
  saveTask,
} from "../server/postgres-project-save-queries.ts";
import type {
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "../server/project-repository.ts";

type QueryRecord = {
  text: string;
  params: unknown[];
};

const occurredAt = new Date("2026-07-14T12:00:00.000Z");

const projectInput: SaveProjectInput = {
  userId: "user-1",
  title: "Find a job",
  objective: "Land a backend role.",
  importanceReason: "It supports the next stage.",
  priority: "high",
  startDate: "2026-07-14",
  deadlineDate: null,
  expectedDurationDays: null,
  occurredAt,
};

const milestoneInput: SaveMilestoneInput = {
  userId: "user-1",
  projectId: "project-1",
  title: "Applications",
  objective: "",
  startDate: null,
  deadlineDate: null,
  expectedDurationDays: null,
  occurredAt,
};

const taskInput: SaveProjectTaskInput = {
  userId: "user-1",
  projectId: "project-1",
  milestoneId: "milestone-1",
  title: "Prepare resume",
  description: "",
  priority: "high",
  status: "todo",
  scheduledDate: "2026-07-14",
  startDate: null,
  deadlineDate: null,
  occurredAt,
};

test("project creation queries use contiguous SQL parameters", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveProject(sql, projectInput), "project-1");
  assert.equal(
    records.some((record) => record.text.includes("INSERT INTO project_milestones")),
    false,
  );
  assertQueriesUseContiguousParams(records);
});

test("milestone creation queries use contiguous SQL parameters", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveMilestone(sql, milestoneInput), "milestone-1");
  assertQueriesUseContiguousParams(records);
});

test("task creation queries use contiguous SQL parameters", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveTask(sql, taskInput), true);
  assertQueriesUseContiguousParams(records);
});

test("task creation can omit milestone lookup", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveTask(sql, { ...taskInput, milestoneId: null }), true);
  assert.equal(
    records.some((record) => record.text.includes("FROM project_milestones")),
    false,
  );
  assertQueriesUseContiguousParams(records);
});

function createSqlStub() {
  const records: QueryRecord[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    records.push({ text: strings.join("?"), params: values });

    return Promise.resolve([]);
  }) as {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
    query: (text: string, params?: unknown[]) => Promise<unknown[]>;
  };

  sql.query = async (text: string, params: unknown[] = []) => {
    records.push({ text, params });

    if (text.includes("INSERT INTO projects")) {
      return [{ id: "project-1" }];
    }

    if (text.includes("SELECT id") && text.includes("FROM project_milestones")) {
      return [{ id: "milestone-1" }];
    }

    if (text.includes("INSERT INTO project_milestones")) {
      return [{ id: "milestone-1" }];
    }

    if (text.includes("INSERT INTO project_tasks")) {
      return [{ id: "task-1" }];
    }

    return [];
  };

  return { records, sql: sql as never };
}

function assertQueriesUseContiguousParams(records: QueryRecord[]) {
  for (const record of records.filter((item) => item.text.includes("$"))) {
    const indexes = Array.from(
      new Set(
        Array.from(record.text.matchAll(/\$(\d+)/g), (match) =>
          Number(match[1]),
        ),
      ),
    ).sort((left, right) => left - right);
    const expected = Array.from(
      { length: record.params.length },
      (_, index) => index + 1,
    );

    assert.deepEqual(indexes, expected, record.text);
  }
}
