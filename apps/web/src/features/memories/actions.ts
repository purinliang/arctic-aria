"use server";

import { getCurrentUser } from "@/features/auth/actions";
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

function unauthorizedResult<T>(): MemoryActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
  };
}

async function requireCurrentUser() {
  return getCurrentUser();
}

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatLastDone(memory: Pick<ServerMemoryRecord, "lastDoneAt">) {
  return memory.lastDoneAt ? `Last done ${formatDate(memory.lastDoneAt)}` : "Never done";
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

function toMemorySuggestion(memory: MemorySuggestionRecord): MemorySuggestion {
  return {
    id: memory.id,
    category: memory.categoryName,
    title: memory.title,
    description: memory.description,
    lastDoneText: formatLastDone(memory),
    doneCount: memory.doneCount,
  };
}

async function loadMemoryDashboardData(userId: string): Promise<MemoryDashboardData> {
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

function validateCategoryInput(input: MemoryCategoryInput) {
  const name = input.name.trim();
  const baseWeight = Number(input.baseWeight);

  if (name.length < 1 || name.length > 40) {
    return { ok: false as const, message: "Category name must be 1-40 characters." };
  }

  if (!Number.isFinite(baseWeight) || baseWeight <= 0) {
    return { ok: false as const, message: "Base weight must be greater than 0." };
  }

  return { ok: true as const, name, baseWeight };
}

function validateMemoryInput(input: MemoryInput) {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!hasMemoryCategorySelection(input)) {
    return { ok: false as const, message: "Choose a category." };
  }

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Memory title must be 1-120 characters." };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Memory description must be 2000 characters or fewer.",
    };
  }

  return { ok: true as const, title, description };
}

function databaseMessage(error: unknown) {
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

export async function getMemoryDashboardData(): Promise<
  MemoryActionResult<MemoryDashboardData>
> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function completePinnedMemory(
  pinnedMemoryId: string,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  await memoryService.completePinnedMemory(user.id, pinnedMemoryId);

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function cancelPinnedMemoryDone(
  pinnedMemoryId: string,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  await memoryService.cancelPinnedMemoryDone(user.id, pinnedMemoryId);

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function replacePinnedMemory(
  pinnedMemoryId: string,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  await memoryService.replacePinnedMemory(user.id, pinnedMemoryId);

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function saveMemoryCategory(
  input: MemoryCategoryInput,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateCategoryInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  try {
    if (input.id) {
      await memoryService.updateCategory(
        user.id,
        input.id,
        validation.name,
        validation.baseWeight,
      );
    } else {
      await memoryService.createCategory(
        user.id,
        validation.name,
        validation.baseWeight,
      );
    }
  } catch (error) {
    return { ok: false, message: databaseMessage(error) };
  }

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function deleteMemoryCategory(
  categoryId: string,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const deleted = await memoryService.deleteCategory(user.id, categoryId);

    if (!deleted) {
      return { ok: false, message: "Category was not found." };
    }
  } catch (error) {
    return { ok: false, message: databaseMessage(error) };
  }

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function saveMemory(
  input: MemoryInput,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateMemoryInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const categoryId = resolveMemoryCategoryId(
    input,
    await memoryService.listMemoryCategories(user.id),
  );

  if (input.id) {
    const memory = await memoryService.updateMemory(
      user.id,
      input.id,
      categoryId,
      validation.title,
      validation.description,
    );

    if (!memory) {
      return { ok: false, message: "Memory or category was not found." };
    }
  } else {
    const memory = await memoryService.createMemory(
      user.id,
      categoryId,
      validation.title,
      validation.description,
    );

    if (!memory) {
      return { ok: false, message: "Category was not found." };
    }
  }

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function deleteMemory(
  memoryId: string,
): Promise<MemoryActionResult<MemoryDashboardData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const deleted = await memoryService.deleteMemory(user.id, memoryId);

  if (!deleted) {
    return { ok: false, message: "Memory was not found." };
  }

  return {
    ok: true,
    data: await loadMemoryDashboardData(user.id),
  };
}

export async function refreshMemorySuggestions(
  ignoredMemoryIds: string[] = [],
): Promise<
  MemoryActionResult<MemorySuggestionRefreshData>
> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  await Promise.all(
    Array.from(new Set(ignoredMemoryIds)).map((memoryId) =>
      memoryService.ignoreSuggestedMemory(user.id, memoryId),
    ),
  );

  const suggestions = await memoryService.suggestMemories(user.id);

  return {
    ok: true,
    data: {
      suggestions: suggestions.map(toMemorySuggestion),
      dashboardData: await loadMemoryDashboardData(user.id),
    },
  };
}

export async function pinMemorySuggestion(
  memoryId: string,
): Promise<MemoryActionResult<MemorySuggestionActionData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const pinnedMemory = await memoryService.pinSuggestedMemory(user.id, memoryId);

  if (!pinnedMemory) {
    return {
      ok: false,
      message: "Memory cannot be pinned right now.",
    };
  }

  return {
    ok: true,
    data: {
      dashboardData: await loadMemoryDashboardData(user.id),
    },
  };
}

export async function ignoreMemorySuggestion(
  memoryId: string,
): Promise<MemoryActionResult<MemorySuggestionActionData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const ignored = await memoryService.ignoreSuggestedMemory(user.id, memoryId);

  if (!ignored) {
    return {
      ok: false,
      message: "Memory was not found.",
    };
  }

  return {
    ok: true,
    data: {
      dashboardData: await loadMemoryDashboardData(user.id),
    },
  };
}

export async function cancelPinnedMemorySuggestion(
  memoryId: string,
): Promise<MemoryActionResult<MemorySuggestionActionData>> {
  const user = await requireCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const canceled = await memoryService.cancelSuggestedPin(user.id, memoryId);

  if (!canceled) {
    return {
      ok: false,
      message: "Pinned memory was not found.",
    };
  }

  return {
    ok: true,
    data: {
      dashboardData: await loadMemoryDashboardData(user.id),
    },
  };
}
