import type { MemoryCategory } from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";

export type MemoryFilter = "All" | MemoryCategory;
export type CategoryPeriod = "Weekly" | "Monthly";

export const categoryPeriodWeights: Record<CategoryPeriod, number> = {
  Weekly: 1.2,
  Monthly: 0.8,
};

export const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  baseWeight: categoryPeriodWeights.Weekly,
};

export function categoryTone(category: MemoryCategory) {
  return category === "Cuisine" ? "amber" : "cyan";
}

export function categoryPeriodFromWeight(baseWeight: number): CategoryPeriod {
  return Math.abs(baseWeight - categoryPeriodWeights.Monthly) <
    Math.abs(baseWeight - categoryPeriodWeights.Weekly)
    ? "Monthly"
    : "Weekly";
}
