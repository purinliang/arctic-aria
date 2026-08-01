import assert from "node:assert/strict";
import test from "node:test";
import { filterInstancesByDate } from "../instance-date-filters.ts";

const instances = [
  { id: "older", scheduledDate: "2026-07-09" },
  { id: "past-edge", scheduledDate: "2026-07-10" },
  { id: "recent-start", scheduledDate: "2026-07-11" },
  { id: "today", scheduledDate: "2026-07-12" },
  { id: "recent-end", scheduledDate: "2026-07-15" },
  { id: "future-start", scheduledDate: "2026-07-16" },
];

test("instance date filters split all, recent, future, and past ranges", () => {
  assert.deepEqual(
    filterInstancesByDate(instances, "all", "2026-07-12").map(
      (instance) => instance.id,
    ),
    ["older", "past-edge", "recent-start", "today", "recent-end", "future-start"],
  );
  assert.deepEqual(
    filterInstancesByDate(instances, "recent", "2026-07-12").map(
      (instance) => instance.id,
    ),
    ["recent-start", "today", "recent-end"],
  );
  assert.deepEqual(
    filterInstancesByDate(instances, "future", "2026-07-12").map(
      (instance) => instance.id,
    ),
    ["future-start"],
  );
  assert.deepEqual(
    filterInstancesByDate(instances, "past", "2026-07-12").map(
      (instance) => instance.id,
    ),
    ["older", "past-edge"],
  );
});
