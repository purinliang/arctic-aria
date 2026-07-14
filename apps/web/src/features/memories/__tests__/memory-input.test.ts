import assert from "node:assert/strict";
import test from "node:test";
import {
  hasMemoryCategorySelection,
  resolveMemoryCategoryId,
} from "../memory-input.ts";

test("resolves a current category id by selected category name", () => {
  const categoryId = resolveMemoryCategoryId(
    {
      categoryId: "stale-category-id",
      categoryName: "Custom",
    },
    [
      {
        id: "current-category-id",
        name: "Custom",
      },
    ],
  );

  assert.equal(categoryId, "current-category-id");
});

test("falls back to the selected category id when category name is unknown", () => {
  const categoryId = resolveMemoryCategoryId(
    {
      categoryId: "selected-category-id",
      categoryName: "Unknown",
    },
    [
      {
        id: "current-category-id",
        name: "Custom",
      },
    ],
  );

  assert.equal(categoryId, "selected-category-id");
});

test("accepts category selection by id or name", () => {
  assert.equal(hasMemoryCategorySelection({ categoryId: "category-id" }), true);
  assert.equal(hasMemoryCategorySelection({ categoryName: "Custom" }), true);
  assert.equal(hasMemoryCategorySelection({ categoryName: "   " }), false);
});
