import type {
  BuiltInMemoryCategoryKey,
  MemoryCategory,
  MemoryCategoryOption,
  MemoryRecord,
} from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";
import type { MemoryMessages } from "@/messages/app-messages";
import { displayDescription } from "../../../components/default-description.ts";

export type MemoryFilter = "All" | MemoryCategory;
type BuiltInCategoryMessages = MemoryMessages["categories"]["builtIns"];
const alwaysVisibleBuiltInKeys = new Set(["cuisine", "sightseeing"]);
const primaryBuiltInOrder = new Map([
  ["cuisine", 0],
  ["sightseeing", 1],
]);

export function sortMemoryCategories(categories: MemoryCategoryOption[]) {
  return [...categories].sort((left, right) => {
    const leftRank = categorySortRank(left);
    const rightRank = categorySortRank(right);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.name.localeCompare(right.name, "en");
  });
}

export function getMemoryFilterNames(
  categories: MemoryCategoryOption[],
): MemoryFilter[] {
  return ["All", ...categories.map((category) => category.name)];
}

export function getMemoryCategoryName(
  category: Pick<MemoryCategoryOption, "name" | "builtInKey">,
  messages: BuiltInCategoryMessages,
) {
  return getBuiltInCategoryMessage(category.builtInKey, messages)?.name ??
    category.name;
}

export function getMemoryCategoryDescription(
  category: Pick<MemoryCategoryOption, "description" | "builtInKey">,
  messages: BuiltInCategoryMessages,
) {
  return getBuiltInCategoryMessage(category.builtInKey, messages)?.description ??
    category.description;
}

export function getMemoryCategoryDisplayDescription(
  category: Pick<MemoryCategoryOption, "name" | "description" | "builtInKey">,
  messages: BuiltInCategoryMessages,
  defaults: readonly string[],
) {
  return getBuiltInCategoryMessage(category.builtInKey, messages)?.description ??
    displayDescription(category.description, category.name, defaults);
}

export function getMemoryCategoryLabel(
  category: MemoryCategory,
  builtInKey: BuiltInMemoryCategoryKey | null,
  messages: BuiltInCategoryMessages,
) {
  return getBuiltInCategoryMessage(builtInKey, messages)?.name ?? category;
}

export function getVisibleMemoryFilterCategories(
  categories: MemoryCategoryOption[],
  memories: MemoryRecord[],
) {
  const categoryIdsWithMemories = new Set(
    memories.map((memory) => memory.categoryId),
  );

  return categories.filter(
    (category) =>
      !category.builtInKey ||
      alwaysVisibleBuiltInKeys.has(category.builtInKey) ||
      categoryIdsWithMemories.has(category.id),
  );
}

function categorySortRank(category: MemoryCategoryOption) {
  if (category.builtInKey && primaryBuiltInOrder.has(category.builtInKey)) {
    return primaryBuiltInOrder.get(category.builtInKey) ?? 0;
  }

  return category.builtInKey ? 3 : 2;
}

function getBuiltInCategoryMessage(
  builtInKey: BuiltInMemoryCategoryKey | null,
  messages: BuiltInCategoryMessages,
) {
  return builtInKey ? messages[builtInKey] : null;
}

export const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  description: "",
};

export function getCategoryFormStateAfterSuccessfulDelete() {
  return {
    categoryFormOpen: false,
    categoryDraft: emptyCategoryDraft,
  };
}
