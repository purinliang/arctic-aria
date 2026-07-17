"use server";

import { getCurrentUser } from "@/features/auth/actions";
import { ideaService } from "./server/idea-service";
import type { IdeaRecord, IdeaSource } from "./server/idea-repository";

export type IdeaPageItem = {
  id: string;
  rawText: string;
  source: IdeaSource;
  triageStatus: "untriaged" | "kept" | "converted" | "archived";
  createdDate: string;
};

export type IdeaActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
      code?: string;
    };

function unauthorizedResult<T>(): IdeaActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
  };
}

function unavailableResult<T>(): IdeaActionResult<T> {
  return {
    ok: false,
    message: "Ideas are unavailable.",
    code: "ideas_unavailable",
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
    return {
      ok: false,
      message: result.message,
      code: result.code,
    };
  }

  return {
    ok: true,
    data: toIdeaPageItem(result.idea),
  };
}
