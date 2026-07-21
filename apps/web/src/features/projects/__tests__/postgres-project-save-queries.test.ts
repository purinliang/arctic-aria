import assert from "node:assert/strict";
import test from "node:test";
import {
  importProjectTree,
  saveMilestone,
  saveProject,
  saveTask,
} from "../server/postgres-project-save-queries.ts";
import type {
  ImportProjectTreeInput,
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

test("task creation omits retired task schema columns", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveTask(sql, taskInput), true);

  const insert = records.find((record) =>
    record.text.includes("INSERT INTO project_tasks"),
  );

  assert.ok(insert);
  assert.doesNotMatch(insert.text, /\bstatus\b/);
  assert.doesNotMatch(insert.text, /\bpriority\b/);
  assert.doesNotMatch(insert.text, /\bscheduled_date\b/);
  assert.doesNotMatch(insert.text, /\bskipped_at\b/);
  assert.doesNotMatch(insert.text, /\bblocked_at\b/);
  assert.doesNotMatch(insert.text, /\barchived_at\b/);
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

test("task creation treats empty milestone ids as no milestone", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveTask(sql, { ...taskInput, milestoneId: "" }), true);
  assert.equal(
    records.some((record) => record.text.includes("FROM project_milestones")),
    false,
  );

  const insert = records.find((record) =>
    record.text.includes("INSERT INTO project_tasks"),
  );

  assert.equal(insert?.params[2], null);
  assertQueriesUseContiguousParams(records);
});

test("task creation trims blank milestone ids before insert", async () => {
  const { records, sql } = createSqlStub();

  assert.equal(await saveTask(sql, { ...taskInput, milestoneId: "   " }), true);
  assert.equal(
    records.some((record) => record.text.includes("FROM project_milestones")),
    false,
  );

  const insert = records.find((record) =>
    record.text.includes("INSERT INTO project_tasks"),
  );

  assert.equal(insert?.params[2], null);
  assertQueriesUseContiguousParams(records);
});

test("project tree import serializes tasks inside milestone payloads", async () => {
  const { records, sql } = createSqlStub();
  const input: ImportProjectTreeInput = {
    userId: "user-1",
    project: {
      title: "Find a job",
      objective: "Land a backend role.",
      startDate: "2026-07-22",
      deadlineDate: null,
      expectedDurationDays: 180,
    },
    milestones: [
      {
        title: "Applications",
        objective: "Submit strong applications.",
        startDate: "2026-07-22",
        deadlineDate: null,
        expectedDurationDays: 90,
        tasks: [
          {
            title: "Prepare resume",
            description: "Rewrite backend experience bullets.",
            startDate: "2026-07-22",
            deadlineDate: "2026-07-30",
          },
        ],
      },
    ],
    occurredAt,
  };

  assert.equal(await importProjectTree(sql, input), "project-1");

  const insert = records.find((record) =>
    record.text.includes("WITH project_insert AS"),
  );
  assert.ok(insert);
  assert.equal(insert.params.length, 8);
  assert.deepEqual(JSON.parse(String(insert.params[7])), [
    {
      title: "Applications",
      objective: "Submit strong applications.",
      start_date: "2026-07-22",
      deadline_date: null,
      expected_duration_days: 90,
      tasks: [
        {
          title: "Prepare resume",
          description: "Rewrite backend experience bullets.",
          start_date: "2026-07-22",
          deadline_date: "2026-07-30",
        },
      ],
    },
  ]);
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
