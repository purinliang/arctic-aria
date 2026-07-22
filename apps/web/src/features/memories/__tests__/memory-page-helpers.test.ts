import assert from "node:assert/strict";
import test from "node:test";
import type {
  MemoryCategoryOption,
  MemoryRecord,
} from "@/features/dashboard/types";
import {
  emptyCategoryDraft,
  getCategoryFormStateAfterSuccessfulDelete,
  getMemoryCategoryDescription,
  getMemoryCategoryDisplayDescription,
  getMemoryCategoryLabel,
  getMemoryCategoryName,
  getMemoryFilterNames,
  getVisibleMemoryFilterCategories,
  sortMemoryCategories,
} from "../components/memory-page-helpers.ts";
import { defaultDescriptionForTitle } from "../../../components/default-description.ts";
import { simplifiedChineseMemoryMessages } from "../../../messages/memory-messages.ts";

test("memory filters include all category names for editor options", () => {
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

test("memory filters hide empty built-in categories", () => {
  const categories: MemoryCategoryOption[] = [
    {
      id: "category-cuisine",
      name: "Cuisine",
      description: "Food memories.",
      builtInKey: "cuisine",
      iconName: "utensils",
      shownOnDashboard: true,
    },
    {
      id: "category-movie",
      name: "Movie",
      description: "Films to remember.",
      builtInKey: "movie",
      iconName: "film",
      shownOnDashboard: true,
    },
    {
      id: "category-custom",
      name: "Custom",
      description: "User-authored category.",
      builtInKey: null,
      iconName: "bookmark",
      shownOnDashboard: false,
    },
  ];

  assert.deepEqual(
    getVisibleMemoryFilterCategories(categories, []).map(
      (category) => category.name,
    ),
    ["Custom"],
  );

  assert.deepEqual(
    getVisibleMemoryFilterCategories(categories, [
      memoryRecord("memory-movie", "category-movie", "Movie"),
    ]).map((category) => category.name),
    ["Movie", "Custom"],
  );
});

test("memory categories sort primary built-ins, custom categories, then other built-ins", () => {
  const categories: MemoryCategoryOption[] = [
    categoryOption("category-music", "Music", "music"),
    categoryOption("category-custom-b", "Travel", null),
    categoryOption("category-sightseeing", "Sightseeing", "sightseeing"),
    categoryOption("category-book", "Book", "book"),
    categoryOption("category-custom-a", "Anime Notes", null),
    categoryOption("category-cuisine", "Cuisine", "cuisine"),
  ];

  assert.deepEqual(
    sortMemoryCategories(categories).map((category) => category.name),
    ["Cuisine", "Sightseeing", "Anime Notes", "Travel", "Book", "Music"],
  );
});

test("memory category display helpers localize built-ins only", () => {
  const messages = simplifiedChineseMemoryMessages.categories.builtIns;
  const builtIn = categoryOption("category-cuisine", "Cuisine", "cuisine");
  const custom = categoryOption("category-custom", "旅行", null);

  assert.equal(getMemoryCategoryName(builtIn, messages), messages.cuisine.name);
  assert.equal(
    getMemoryCategoryDescription(builtIn, messages),
    messages.cuisine.description,
  );
  assert.equal(
    getMemoryCategoryLabel("Cuisine", "cuisine", messages),
    messages.cuisine.name,
  );
  assert.equal(getMemoryCategoryName(custom, messages), "旅行");
  assert.equal(
    getMemoryCategoryDescription(custom, messages),
    "旅行 description",
  );
  assert.equal(getMemoryCategoryLabel("旅行", null, messages), "旅行");
});

test("memory category display description uses fallback for empty custom categories", () => {
  const messages = simplifiedChineseMemoryMessages.categories.builtIns;
  const defaults = simplifiedChineseMemoryMessages.defaultDescriptions.category;
  const custom = {
    ...categoryOption("category-custom", "旅行", null),
    description: "",
  };

  assert.equal(
    getMemoryCategoryDisplayDescription(custom, messages, defaults),
    defaultDescriptionForTitle(custom.name, defaults),
  );
});

test("successful category delete closes the category form", () => {
  assert.deepEqual(getCategoryFormStateAfterSuccessfulDelete(), {
    categoryFormOpen: false,
    categoryDraft: emptyCategoryDraft,
  });
});

function categoryOption(
  id: string,
  name: string,
  builtInKey: MemoryCategoryOption["builtInKey"],
): MemoryCategoryOption {
  return {
    id,
    name,
    description: `${name} description`,
    builtInKey,
    iconName: "bookmark",
    shownOnDashboard: false,
  };
}

function memoryRecord(
  id: string,
  categoryId: string,
  category: string,
): MemoryRecord {
  return {
    id,
    categoryId,
    category,
    categoryBuiltInKey: null,
    title: "Memory title",
    description: "Memory description",
    lastDoneDate: "",
    lastDoneText: "",
    doneCount: 0,
    pinned: false,
  };
}
