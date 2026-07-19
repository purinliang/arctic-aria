import { durationDaysForRange } from "./project-duration.ts";
import {
  isValidProjectDate,
  validateRequiredProjectDate,
} from "./project-date-validation.ts";
import type {
  ProjectDurationRange,
  ProjectTimelineType,
} from "./project-duration.ts";
import type { ProjectPriority, ProjectTaskStatus } from "./server/project-repository";

export type ProjectInput = {
  id?: string;
  title: string;
  description: string;
  priority: ProjectPriority;
  startDate: string;
  timelineType: ProjectTimelineType;
  deadlineDate: string;
  durationRange: ProjectDurationRange;
};

export type MilestoneInput = {
  id?: string;
  projectId: string;
  title: string;
  objective: string;
  startDate: string;
  timelineType: ProjectTimelineType;
  deadlineDate: string;
  durationRange: ProjectDurationRange;
};

export type ProjectTaskInput = {
  id?: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectTaskStatus;
  scheduledDate: string;
  startDate: string;
  deadlineDate: string;
};

export type ProjectActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
      code?: string;
    };

export function unauthorizedResult<T>(): ProjectActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
  };
}

export function validateProjectInput(input: ProjectInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  let deadlineDate: string | null = null;
  let expectedDurationDays: number | null = null;

  if (title.length < 1 || title.length > 120) {
    return {
      ok: false as const,
      message: "Project title must be 1-120 characters.",
      code: "project_title_invalid",
    };
  }

  if (description.length > 1000) {
    return {
      ok: false as const,
      message: "Project objective must be 1000 characters or fewer.",
      code: "project_description_invalid",
    };
  }

  const startDate = validateRequiredProjectDate({
    value: input.startDate,
    missingMessage: "Select a start date.",
    invalidMessage: "Start date must be a real date in YYYY-MM-DD format.",
    missingCode: "project_start_date_missing",
    invalidCode: "project_start_date_invalid",
  });

  if (!startDate.ok) {
    return { ok: false as const, message: startDate.message, code: startDate.code };
  }

  if (input.timelineType === "deadline") {
    const deadline = validateRequiredProjectDate({
      value: input.deadlineDate,
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
    });

    if (!deadline.ok) {
      return { ok: false as const, message: deadline.message, code: deadline.code };
    }

    deadlineDate = deadline.value;

    if (deadlineDate < startDate.value) {
      return {
        ok: false as const,
        message: "Deadline cannot be before start date.",
        code: "project_deadline_before_start",
      };
    }
  } else {
    expectedDurationDays = durationDaysForRange(input.durationRange);

    if (!expectedDurationDays) {
      return {
        ok: false as const,
        message: "Choose an expected duration.",
        code: "project_duration_missing",
      };
    }
  }

  return {
    ok: true as const,
    title,
    objective: description ? description.slice(0, 500) : null,
    startDate: startDate.value,
    deadlineDate,
    expectedDurationDays,
  };
}

export function validateMilestoneInput(input: MilestoneInput) {
  const title = input.title.trim();
  const objective = input.objective.trim();
  let deadlineDate: string | null = null;
  let expectedDurationDays: number | null = null;

  if (title.length < 1 || title.length > 120) {
    return {
      ok: false as const,
      message: "Milestone title must be 1-120 characters.",
      code: "milestone_title_invalid",
    };
  }

  if (objective.length > 500) {
    return {
      ok: false as const,
      message: "Milestone objective must be 500 characters or fewer.",
      code: "milestone_objective_invalid",
    };
  }

  const startDate = validateRequiredProjectDate({
    value: input.startDate,
    missingMessage: "Select a start date.",
    invalidMessage: "Start date must be a real date in YYYY-MM-DD format.",
    missingCode: "project_start_date_missing",
    invalidCode: "project_start_date_invalid",
  });

  if (!startDate.ok) {
    return { ok: false as const, message: startDate.message, code: startDate.code };
  }

  if (input.timelineType === "deadline") {
    const deadline = validateRequiredProjectDate({
      value: input.deadlineDate,
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
    });

    if (!deadline.ok) {
      return { ok: false as const, message: deadline.message, code: deadline.code };
    }

    deadlineDate = deadline.value;

    if (deadlineDate < startDate.value) {
      return {
        ok: false as const,
        message: "Deadline cannot be before start date.",
        code: "project_deadline_before_start",
      };
    }
  } else {
    expectedDurationDays = durationDaysForRange(input.durationRange);

    if (!expectedDurationDays) {
      return {
        ok: false as const,
        message: "Choose an expected duration.",
        code: "project_duration_missing",
      };
    }
  }

  return {
    ok: true as const,
    title,
    objective: objective || null,
    startDate: startDate.value,
    deadlineDate,
    expectedDurationDays,
  };
}

export function validateProjectTaskInput(input: ProjectTaskInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const milestoneId = input.milestoneId.trim() || null;
  const scheduledDate = input.scheduledDate.trim() || null;
  const startDate = input.startDate.trim() || null;
  const deadlineDate = input.deadlineDate.trim() || null;

  if (title.length < 1 || title.length > 120) {
    return {
      ok: false as const,
      message: "Task title must be 1-120 characters.",
      code: "task_title_invalid",
    };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Task description must be 2000 characters or fewer.",
      code: "task_description_invalid",
    };
  }

  for (const value of [scheduledDate, startDate, deadlineDate]) {
    if (value && !validateDate(value)) {
      return {
        ok: false as const,
        message: "Dates must be real calendar dates in YYYY-MM-DD format.",
        code: "project_dates_invalid",
      };
    }
  }

  if (startDate && deadlineDate && deadlineDate < startDate) {
    return {
      ok: false as const,
      message: "Deadline cannot be before start date.",
      code: "project_deadline_before_start",
    };
  }

  return {
    ok: true as const,
    milestoneId,
    title,
    description: description || null,
    scheduledDate,
    startDate,
    deadlineDate,
  };
}

function validateDate(value: string) {
  return isValidProjectDate(value);
}
