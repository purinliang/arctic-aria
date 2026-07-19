import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCategoryInput,
  validateMemoryInput,
} from "../memory-action-helpers.ts";

test("memory category validation stores blank optional descriptions as null", () => {
  const validation = validateCategoryInput({
    name: "Cafe",
    description: "   ",
  });

  assert.equal(validation.ok, true);

  if (validation.ok) {
    assert.equal(validation.description, null);
  }
});

test("memory validation stores blank optional descriptions as null", () => {
  const validation = validateMemoryInput({
    categoryId: "category-1",
    title: "Quiet cafe",
    description: "   ",
  });

  assert.equal(validation.ok, true);

  if (validation.ok) {
    assert.equal(validation.description, null);
  }
});
