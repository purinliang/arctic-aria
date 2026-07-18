import { useCallback, useEffect, useRef, useState } from "react";
import {
  readDashboardBrowserCacheSection,
  writeDashboardBrowserCacheSection,
} from "@/app-shell/dashboard-browser-cache";
import {
  cancelPinnedMemoryDone,
  cancelPinnedMemorySuggestion,
  completePinnedMemory,
  deleteMemory,
  deleteMemoryCategory,
  getMemoryDashboardData,
  pinMemorySuggestion,
  refreshMemorySuggestions,
  saveMemory,
  saveMemoryCategory,
  type MemoryActionResult,
  type MemoryCategoryInput,
  type MemoryDashboardData,
  type MemoryInput,
} from "@/features/memories/actions";
import { localizedActionMessage } from "@/messages/action-result";
import type {
  DashboardMessages,
  MemoryMessages,
} from "@/messages/app-messages";
import {
  addPendingSuggestionId,
  applyOptimisticPinnedMemoryStatus,
  removeMemorySuggestion,
  removePendingSuggestionId,
  restorePinnedMemorySnapshot,
} from "../optimistic-updates";
import type {
  MemoryCategoryOption,
  MemoryRecord,
  MemorySuggestion,
  PinnedMemory,
} from "../types";

type MemoryDataAction = () => Promise<
  MemoryActionResult<MemoryDashboardData>
>;

