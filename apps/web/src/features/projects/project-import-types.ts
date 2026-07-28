import type { ProjectDurationRange } from "./project-duration.ts";
import type { ActionFailureResult } from "../../messages/action-result.ts";

export type ProjectImportTimeline =
  | {
      type: "deadline";
      deadlineDate: string;
    }
  | {
      type: "duration";
      durationRange: ProjectDurationRange;
    };

export type ProjectImportDocument = {
  project: {
    title: string;
    objective?: string;
    startDate?: string;
    timeline?: ProjectImportTimeline;
  };
  milestones?: ProjectImportMilestone[];
};

export type ProjectImportBatchDocument = {
  projects: ProjectImportDocument[];
};

export type ProjectImportMilestone = {
  title: string;
  objective?: string;
  startDate?: string;
  timeline?: ProjectImportTimeline;
  tasks?: ProjectImportTask[];
};

export type ProjectImportTask = {
  title: string;
  description?: string;
  startDate?: string;
  deadlineDate?: string;
  estimatedDurationMinutes?: number | null;
};

export type ProjectImportResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

export type ProjectImportCommand = {
  project: {
    title: string;
    objective: string | null;
    startDate: string;
    deadlineDate: string | null;
    expectedDurationDays: number | null;
  };
  milestones: Array<{
    title: string;
    objective: string | null;
    startDate: string;
    deadlineDate: string | null;
    expectedDurationDays: number | null;
    tasks: Array<{
      title: string;
      description: string | null;
      startDate: string | null;
      deadlineDate: string | null;
      estimatedDurationMinutes: number | null;
    }>;
  }>;
};
