import assert from "node:assert/strict";
import test from "node:test";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import { getMemoryFilterNames } from "../components/memory-page-helpers.ts";

test("memory filters include categories even when they have no memories", () => {
  const categories: MemoryCategoryOption[] = [
    {
      id: "category-cuisine",
      name: "Cuisine",
      description: "Places to revisit.",
      builtInKey: "cuisine",
      iconName: "utensils",
      shownOnDashboard: true,
    },
    {
      id: "category-sightseeing",
      name: "Sightseeing",
      description: "Places worth seeing again.",
      builtInKey: "sightseeing",
      iconName: "trees",
      shownOnDashboard: true,
    },
  ];

  assert.deepEqual(getMemoryFilterNames(categories), [
    "All",
    "Cuisine",
    "Sightseeing",
  ]);
});
