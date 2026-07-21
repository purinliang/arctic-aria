import type {
  MemoryCategoryOption,
  MemoryRecord,
  MemorySuggestion,
  PinnedMemory,
} from "@/features/dashboard/types";
import {
  hasMemoryCategorySelection,
  resolveMemoryCategoryId,
} from "./memory-input.ts";
import { memoryService } from "./server/memory-service.ts";
import type {
  DashboardPinnedMemory,
  MemorySuggestionRecord,
} from "./server/memory-service";
import type { MemoryRecord as ServerMemoryRecord } from "./server/memory-repository";
import type {
  ActionFailureCategory,
  ActionFailureReason,
  ActionFailureResult,
} from "../../messages/action-result.ts";

export type MemoryDashboardData = {
  categories: MemoryCategoryOption[];
  pinnedMemories: PinnedMemory[];
  memoryRecords: MemoryRecord[];
};

export type MemorySuggestionActionData = {
  dashboardData: MemoryDashboardData;
};

export type MemorySuggestionRefreshData = {
  suggestions: MemorySuggestion[];
  dashboardData: MemoryDashboardData;
};

export type MemoryCategoryInput = {
  id?: string;
  name: string;
  description: string;
};

export type MemoryInput = {
  id?: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  description: string;
};

export type MemoryActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

export function unauthorizedResult<T>(): MemoryActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
    category: "auth",
  };
}

export async function loadMemoryDashboardData(
  userId: string,
): Promise<MemoryDashboardData> {
  const [categories, pinnedMemories, memoryRecords] = await Promise.all([
    memoryService.listMemoryCategories(userId),
    memoryService.listDashboardPinnedMemories(userId),
    memoryService.listMemoryLibrary(userId),
  ]);
  const pinnedMemoryIds = new Set(
    pinnedMemories.map((memory) => memory.memoryId),
  );

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      builtInKey: category.builtInKey,
      iconName: category.iconName,
      shownOnDashboard: category.shownOnDashboard,
    })),
    pinnedMemories: pinnedMemories.map(toPinnedMemory),
    memoryRecords: memoryRecords.map((memory) =>
      toMemoryRecord(memory, pinnedMemoryIds),
    ),
  };
}

export function validateCategoryInput(input: MemoryCategoryInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length < 1) {
    return {
      ok: false as const,
      message: "Category name is required.",
      code: "memory_category_name_invalid",
      category: "missing_parameter" as const,
      subject: "category" as const,
      field: "name",
      reason: "required" as const,
    };
  }

  if (name.length > 40) {
    return {
      ok: false as const,
      message: "Category name must be 40 characters or fewer.",
      code: "memory_category_name_invalid",
      category: "invalid_parameter" as const,
      subject: "category" as const,
      field: "name",
      reason: "too_long" as const,
      limit: 40,
    };
  }

  if (description.length > 500) {
    return {
      ok: false as const,
      message: "Category description must be 500 characters or fewer.",
      code: "memory_category_description_invalid",
      category: "invalid_parameter" as const,
      subject: "category" as const,
      field: "description",
      reason: "too_long" as const,
      limit: 500,
    };
  }

  return { ok: true as const, name, description: description || null };
}

export function validateMemoryInput(input: MemoryInput) {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length < 1) {
    return {
      ok: false as const,
      message: "Memory title is required.",
      code: "memory_title_invalid",
      category: "missing_parameter" as const,
      subject: "memory" as const,
      field: "title",
      reason: "required" as const,
    };
  }

  if (title.length > 120) {
    return {
      ok: false as const,
      message: "Memory title must be 120 characters or fewer.",
      code: "memory_title_invalid",
      category: "invalid_parameter" as const,
      subject: "memory" as const,
      field: "title",
      reason: "too_long" as const,
      limit: 120,
    };
  }

  if (!hasMemoryCategorySelection(input)) {
    return {
      ok: false as const,
      message: "Choose a category.",
      code: "memory_category_missing",
      category: "missing_parameter" as const,
      field: "category",
      reason: "required" as const,
    };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Memory description must be 2000 characters or fewer.",
      code: "memory_description_invalid",
      category: "invalid_parameter" as const,
      subject: "memory" as const,
      field: "description",
      reason: "too_long" as const,
      limit: 2000,
    };
  }

  return { ok: true as const, title, description: description || null };
}

export function resolveMemoryInputCategory(
  input: MemoryInput,
  categories: Parameters<typeof resolveMemoryCategoryId>[1],
) {
  return resolveMemoryCategoryId(input, categories);
}

export function databaseMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Database update failed.";
  }

  const candidate = error as { code?: unknown };

  if (candidate.code === "23505") {
    return "A category with that name already exists.";
  }

  if (candidate.code === "23503") {
    return "This category is still used by memories.";
  }

  return "Database update failed.";
}

export function databaseCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return "memory_database_update_failed";
  }

  const candidate = error as { code?: unknown };

  if (candidate.code === "23505") {
    return "memory_category_duplicate";
  }

  if (candidate.code === "23503") {
    return "memory_category_in_use";
  }

  return "memory_database_update_failed";
}

export function databaseCategory(error: unknown): ActionFailureCategory {
  if (!error || typeof error !== "object") {
    return "database_update";
  }

  const candidate = error as { code?: unknown };

  if (candidate.code === "23505" || candidate.code === "23503") {
    return "domain";
  }

  return "database_update";
}

export function databaseMetadata(error: unknown): {
  subject?: "category";
  reason?: ActionFailureReason;
} {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as { code?: unknown };

  if (candidate.code === "23505") {
    return {
      subject: "category",
      reason: "duplicate",
    };
  }

  if (candidate.code === "23503") {
    return {
      subject: "category",
      reason: "in_use",
    };
  }

  return {};
}

export function toMemorySuggestion(
  memory: MemorySuggestionRecord,
): MemorySuggestion {
  return {
    id: memory.id,
    category: memory.categoryName,
    categoryBuiltInKey: memory.categoryBuiltInKey,
    title: memory.title,
    description: memory.description,
    lastDoneDate: dateKey(memory.lastDoneAt),
    lastDoneText: formatLastDone(memory),
    doneCount: memory.doneCount,
  };
}

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatLastDone(memory: Pick<ServerMemoryRecord, "lastDoneAt">) {
  return memory.lastDoneAt
    ? `Last experienced ${formatDate(memory.lastDoneAt)}`
    : "Never experienced";
}

function toPinnedMemory(memory: DashboardPinnedMemory): PinnedMemory {
  return {
    id: memory.id,
    memoryId: memory.memoryId,
    category: memory.categoryName,
    categoryBuiltInKey: memory.categoryBuiltInKey,
    title: memory.title,
    description: memory.description,
    position: memory.position,
    status: memory.status,
  };
}

function toMemoryRecord(
  memory: ServerMemoryRecord,
  pinnedMemoryIds: Set<string>,
): MemoryRecord {
  return {
    id: memory.id,
    categoryId: memory.categoryId,
    category: memory.categoryName,
    categoryBuiltInKey: memory.categoryBuiltInKey,
    title: memory.title,
    description: memory.description,
    lastDoneDate: dateKey(memory.lastDoneAt),
    lastDoneText: formatLastDone(memory),
    doneCount: memory.doneCount,
    pinned: pinnedMemoryIds.has(memory.id),
  };
}

function dateKey(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}
