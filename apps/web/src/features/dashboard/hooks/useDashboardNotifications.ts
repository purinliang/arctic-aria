import { useCallback, useState } from "react";
import type { NotificationItem } from "@/components/ui/notification";

export function useDashboardNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismissNotification = useCallback((notificationId: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
  }, []);

  const showErrorNotification = useCallback(
    (message: string, title = "Action failed") => {
      setNotifications((current) => [
        ...current.slice(-2),
        {
          id: Date.now(),
          tone: "error",
          title,
          message,
        },
      ]);
    },
    [],
  );

  const showInfoNotification = useCallback(
    (message: string, title = "Not available yet") => {
      setNotifications((current) => [
        ...current.slice(-2),
        {
          id: Date.now(),
          tone: "info",
          title,
          message,
        },
      ]);
    },
    [],
  );

  return {
    notifications,
    dismissNotification,
    showErrorNotification,
    showInfoNotification,
  };
}
