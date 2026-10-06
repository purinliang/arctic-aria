import type { DashboardView } from "../features/dashboard/types.ts";
import type { PageHelpKey } from "../messages/page-help-messages.ts";

export function pageHelpKeyForView({
  view,
  projectSelected,
  milestoneSelected,
}: {
  view: DashboardView;
  projectSelected: boolean;
  milestoneSelected: boolean;
}): PageHelpKey {
  if (view === "projects" && projectSelected) {
    return milestoneSelected ? "milestone" : "project";
  }
  return view;
}
