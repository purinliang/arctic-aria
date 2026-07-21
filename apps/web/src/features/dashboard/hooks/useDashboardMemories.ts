import { useCallback, useEffect, useRef, useState } from "react";
import {
  readDashboardBrowserCacheSection,
  writeDashboardBrowserCacheSection,
} from "@/app-shell/dashboard-browser-cache";
import {
  notifyActionFailure,
  runNotifiedServerAction,
} from "@/app-shell/action-notifications";
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
import type {
  DashboardMessages,
  MemoryMessages,
  NotificationMessages,
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
type MemoryPinAction = () => Promise<
  MemoryActionResult<{ dashboardData: MemoryDashboardData }>
>;

export function useDashboardMemories(
  userId: string,
  showErrorNotification: (message: string, title?: string) => void,
  messages?: DashboardMessages["notifications"],
  resultMessages?: MemoryMessages["results"],
  notificationMessages?: NotificationMessages,
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
  const actionFailedTitle = (
    action: keyof NotificationMessages["actionWords"],
    subject: keyof NotificationMessages["subjectWords"],
  ) =>
    notificationMessages?.actionFailedTitle?.(
      notificationMessages.actionWords[action],
      notificationMessages.subjectWords[subject],
    ) ??
    `${String(action).charAt(0).toUpperCase() + String(action).slice(1)} ${
      String(subject).charAt(0).toUpperCase() + String(subject).slice(1)
    } failed`;

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
    const actionResult = await runNotifiedServerAction({
      action: getMemoryDashboardData,
      messages: notificationMessages,
      showErrorNotification,
    });

    if (!actionResult.ok) {
      setMemoryLoading(false);
      return;
    }

    const result = actionResult.value;

    if (!result.ok) {
      notifyActionFailure({
        result,
        resultMessages,
        fallbackTitle: messages?.memoriesUnavailable ?? "Memories unavailable",
        notificationMessages,
        showErrorNotification,
      });
      setMemoryLoading(false);
      return;
    }

    applyMemoryData(result.data);
  }, [
    applyMemoryData,
    messages,
    notificationMessages,
    resultMessages,
    showErrorNotification,
  ]);

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
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        if (
          pinnedMemoryRequestVersions.current.get(pinnedMemoryId) ===
          requestVersion
        ) {
          setPinnedMemories((current) =>
            restorePinnedMemorySnapshot(current, snapshot, pinnedMemoryId),
          );
        }
        return;
      }

      const result = actionResult.value;

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
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: actionFailedTitle("update", "memory"),
          notificationMessages,
          showErrorNotification,
        });
        return;
      }
    } finally {
      finishMemoryAction();
    }
  }

  async function runMemoryManagementAction(
    action: MemoryDataAction,
    failureTitle: string,
  ) {
    beginMemoryAction();

    try {
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        return false;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: failureTitle,
          notificationMessages,
          showErrorNotification,
        });
        return false;
      }

      applyMemoryData(result.data);
      return true;
    } finally {
      finishMemoryAction();
    }
  }

  async function runMemoryManagementDataAction(
    action: MemoryDataAction,
    failureTitle: string,
  ) {
    beginMemoryAction();

    try {
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        return null;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: failureTitle,
          notificationMessages,
          showErrorNotification,
        });
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
      const actionResult = await runNotifiedServerAction({
        action: () => refreshMemorySuggestions(ignoredMemoryIds),
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        setMemorySuggestions([]);
        setPinnedSuggestionIds([]);
        return;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: actionFailedTitle("update", "suggestion"),
          notificationMessages,
          showErrorNotification,
        });
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

  async function runMemoryPinAction({
    memoryId,
    action,
    failureTitle,
    onSuccess,
  }: {
    memoryId: string;
    action: MemoryPinAction;
    failureTitle: string;
    onSuccess?: () => void;
  }) {
    setPendingSuggestionIds((current) =>
      addPendingSuggestionId(current, memoryId),
    );

    try {
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        return false;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: failureTitle,
          notificationMessages,
          showErrorNotification,
        });
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      onSuccess?.();
      return true;
    } finally {
      setPendingSuggestionIds((current) =>
        removePendingSuggestionId(current, memoryId),
      );
    }
  }

  function pinMemoryFromPage(memoryId: string) {
    return runMemoryPinAction({
      memoryId,
      action: () => pinMemorySuggestion(memoryId),
      failureTitle: actionFailedTitle("pin", "memory"),
    });
  }

  function unpinMemoryFromPage(memoryId: string) {
    return runMemoryPinAction({
      memoryId,
      action: () => cancelPinnedMemorySuggestion(memoryId),
      failureTitle: actionFailedTitle("unpin", "memory"),
    });
  }

  function pinSuggestionFromPage(memoryId: string) {
    return runMemoryPinAction({
      memoryId,
      action: () => pinMemorySuggestion(memoryId),
      failureTitle: actionFailedTitle("pin", "suggestion"),
      onSuccess: () => {
        setMemorySuggestions((current) =>
          removeMemorySuggestion(current, memoryId),
        );
        setPinnedSuggestionIds((current) =>
          current.filter((suggestionId) => suggestionId !== memoryId),
        );
      },
    });
  }

  function cancelSuggestionPinFromPage(memoryId: string) {
    return runMemoryPinAction({
      memoryId,
      action: () => cancelPinnedMemorySuggestion(memoryId),
      failureTitle: actionFailedTitle("unpin", "suggestion"),
      onSuccess: () => {
        setPinnedSuggestionIds((current) =>
          current.filter((suggestionId) => suggestionId !== memoryId),
        );
      },
    });
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
      runMemoryManagementAction(
        () => saveMemory(input),
        actionFailedTitle("save", "memory"),
      ),
    deleteMemoryFromPage: (memoryId: string) =>
      runMemoryManagementAction(
        () => deleteMemory(memoryId),
        actionFailedTitle("delete", "memory"),
      ),
    saveCategoryFromPage: (input: MemoryCategoryInput) =>
      runMemoryManagementDataAction(
        () => saveMemoryCategory(input),
        actionFailedTitle("save", "category"),
      ),
    deleteCategoryFromPage: (categoryId: string) =>
      runMemoryManagementAction(
        () => deleteMemoryCategory(categoryId),
        actionFailedTitle("delete", "category"),
      ),
    refreshSuggestionsFromPage,
    pinMemoryFromPage,
    unpinMemoryFromPage,
    pinSuggestionFromPage,
    cancelSuggestionPinFromPage,
  };
}
