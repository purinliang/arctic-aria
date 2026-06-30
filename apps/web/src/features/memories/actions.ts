"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type { MemoryRecord, PinnedMemory } from "@/features/dashboard/types";
import { memoryService } from "./server/memory-service";
import type { DashboardPinnedMemory } from "./server/memory-service";
import type { MemoryRecord as ServerMemoryRecord } from "./server/memory-repository";

export type MemoryDashboardData = {
  pinnedMemories: PinnedMemory[];
  memoryRecords: MemoryRecord[];
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
    category: memory.categoryName,
    title: memory.title,
    description: memory.description,
    lastDoneText: formatLastDone(memory),
    doneCount: memory.doneCount,
    pinned: pinnedMemoryIds.has(memory.id),
  };
}

async function loadMemoryDashboardData(userId: string): Promise<MemoryDashboardData> {
  const [pinnedMemories, memoryRecords] = await Promise.all([
    memoryService.listDashboardPinnedMemories(userId),
    memoryService.listMemoryLibrary(userId),
  ]);
  const pinnedMemoryIds = new Set(
    pinnedMemories.map((memory) => memory.memoryId),
  );

  return {
    pinnedMemories: pinnedMemories.map(toPinnedMemory),
    memoryRecords: memoryRecords.map((memory) =>
      toMemoryRecord(memory, pinnedMemoryIds),
    ),
  };
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
