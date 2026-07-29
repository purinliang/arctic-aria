"use client";

import type { ProjectDashboardData } from "@/features/projects/actions";
import type { RoutineDashboardData } from "@/features/routines/actions";
import type { MemoryDashboardData } from "@/features/memories/actions";
import type { EventDashboardData } from "@/features/events/actions";

export type DashboardBrowserCacheData = {
  events: EventDashboardData;
  projects: ProjectDashboardData;
  routines: RoutineDashboardData;
  memories: MemoryDashboardData;
};

export type DashboardBrowserCacheSection = keyof DashboardBrowserCacheData;

type BrowserStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type DashboardBrowserCacheEnvelope<
  Section extends DashboardBrowserCacheSection,
> = {
  schemaVersion: 1;
  userId: string;
  section: Section;
  data: DashboardBrowserCacheData[Section];
};

const cacheKeyPrefix = "arctic-aria.dashboard-browser-cache.v1";

export function dashboardBrowserCacheKey(
  userId: string,
  section: DashboardBrowserCacheSection,
) {
  return `${cacheKeyPrefix}.${encodeURIComponent(userId)}.${section}`;
}

export function readDashboardBrowserCacheSection<
  Section extends DashboardBrowserCacheSection,
>(
  userId: string,
  section: Section,
  storage = browserStorage(),
): DashboardBrowserCacheData[Section] | null {
  if (!storage) {
    return null;
  }

  const key = dashboardBrowserCacheKey(userId, section);

  try {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);

    if (!isCacheEnvelope(parsed, userId, section)) {
      safeRemoveItem(storage, key);
      return null;
    }

    return parsed.data;
  } catch {
    safeRemoveItem(storage, key);
    return null;
  }
}

export function writeDashboardBrowserCacheSection<
  Section extends DashboardBrowserCacheSection,
>(
  userId: string,
  section: Section,
  data: DashboardBrowserCacheData[Section],
  storage = browserStorage(),
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      dashboardBrowserCacheKey(userId, section),
      JSON.stringify({
        schemaVersion: 1,
        userId,
        section,
        data,
      } satisfies DashboardBrowserCacheEnvelope<Section>),
    );
  } catch {
    // The page can still use live server data when browser storage is blocked.
  }
}

export function clearDashboardBrowserCacheSection(
  userId: string,
  section: DashboardBrowserCacheSection,
  storage = browserStorage(),
) {
  if (!storage) {
    return;
  }

  safeRemoveItem(storage, dashboardBrowserCacheKey(userId, section));
}

function browserStorage(): BrowserStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeRemoveItem(storage: BrowserStorage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore blocked browser storage and keep rendering from live data.
  }
}

function isCacheEnvelope<Section extends DashboardBrowserCacheSection>(
  value: unknown,
  userId: string,
  section: Section,
): value is DashboardBrowserCacheEnvelope<Section> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DashboardBrowserCacheEnvelope<Section>>;

  return (
    candidate.schemaVersion === 1 &&
    candidate.userId === userId &&
    candidate.section === section &&
    hasExpectedDataShape(section, candidate.data)
  );
}

function hasExpectedDataShape(
  section: DashboardBrowserCacheSection,
  data: unknown,
) {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  if (section === "projects") {
    return Array.isArray(candidate.tasks) && Array.isArray(candidate.projects);
  }

  if (section === "routines") {
    return (
      Array.isArray(candidate.routines) &&
      Array.isArray(candidate.routineDefinitions)
    );
  }

  if (section === "events") {
    return (
      Array.isArray(candidate.events) &&
      Array.isArray(candidate.todayEvents)
    );
  }

  return (
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.pinnedMemories) &&
    Array.isArray(candidate.memoryRecords)
  );
}
