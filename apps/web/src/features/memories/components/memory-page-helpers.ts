import type { MemoryCategory } from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";

export type MemoryFilter = "All" | MemoryCategory;

export const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  description: "",
};
