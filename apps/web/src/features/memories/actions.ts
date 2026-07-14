"use server";

import { getCurrentUser } from "@/features/auth/actions";
import {
  databaseMessage,
  loadMemoryDashboardData,
  resolveMemoryInputCategory,
  toMemorySuggestion,
  unauthorizedResult,
  validateCategoryInput,
  validateMemoryInput,
} from "./memory-action-helpers";
import type {
  MemoryActionResult,
  MemoryCategoryInput,
  MemoryDashboardData,
  MemoryInput,
  MemorySuggestionActionData,
  MemorySuggestionRefreshData,
} from "./memory-action-helpers";
import { memoryService } from "./server/memory-service";

export type {
  MemoryActionResult,
  MemoryCategoryInput,
  MemoryDashboardData,
  MemoryInput,
  MemorySuggestionActionData,
  MemorySuggestionRefreshData,
} from "./memory-action-helpers";

async function requireCurrentUser() {
  return getCurrentUser();
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

  const categoryId = resolveMemoryInputCategory(
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
