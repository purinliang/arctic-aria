"use server";

import { getCurrentUser } from "@/features/auth/actions";
import { ideaService } from "./server/idea-service";
import type { IdeaRecord, IdeaSource } from "./server/idea-repository";
import type { ActionFailureResult } from "../../messages/action-result.ts";

export type IdeaPageItem = {
  id: string;
  rawText: string;
  source: IdeaSource;
  triageStatus: "untriaged" | "kept" | "converted" | "archived";
  createdDate: string;
};

export type IdeaInput = {
  id?: string;
  rawText: string;
};

export type IdeaActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

function unauthorizedResult<T>(): IdeaActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
    category: "auth",
  };
}

function unavailableResult<T>(): IdeaActionResult<T> {
  return {
    ok: false,
    message: "Ideas are unavailable.",
    code: "ideas_unavailable",
    category: "database_connection",
  };
}

function toIdeaPageItem(idea: IdeaRecord): IdeaPageItem {
  return {
    id: idea.id,
    rawText: idea.rawText,
    source: idea.source,
    triageStatus: idea.triageStatus,
    createdDate: idea.createdAt.toISOString().slice(0, 10),
  };
}

export async function getIdeaPageData(): Promise<
  IdeaActionResult<IdeaPageItem[]>
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    return {
      ok: true,
      data: (await ideaService.listIdeas(user.id)).map(toIdeaPageItem),
    };
  } catch (error) {
    console.error("[ideas]", "list_failed", {
      userId: user.id,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown",
    });

    return unavailableResult();
  }
}

export async function captureWebIdea(
  rawText: string,
): Promise<IdeaActionResult<IdeaPageItem>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const result = await ideaService.captureIdea({
    userId: user.id,
    rawText,
    source: "web",
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toIdeaPageItem(result.idea),
  };
}

export async function saveIdea(
  input: IdeaInput,
): Promise<IdeaActionResult<IdeaPageItem>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const result = await ideaService.saveWebIdea({
    userId: user.id,
    ideaId: input.id,
    rawText: input.rawText,
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: toIdeaPageItem(result.idea),
  };
}

export async function deleteIdea(
  ideaId: string,
): Promise<IdeaActionResult<{ id: string }>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const result = await ideaService.archiveIdea({
    userId: user.id,
    ideaId,
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: { id: ideaId },
  };
}
