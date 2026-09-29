import type { Dispatch, SetStateAction } from "react";
import {
  notifyActionFailure,
  runNotifiedServerAction,
} from "@/app-shell/action-notifications";
import { moveProjectTaskToTomorrow } from "@/features/projects/actions";
import type { ProjectDashboardData } from "@/features/projects/actions";
import type {
  NotificationMessages,
  ProjectMessages,
} from "@/messages/app-messages";

export function useDashboardTaskMove(input: {
  tasks: ProjectDashboardData["tasks"];
  setTasks: Dispatch<SetStateAction<ProjectDashboardData["tasks"]>>;
  notificationMessages?: NotificationMessages;
  resultMessages?: ProjectMessages["results"];
  showErrorNotification: (message: string, title?: string) => void;
}) {
  return async function moveTaskToTomorrow(taskId: string) {
    const task = input.tasks.find((item) => item.id === taskId);
    if (!task || task.status === "done") {
      return;
    }

    const index = input.tasks.findIndex((item) => item.id === taskId);
    input.setTasks((current) => current.filter((item) => item.id !== taskId));

    const restore = () =>
      input.setTasks((current) => {
        if (current.some((item) => item.id === taskId)) {
          return current;
        }
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, task);
        return next;
      });

    const actionResult = await runNotifiedServerAction({
      action: () => moveProjectTaskToTomorrow(taskId),
      messages: input.notificationMessages,
      showErrorNotification: input.showErrorNotification,
    });

    if (!actionResult.ok) {
      restore();
      return;
    }

    if (!actionResult.value.ok) {
      restore();
      notifyActionFailure({
        result: actionResult.value,
        resultMessages: input.resultMessages,
        fallbackTitle:
          input.resultMessages?.task_move_unavailable ??
          "Task could not be moved to tomorrow.",
        notificationMessages: input.notificationMessages,
        showErrorNotification: input.showErrorNotification,
      });
    }
  };
}
