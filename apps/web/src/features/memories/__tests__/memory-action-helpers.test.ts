import assert from "node:assert/strict";
import test from "node:test";
import {
  databaseCategory,
  databaseMetadata,
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

test("memory category validation reports missing names with structured metadata", () => {
  assert.deepEqual(
    validateCategoryInput({
      name: "   ",
      description: "",
    }),
    {
      ok: false,
      message: "Category name is required.",
      code: "memory_category_name_invalid",
      category: "missing_parameter",
      subject: "category",
      field: "name",
      reason: "required",
    },
  );
});

test("memory category duplicate database errors expose domain metadata", () => {
  const error = { code: "23505" };

  assert.equal(databaseCategory(error), "domain");
  assert.deepEqual(databaseMetadata(error), {
    subject: "category",
    reason: "duplicate",
  });
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
