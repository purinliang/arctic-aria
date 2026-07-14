import { useCallback, useState } from "react";
import {
  cancelPinnedMemoryDone,
  cancelPinnedMemorySuggestion,
  completePinnedMemory,
  deleteMemory,
  deleteMemoryCategory,
  getMemoryDashboardData,
  pinMemorySuggestion,
  replacePinnedMemory,
  refreshMemorySuggestions,
  saveMemory,
  saveMemoryCategory,
  type MemoryActionResult,
  type MemoryCategoryInput,
  type MemoryDashboardData,
  type MemoryInput,
} from "@/features/memories/actions";
import {
  addPendingSuggestionId,
  applyOptimisticPinnedMemoryStatus,
  removeMemorySuggestion,
  removePendingSuggestionId,
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
  showErrorNotification: (message: string, title?: string) => void,
  showMemoriesView: (memoryId?: string) => void,
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
  const [memoryMessage, setMemoryMessage] = useState<string | null>(null);
  const [memoryActionPending, setMemoryActionPending] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [pinnedSuggestionIds, setPinnedSuggestionIds] = useState<string[]>([]);
  const [pendingSuggestionIds, setPendingSuggestionIds] = useState<string[]>([]);
  const [suggestionsRequested, setSuggestionsRequested] = useState(false);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  const applyMemoryData = useCallback(
    (data: MemoryDashboardData, nextExpandedMemoryId?: string | null) => {
      setPinnedMemories(data.pinnedMemories);
      setMemoryCategories(data.categories);
      setMemoryRecords(data.memoryRecords);
      setExpandedMemoryId((current) => {
        if (nextExpandedMemoryId !== undefined) {
          return nextExpandedMemoryId;
        }

        if (
          current &&
          data.pinnedMemories.some((memory) => memory.id === current)
        ) {
          return current;
        }

        return data.pinnedMemories[0]?.id ?? null;
      });
    },
    [],
  );

  const refreshMemoryData = useCallback(async () => {
    const result = await getMemoryDashboardData();

    if (!result.ok) {
      setMemoryMessage(result.message);
      setPinnedMemories([]);
      setMemoryCategories([]);
      setMemoryRecords([]);
      setExpandedMemoryId(null);
      setMemoryLoading(false);
      return;
    }

    applyMemoryData(result.data);
    setMemoryLoading(false);
  }, [applyMemoryData]);

  async function runMemoryAction(
    action: MemoryDataAction,
    nextExpandedMemoryId: string | null,
    onFailure?: () => void,
  ) {
    setMemoryMessage(null);
    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(result.message);
        return;
      }

      applyMemoryData(result.data, nextExpandedMemoryId);
    } finally {
      setMemoryActionPending(false);
    }
  }

  async function runMemoryManagementAction(action: MemoryDataAction) {
    setMemoryMessage(null);
    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setMemoryMessage(result.message);
        return false;
      }

      applyMemoryData(result.data);
      return true;
    } finally {
      setMemoryActionPending(false);
    }
  }

  async function runMemoryManagementDataAction(action: MemoryDataAction) {
    setMemoryMessage(null);
    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setMemoryMessage(result.message);
        return null;
      }

      applyMemoryData(result.data);
      return result.data;
    } finally {
      setMemoryActionPending(false);
    }
  }

  function markMemoryDone(pinnedMemoryId: string) {
    const previousPinnedMemories = pinnedMemories;

    setExpandedMemoryId(null);
    setPinnedMemories((current) =>
      applyOptimisticPinnedMemoryStatus(current, pinnedMemoryId, "completed"),
    );
    void runMemoryAction(
      () => completePinnedMemory(pinnedMemoryId),
      null,
      () => setPinnedMemories(previousPinnedMemories),
    );
  }

  function cancelMemoryDone(pinnedMemoryId: string) {
    const previousPinnedMemories = pinnedMemories;

    setExpandedMemoryId(null);
    setPinnedMemories((current) =>
      applyOptimisticPinnedMemoryStatus(current, pinnedMemoryId, "active"),
    );
    void runMemoryAction(
      () => cancelPinnedMemoryDone(pinnedMemoryId),
      null,
      () => setPinnedMemories(previousPinnedMemories),
    );
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
        showErrorNotification(result.message);
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
        showErrorNotification(result.message);
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
        showErrorNotification(result.message);
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
    memoryMessage,
    memoryActionPending,
    suggestionLoading,
    pinnedSuggestionIds,
    pendingSuggestionIds,
    suggestionsRequested,
    selectedMemoryId,
    expandedMemoryId,
    setExpandedMemoryId,
    refreshMemoryData,
    markMemoryDone,
    cancelMemoryDone,
    replaceMemory: (pinnedMemoryId: string) => {
      setExpandedMemoryId(null);
      void runMemoryAction(() => replacePinnedMemory(pinnedMemoryId), null);
    },
    viewMemory: (memoryId: string) => {
      setSelectedMemoryId(memoryId);
      showMemoriesView(memoryId);
    },
    saveMemoryFromPage: (input: MemoryInput) =>
      runMemoryManagementAction(() => saveMemory(input)),
    deleteMemoryFromPage: (memoryId: string) =>
      runMemoryManagementAction(() => deleteMemory(memoryId)),
    saveCategoryFromPage: (input: MemoryCategoryInput) =>
      runMemoryManagementDataAction(() => saveMemoryCategory(input)),
    deleteCategoryFromPage: (categoryId: string) =>
      runMemoryManagementAction(() => deleteMemoryCategory(categoryId)),
    clearMemoryMessage: () => setMemoryMessage(null),
    refreshSuggestionsFromPage,
    pinSuggestionFromPage,
    cancelSuggestionPinFromPage,
  };
}
