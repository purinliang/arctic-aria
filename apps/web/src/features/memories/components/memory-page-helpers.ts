import type {
  MemoryCategory,
  MemoryCategoryOption,
} from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";

export type MemoryFilter = "All" | MemoryCategory;

export function getMemoryFilterNames(
  categories: MemoryCategoryOption[],
): MemoryFilter[] {
  return ["All", ...categories.map((category) => category.name)];
}

export const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  description: "",
};
