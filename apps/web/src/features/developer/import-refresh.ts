import type { DeveloperImportTarget } from "./import-template-prompts";

export type DeveloperImportRefreshHandlers = {
  refreshProjectData: () => void | Promise<void>;
  refreshRoutineData: () => void | Promise<void>;
};

export function refreshAfterDeveloperImport(
  target: DeveloperImportTarget,
  handlers: DeveloperImportRefreshHandlers,
) {
  if (target === "projects") {
    return handlers.refreshProjectData();
  }

  return handlers.refreshRoutineData();
}
