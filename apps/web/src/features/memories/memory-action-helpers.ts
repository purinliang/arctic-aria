import type {
  MemoryCategoryOption,
  MemoryRecord,
  MemorySuggestion,
  PinnedMemory,
} from "@/features/dashboard/types";
import {
  hasMemoryCategorySelection,
  resolveMemoryCategoryId,
} from "./memory-input";
import { memoryService } from "./server/memory-service";
import type {
  DashboardPinnedMemory,
  MemorySuggestionRecord,
} from "./server/memory-service";
import type { MemoryRecord as ServerMemoryRecord } from "./server/memory-repository";

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
  baseWeight: number;
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
  | {
      ok: false;
      message: string;
    };

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

export function unauthorizedResult<T>(): MemoryActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
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
      baseWeight: category.baseWeight,
    })),
    pinnedMemories: pinnedMemories.map(toPinnedMemory),
    memoryRecords: memoryRecords.map((memory) =>
      toMemoryRecord(memory, pinnedMemoryIds),
    ),
  };
}

export function validateCategoryInput(input: MemoryCategoryInput) {
  const name = input.name.trim();
  const baseWeight = Number(input.baseWeight);

  if (name.length < 1 || name.length > 40) {
    return {
      ok: false as const,
      message: "Category name must be 1-40 characters.",
    };
  }

  if (!Number.isFinite(baseWeight) || baseWeight <= 0) {
    return {
      ok: false as const,
      message: "Base weight must be greater than 0.",
    };
  }

  return { ok: true as const, name, baseWeight };
}

export function validateMemoryInput(input: MemoryInput) {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!hasMemoryCategorySelection(input)) {
    return { ok: false as const, message: "Choose a category." };
  }

  if (title.length < 1 || title.length > 120) {
    return {
      ok: false as const,
      message: "Memory title must be 1-120 characters.",
    };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Memory description must be 2000 characters or fewer.",
    };
  }

  return { ok: true as const, title, description };
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

export function toMemorySuggestion(
  memory: MemorySuggestionRecord,
): MemorySuggestion {
  return {
    id: memory.id,
    category: memory.categoryName,
    title: memory.title,
    description: memory.description,
    lastDoneText: formatLastDone(memory),
    doneCount: memory.doneCount,
  };
}

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatLastDone(memory: Pick<ServerMemoryRecord, "lastDoneAt">) {
  return memory.lastDoneAt
    ? `Last done ${formatDate(memory.lastDoneAt)}`
    : "Never done";
}

function toPinnedMemory(memory: DashboardPinnedMemory): PinnedMemory {
  return {
    id: memory.id,
    memoryId: memory.memoryId,
    category: memory.categoryName,
    title: memory.title,
    description: memory.description,
    meta: memory.completedAt
      ? "Completed; cleanup is pending"
      : `Visible until ${formatDate(memory.visibleUntil)}`,
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
    title: memory.title,
    description: memory.description,
    lastDoneText: formatLastDone(memory),
    doneCount: memory.doneCount,
    pinned: pinnedMemoryIds.has(memory.id),
  };
}
