import { useCallback, useState } from "react";
import {
  notifyActionFailure,
  runNotifiedServerAction,
} from "@/app-shell/action-notifications";
import type {
  IdeaMessages,
  NotificationMessages,
} from "@/messages/app-messages";
import {
  deleteIdea,
  getIdeaPageData,
  saveIdea,
  type IdeaInput,
  type IdeaPageItem,
} from "../actions";

export function useIdeasPageData(
  messages: IdeaMessages,
  showErrorNotification: (message: string, title?: string) => void,
  notificationMessages?: NotificationMessages,
) {
  const [ideas, setIdeas] = useState<IdeaPageItem[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [ideaActionPending, setIdeaActionPending] = useState(false);
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

  const refreshIdeaData = useCallback(async () => {
    setIdeasLoading(true);

    const actionResult = await runNotifiedServerAction({
      action: getIdeaPageData,
      messages: notificationMessages,
      showErrorNotification,
    });

    if (!actionResult.ok) {
      setIdeasLoading(false);
      return;
    }

    const result = actionResult.value;

    if (result.ok) {
      setIdeas(result.data);
    } else {
      notifyActionFailure({
        result,
        resultMessages: messages.results,
        notificationMessages,
        showErrorNotification,
      });
    }

    setIdeasLoading(false);
  }, [messages.results, notificationMessages, showErrorNotification]);

  async function saveIdeaFromPage(input: IdeaInput) {
    setIdeaActionPending(true);

    try {
      const actionResult = await runNotifiedServerAction({
        action: () => saveIdea(input),
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
          resultMessages: messages.results,
          fallbackTitle: actionFailedTitle("save", "idea"),
          notificationMessages,
          showErrorNotification,
        });
        return false;
      }

      setIdeas((current) =>
        input.id ? replaceIdea(current, result.data) : [result.data, ...current],
      );
      return true;
    } finally {
      setIdeaActionPending(false);
    }
  }

  async function deleteIdeaFromPage(ideaId: string) {
    setIdeaActionPending(true);

    try {
      const actionResult = await runNotifiedServerAction({
        action: () => deleteIdea(ideaId),
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
          resultMessages: messages.results,
          fallbackTitle: actionFailedTitle("delete", "idea"),
          notificationMessages,
          showErrorNotification,
        });
        return false;
      }

      setIdeas((current) => current.filter((idea) => idea.id !== result.data.id));
      return true;
    } finally {
      setIdeaActionPending(false);
    }
  }

  return {
    ideas,
    ideasLoading,
    ideaActionPending,
    refreshIdeaData,
    saveIdeaFromPage,
    deleteIdeaFromPage,
  };
}

function replaceIdea(ideas: IdeaPageItem[], updatedIdea: IdeaPageItem) {
  let replaced = false;
  const nextIdeas = ideas.map((idea) => {
    if (idea.id !== updatedIdea.id) {
      return idea;
    }

    replaced = true;
    return updatedIdea;
  });

  return replaced ? nextIdeas : [updatedIdea, ...ideas];
}
