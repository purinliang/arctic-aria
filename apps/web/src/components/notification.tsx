import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationMessages } from "@/messages/app-messages";
import { toneClass, type Tone } from "./color";
import { cx } from "./utils";

const maxVisibleNotifications = 3;
const dismissAnimationMs = 220;

export type NotificationItem = {
  id: number;
  tone: "error" | "info" | "success";
  title: string;
  message: string;
  dismissing?: boolean;
};

const defaultNotificationMessages: NotificationMessages = {
  actionFailed: "Action failed",
  actionFailedTitle: (action: string, subject: string) =>
    `${action} ${subject.toLowerCase()} failed`,
  actionWords: {
    add: "Add",
    archive: "Archive",
    delete: "Delete",
    edit: "Edit",
    pin: "Pin",
    saving: "Saving",
    save: "Save",
    unpin: "Unpin",
    update: "Update",
  },
  subjectWords: {
    category: "Category",
    discord: "Discord",
    group: "Group",
    idea: "Idea",
    memory: "Memory",
    milestone: "Milestone",
    project: "Project",
    routine: "Routine",
    settings: "Settings",
    suggestion: "Suggestion",
    task: "Task",
  },
  fieldWords: {
    category: "category",
    category_name: "name",
    date: "date",
    dates: "dates",
    deadline: "deadline",
    description: "description",
    end_date: "end date",
    expected_duration: "expected duration",
    first_start_date: "first start date",
    group: "group",
    name: "name",
    objective: "objective",
    preferred_time: "preferred time",
    rule: "rule",
    start_date: "start date",
    text: "text",
    timezone: "timezone",
    title: "title",
  },
  parameterFailureMessages: {
    beforeStart: (field: string, startField: string) =>
      `${field} cannot be before ${startField}.`,
    chooseRequired: (field: string) => `Choose ${field}.`,
    duplicateName: (subject: string) =>
      `A ${subject} with that name already exists.`,
    inUse: (subject: string) => `This ${subject} is still in use.`,
    invalidFormatDate: (field: string) =>
      `${field} must be a real date in YYYY-MM-DD format.`,
    invalidFormatTime: (field: string) => `${field} must use HH:MM format.`,
    invalidValue: (field: string) => `${field} is invalid.`,
    limitReached: (action: string, subject: string, limit?: number) =>
      limit === undefined
        ? `${action} ${subject} limit reached.`
        : `You can ${action} up to ${limit} ${subject}s.`,
    protected: (subject: string) => `This ${subject} is protected.`,
    required: (field: string) => `${field} is required.`,
    selectRequired: (field: string) => `Select ${field}.`,
    tooLong: (field: string, limit?: number) =>
      limit === undefined
        ? `${field} is too long.`
        : `${field} must be ${limit} characters or fewer.`,
    tooShort: (field: string, limit?: number) =>
      limit === undefined
        ? `${field} is too short.`
        : `${field} must be at least ${limit} characters.`,
  },
  databaseConnectionFailedMessage:
    "Database connection failed. Please try again.",
  databaseConnectionFailedTitle: "Database connection failed",
  databaseUpdateFailedMessage: "Database update failed. Please try again.",
  databaseUpdateFailedTitle: "Database update failed",
  invalidParameterMessage: "A parameter is invalid.",
  invalidParameterTitle: "Parameter invalid",
  missingParameterMessage: "A required parameter is missing.",
  missingParameterTitle: "Parameter missing",
  serverActionFailedMessage:
    "The server hit an internal error. Please try again.",
  serverActionFailedTitle: "Server error",
  targetNotFoundMessage: "The requested item was not found.",
  targetNotFoundTitle: "Target not found",
  notAvailableYet: "Not available yet",
  operationTooFrequentMessage: "Please wait before trying again.",
  operationTooFrequentTitle: "Please wait a moment",
  done: "Done",
  dismiss: "Dismiss notification",
};

export function useNotifications(
  messages: NotificationMessages = defaultNotificationMessages,
) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const nextNotificationId = useRef(0);

  const dismissNotification = useCallback((notificationId: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, dismissing: true }
          : notification,
      ),
    );

    window.setTimeout(() => {
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId),
      );
    }, dismissAnimationMs);
  }, []);

  const showNotification = useCallback(
    (tone: NotificationItem["tone"], message: string, title: string) => {
      const notification: NotificationItem = {
        id: Date.now() * 1000 + nextNotificationId.current,
        tone,
        title,
        message,
      };

      nextNotificationId.current += 1;

      setNotifications((current) => {
        const next = [...current, notification];
        let overflowCount =
          next.filter((item) => !item.dismissing).length -
          maxVisibleNotifications;

        if (overflowCount <= 0) {
          return next;
        }

        return next.map((item) => {
          if (item.dismissing || overflowCount <= 0) {
            return item;
          }

          overflowCount -= 1;
          return { ...item, dismissing: true };
        });
      });

      window.setTimeout(() => {
        setNotifications((current) =>
          current.filter((notification) => !notification.dismissing),
        );
      }, dismissAnimationMs);
    },
    [],
  );

  const showErrorNotification = useCallback(
    (message: string, title = messages.actionFailed) => {
      showNotification("error", message, title);
    },
    [messages.actionFailed, showNotification],
  );

  const showInfoNotification = useCallback(
    (message: string, title = messages.notAvailableYet) => {
      showNotification("info", message, title);
    },
    [messages.notAvailableYet, showNotification],
  );

  const showSuccessNotification = useCallback(
    (message: string, title = messages.done) => {
      showNotification("success", message, title);
    },
    [messages.done, showNotification],
  );

  return {
    notifications,
    dismissNotification,
    showErrorNotification,
    showInfoNotification,
    showSuccessNotification,
  };
}

export function NotificationStack({
  notifications,
  darkMode,
  messages = defaultNotificationMessages,
  onDismiss,
}: {
  notifications: NotificationItem[];
  darkMode: boolean;
  messages?: NotificationMessages;
  onDismiss: (notificationId: number) => void;
}) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[80] grid w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 lg:translate-x-0"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          darkMode={darkMode}
          messages={messages}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationToast({
  notification,
  darkMode,
  messages,
  onDismiss,
}: {
  notification: NotificationItem;
  darkMode: boolean;
  messages: NotificationMessages;
  onDismiss: (notificationId: number) => void;
}) {
  useEffect(() => {
    if (notification.dismissing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismiss(notification.id);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [notification.dismissing, notification.id, onDismiss]);

  const Icon =
    notification.tone === "success"
      ? CheckCircle2
      : notification.tone === "info"
        ? Info
        : AlertCircle;

  return (
    <section
      data-dismissing={notification.dismissing ? "true" : "false"}
      className={cx(
        "aa-notification-toast grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border px-4 py-4 shadow-2xl",
        toneClass(darkMode, notificationTone(notification.tone)),
      )}
      role="status"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon size={18} aria-hidden="true" />
          <h2 className="min-w-0 text-sm font-semibold">
            {notification.title}
          </h2>
        </div>
        <p className="mt-1 text-sm leading-5 opacity-90">
          {notification.message}
        </p>
      </div>
      <button
        className={cx(
          "flex h-[18px] w-[18px] items-center justify-center self-start rounded transition",
          "text-current opacity-80 hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] hover:opacity-100",
        )}
        type="button"
        aria-label={messages.dismiss}
        onClick={() => onDismiss(notification.id)}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </section>
  );
}

function notificationTone(tone: NotificationItem["tone"]): Tone {
  if (tone === "success") {
    return "emerald";
  }

  if (tone === "info") {
    return "blue";
  }

  return "red";
}
