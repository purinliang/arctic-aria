import type { ActionFailureResult } from "../../messages/action-result.ts";
import type { ProjectDurationRange } from "./project-duration.ts";

export type ProjectTreeTemplateOperation = "create" | "update" | "delete";

export type ProjectTreeTemplateProjectDraft = {
  projectId: string;
  operation: string;
  title: string;
  objective: string;
  startDate: string;
  timelineType: string;
  deadlineDate: string;
  durationRange: string;
};

export type ProjectTreeTemplateMilestoneDraft = {
  milestoneId: string;
  operation: string;
  title: string;
  objective: string;
  startDate: string;
  timelineType: string;
  deadlineDate: string;
  durationRange: string;
  tasks: ProjectTreeTemplateTaskDraft[];
};

export type ProjectTreeTemplateTaskDraft = {
  taskId: string;
  operation: string;
  title: string;
  description: string;
  startDate: string;
  deadlineDate: string;
  estimatedDurationMinutes: string;
};

export type ProjectTreeTemplateDocument = {
  project: ProjectTreeTemplateProjectDraft;
  topLevelTasks: ProjectTreeTemplateTaskDraft[];
  milestones: ProjectTreeTemplateMilestoneDraft[];
};

export type ProjectTreeTemplateResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

export type ProjectTreeTemplatePreviewItem = {
  subject: "project" | "milestone" | "task";
  operation: ProjectTreeTemplateOperation;
  title: string;
  location: string | null;
};

export type ProjectTreeTemplatePreview = {
  projectTitle: string;
  items: ProjectTreeTemplatePreviewItem[];
  counts: Record<ProjectTreeTemplateOperation, number>;
};

export type ProjectTreeTemplateTimelineDraft = {
  timelineType: "deadline" | "duration";
  deadlineDate: string;
  durationRange: ProjectDurationRange;
};
