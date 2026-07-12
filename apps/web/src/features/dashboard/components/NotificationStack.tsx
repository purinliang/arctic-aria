import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

export type DashboardNotification = {
  id: number;
  tone: "error";
  title: string;
  message: string;
};

export function NotificationStack({
  notifications,
  darkMode,
  onDismiss,
}: {
  notifications: DashboardNotification[];
  darkMode: boolean;
  onDismiss: (notificationId: number) => void;
}) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 top-4 z-[80] grid w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:w-96 lg:translate-x-0"
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
  notification: DashboardNotification;
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
      className={`grid grid-cols-[auto_1fr_auto] gap-3 rounded-md border px-4 py-3 shadow-2xl ${
        darkMode
          ? "border-red-400/40 bg-red-950 text-red-50"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
      role="status"
    >
      <AlertCircle
        className={darkMode ? "text-red-200" : "text-red-600"}
        size={18}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{notification.title}</h2>
        <p
          className={`mt-1 text-sm leading-5 ${
            darkMode ? "text-red-100" : "text-red-800"
          }`}
        >
          {notification.message}
        </p>
      </div>
      <button
        className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
          darkMode
            ? "text-red-100 hover:bg-white/10"
            : "text-red-700 hover:bg-red-100"
        }`}
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(notification.id)}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </section>
  );
}
