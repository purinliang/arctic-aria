import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureDefaultCategories,
  updateMemory,
} from "../server/postgres-memory-core-queries.ts";

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

test("default category initialization updates by built-in key before insert", async () => {
  const records: QueryRecord[] = [];
  const sql = Object.assign(
    async () => [],
    {
      query: async (text: string, params: unknown[] = []) => {
        records.push({ text, params });

        return [];
      },
    },
  );

  await ensureDefaultCategories(sql as never, "user-1");

  assert.match(records[0].text, /WITH updated_by_key AS/);
  assert.match(records[0].text, /AND built_in_key = \$4/);
  assert.match(records[0].text, /WHERE NOT EXISTS \(SELECT 1 FROM updated_by_key\)/);
  assert.equal(records.length, 8);
  assert.equal(records[1].params[4], "trees");
  assert.equal(records[6].params[4], "gamepad-2");
  assert.equal(records[7].params[4], "shopping-cart");
});
