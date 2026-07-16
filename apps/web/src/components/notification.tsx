import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

export function useNotifications() {
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
    (message: string, title = "Action failed") => {
      showNotification("error", message, title);
    },
    [showNotification],
  );

  const showInfoNotification = useCallback(
    (message: string, title = "Not available yet") => {
      showNotification("info", message, title);
    },
    [showNotification],
  );

  const showSuccessNotification = useCallback(
    (message: string, title = "Done") => {
      showNotification("success", message, title);
    },
    [showNotification],
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
  onDismiss,
}: {
  notifications: NotificationItem[];
  darkMode: boolean;
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
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationToast({
  notification,
  darkMode,
  onDismiss,
}: {
  notification: NotificationItem;
  darkMode: boolean;
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
          darkMode
            ? "text-current opacity-80 hover:bg-white/10 hover:opacity-100"
            : "text-current opacity-80 hover:bg-black/5 hover:opacity-100",
        )}
        type="button"
        aria-label="Dismiss notification"
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