export function useDashboardMemories(
  userId: string,
  showErrorNotification: (message: string, title?: string) => void,
  messages?: DashboardMessages["notifications"],
  resultMessages?: MemoryMessages["results"],
) {
  const [pinnedMemories, setPinnedMemories] = useState<PinnedMemory[]>([]);
  const [memoryCategories, setMemoryCategories] = useState<
    MemoryCategoryOption[]
  >([]);
  const [memoryRecords, setMemoryRecords] = useState<MemoryRecord[]>([]);
  const [memorySuggestions, setMemorySuggestions] = useState<MemorySuggestion[]>(
    [],
  );
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryCacheReady, setMemoryCacheReady] = useState(false);
  const [memoryActionPending, setMemoryActionPending] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [pinnedSuggestionIds, setPinnedSuggestionIds] = useState<string[]>([]);
  const [pendingSuggestionIds, setPendingSuggestionIds] = useState<string[]>([]);
  const [suggestionsRequested, setSuggestionsRequested] = useState(false);
  const memoryActionPendingCount = useRef(0);
  const pinnedMemoryRequestChains = useRef(new Map<string, Promise<void>>());
  const pinnedMemoryRequestVersions = useRef(new Map<string, number>());

  const applyMemoryData = useCallback((data: MemoryDashboardData) => {
    setPinnedMemories(data.pinnedMemories);
    setMemoryCategories(data.categories);
    setMemoryRecords(data.memoryRecords);
    setMemoryLoading(false);
    setMemoryCacheReady(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cachedData = readDashboardBrowserCacheSection(userId, "memories");

      setPinnedMemories(cachedData?.pinnedMemories ?? []);
      setMemoryCategories(cachedData?.categories ?? []);
      setMemoryRecords(cachedData?.memoryRecords ?? []);
      setMemoryLoading(cachedData === null);
      setMemoryCacheReady(cachedData !== null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    if (!memoryCacheReady) {
      return;
    }

    writeDashboardBrowserCacheSection(userId, "memories", {
      categories: memoryCategories,
      pinnedMemories,
      memoryRecords,
    });
  }, [memoryCacheReady, memoryCategories, memoryRecords, pinnedMemories, userId]);

  const refreshMemoryData = useCallback(async () => {
    const result = await getMemoryDashboardData();

    if (!result.ok) {
      showErrorNotification(
        localizedActionMessage(result, resultMessages),
        messages?.memoriesUnavailable ?? "Memories unavailable",
      );
      setMemoryLoading(false);
      return;
    }

    applyMemoryData(result.data);
  }, [applyMemoryData, messages, resultMessages, showErrorNotification]);

  function beginMemoryAction() {
    memoryActionPendingCount.current += 1;
    setMemoryActionPending(true);
  }

  function finishMemoryAction() {
    memoryActionPendingCount.current = Math.max(
      memoryActionPendingCount.current - 1,
      0,
    );

    if (memoryActionPendingCount.current === 0) {
      setMemoryActionPending(false);
    }
  }

  async function runPinnedMemoryStatusAction({
    pinnedMemoryId,
    requestVersion,
    snapshot,
    action,
  }: {
    pinnedMemoryId: string;
    requestVersion: number;
    snapshot: PinnedMemory[];
    action: MemoryDataAction;
  }) {
    beginMemoryAction();

    try {
      const result = await action();

      if (!result.ok) {
        if (
          pinnedMemoryRequestVersions.current.get(pinnedMemoryId) !==
          requestVersion
        ) {
          return;
        }

        setPinnedMemories((current) =>
          restorePinnedMemorySnapshot(current, snapshot, pinnedMemoryId),
        );
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return;
      }
    } finally {
      finishMemoryAction();
    }
  }

  async function runMemoryManagementAction(action: MemoryDataAction) {
    beginMemoryAction();

    try {
      const result = await action();

      if (!result.ok) {
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return false;
      }

      applyMemoryData(result.data);
      return true;
    } finally {
      finishMemoryAction();
    }
  }

  async function runMemoryManagementDataAction(action: MemoryDataAction) {
    beginMemoryAction();

    try {
      const result = await action();

      if (!result.ok) {
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return null;
      }

      applyMemoryData(result.data);
      return result.data;
    } finally {
      finishMemoryAction();
    }
  }

  function updatePinnedMemoryStatus(
    pinnedMemoryId: string,
    status: PinnedMemory["status"],
  ) {
    let previousPinnedMemories = pinnedMemories;
    const requestVersion =
      (pinnedMemoryRequestVersions.current.get(pinnedMemoryId) ?? 0) + 1;

    pinnedMemoryRequestVersions.current.set(pinnedMemoryId, requestVersion);
    setPinnedMemories((current) => {
      previousPinnedMemories = current;
      return applyOptimisticPinnedMemoryStatus(
        current,
        pinnedMemoryId,
        status,
      );
    });
    const previousRequest =
      pinnedMemoryRequestChains.current.get(pinnedMemoryId) ?? Promise.resolve();
    const request = previousRequest
      .catch(() => undefined)
      .then(() =>
        runPinnedMemoryStatusAction({
          pinnedMemoryId,
          requestVersion,
          snapshot: previousPinnedMemories,
          action: () =>
            status === "completed"
              ? completePinnedMemory(pinnedMemoryId)
              : cancelPinnedMemoryDone(pinnedMemoryId),
        }),
      );

    pinnedMemoryRequestChains.current.set(pinnedMemoryId, request);
    void request.finally(() => {
      if (pinnedMemoryRequestChains.current.get(pinnedMemoryId) === request) {
        pinnedMemoryRequestChains.current.delete(pinnedMemoryId);
      }
    });
  }

  function markMemoryDone(pinnedMemoryId: string) {
    updatePinnedMemoryStatus(pinnedMemoryId, "completed");
  }

  function cancelMemoryDone(pinnedMemoryId: string) {
    updatePinnedMemoryStatus(pinnedMemoryId, "active");
  }

  async function refreshSuggestionsFromPage() {
    setSuggestionsRequested(true);
    setSuggestionLoading(true);

    try {
      const pinnedSuggestionIdSet = new Set([
        ...pinnedSuggestionIds,
        ...pendingSuggestionIds,
      ]);
      const ignoredMemoryIds = memorySuggestions
        .filter((suggestion) => !pinnedSuggestionIdSet.has(suggestion.id))
        .map((suggestion) => suggestion.id);
      const result = await refreshMemorySuggestions(ignoredMemoryIds);

      if (!result.ok) {
        showErrorNotification(localizedActionMessage(result, resultMessages));
        setMemorySuggestions([]);
        setPinnedSuggestionIds([]);
        return;
      }

      applyMemoryData(result.data.dashboardData);
      setMemorySuggestions(result.data.suggestions);
      setPinnedSuggestionIds([]);
    } finally {
      setSuggestionLoading(false);
    }
  }

  async function pinSuggestionFromPage(memoryId: string) {
    setPendingSuggestionIds((current) =>
      addPendingSuggestionId(current, memoryId),
    );

    try {
      const result = await pinMemorySuggestion(memoryId);

      if (!result.ok) {
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      setMemorySuggestions((current) =>
        removeMemorySuggestion(current, memoryId),
      );
      setPinnedSuggestionIds((current) =>
        current.filter((suggestionId) => suggestionId !== memoryId),
      );
      return true;
    } finally {
      setPendingSuggestionIds((current) =>
        removePendingSuggestionId(current, memoryId),
      );
    }
  }

  async function cancelSuggestionPinFromPage(memoryId: string) {
    setPendingSuggestionIds((current) =>
      addPendingSuggestionId(current, memoryId),
    );

    try {
      const result = await cancelPinnedMemorySuggestion(memoryId);

      if (!result.ok) {
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      setPinnedSuggestionIds((current) =>
        current.filter((suggestionId) => suggestionId !== memoryId),
      );
      return true;
    } finally {
      setPendingSuggestionIds((current) =>
        removePendingSuggestionId(current, memoryId),
      );
    }
  }

  return {
    pinnedMemories,
    memoryCategories,
    memoryRecords,
    memorySuggestions,
    memoryLoading,
    memoryActionPending,
    suggestionLoading,
    pinnedSuggestionIds,
    pendingSuggestionIds,
    suggestionsRequested,
    refreshMemoryData,
    markMemoryDone,
    cancelMemoryDone,
    saveMemoryFromPage: (input: MemoryInput) =>
      runMemoryManagementAction(() => saveMemory(input)),
    deleteMemoryFromPage: (memoryId: string) =>
      runMemoryManagementAction(() => deleteMemory(memoryId)),
    saveCategoryFromPage: (input: MemoryCategoryInput) =>
      runMemoryManagementDataAction(() => saveMemoryCategory(input)),
    deleteCategoryFromPage: (categoryId: string) =>
      runMemoryManagementAction(() => deleteMemoryCategory(categoryId)),
    refreshSuggestionsFromPage,
    pinSuggestionFromPage,
    cancelSuggestionPinFromPage,
  };
}
