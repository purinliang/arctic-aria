import { useCallback, useState } from "react";
import { localizedActionMessage } from "@/messages/action-result";
import type { IdeaMessages } from "@/messages/app-messages";
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
) {
  const [ideas, setIdeas] = useState<IdeaPageItem[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [ideaActionPending, setIdeaActionPending] = useState(false);

  const refreshIdeaData = useCallback(async () => {
    setIdeasLoading(true);

    const result = await getIdeaPageData();

    if (result.ok) {
      setIdeas(result.data);
    } else {
      showErrorNotification(
        localizedActionMessage(result, messages.results),
      );
    }

    setIdeasLoading(false);
  }, [messages.results, showErrorNotification]);

  async function saveIdeaFromPage(input: IdeaInput) {
    setIdeaActionPending(true);

    try {
      const result = await saveIdea(input);

      if (!result.ok) {
        showErrorNotification(
          localizedActionMessage(result, messages.results),
          messages.notifications.saveFailed,
        );
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
      const result = await deleteIdea(ideaId);

      if (!result.ok) {
        showErrorNotification(
          localizedActionMessage(result, messages.results),
          messages.notifications.deleteFailed,
        );
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
