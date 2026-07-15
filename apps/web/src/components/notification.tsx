import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";
import { cx } from "./utils";

export type NotificationItem = {
  id: number;
  tone: "error" | "info";
  title: string;
  message: string;
};

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
    const timeoutId = window.setTimeout(() => {
      onDismiss(notification.id);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [notification.id, onDismiss]);

  return (
    <section
      className={cx(
        "grid grid-cols-[auto_1fr_auto] gap-3 rounded-md border px-4 py-3 shadow-2xl",
        notification.tone === "error"
          ? darkMode
            ? "border-red-400/40 bg-red-950 text-red-50"
            : "border-red-200 bg-red-50 text-red-900"
          : darkMode
            ? "border-blue-400/40 bg-blue-950 text-blue-50"
            : "border-blue-200 bg-blue-50 text-blue-900",
      )}
      role="status"
    >
      <AlertCircle
        className={
          notification.tone === "error"
            ? darkMode
              ? "text-red-200"
              : "text-red-600"
            : darkMode
              ? "text-blue-200"
              : "text-blue-600"
        }
        size={18}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{notification.title}</h2>
        <p
          className={cx(
            "mt-1 text-sm leading-5",
            notification.tone === "error"
              ? darkMode
                ? "text-red-100"
                : "text-red-800"
              : darkMode
                ? "text-blue-100"
                : "text-blue-800",
          )}
        >
          {notification.message}
        </p>
      </div>
      <button
        className={cx(
          "flex h-7 w-7 items-center justify-center rounded-md transition",
          darkMode
            ? "text-white/80 hover:bg-white/10"
            : notification.tone === "error"
              ? "text-red-700 hover:bg-red-100"
              : "text-blue-700 hover:bg-blue-100",
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
