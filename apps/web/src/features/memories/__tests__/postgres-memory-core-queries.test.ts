import assert from "node:assert/strict";
import test from "node:test";
import { updateMemory } from "../server/postgres-memory-core-queries.ts";

type QueryRecord = {
  text: string;
  params: unknown[];
};

test("memory update qualifies memory id in category join query", async () => {
  const records: QueryRecord[] = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      records.push({ text, params });
      return [];
    },
  };

  await updateMemory(sql as never, {
    userId: "user-1",
    memoryId: "memory-1",
    categoryId: "category-1",
    title: "Ramen",
    description: "Warm bowl after class.",
    occurredAt: new Date("2026-07-14T12:00:00.000Z"),
  });

  assert.match(records[0].text, /WHERE memories\.id = \$2/);
});
