import { durationDaysForRange } from "./project-duration.ts";
import {
  isValidProjectDate,
  validateRequiredProjectDate,
} from "./project-date-validation.ts";
import { validateOptionalEstimatedDurationMinutes } from "../estimated-duration.ts";
import type {
  ProjectDurationRange,
  ProjectTimelineType,
} from "./project-duration.ts";
import type {
  ActionFailureReason,
  ActionFailureResult,
  ActionFailureSubject,
} from "../../messages/action-result.ts";

export type ProjectInput = {
  id?: string;
  title: string;
  description: string;
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
  startDate: string;
  deadlineDate: string;
  estimatedDurationMinutes?: string | null;
};

export type ProjectActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

export function unauthorizedResult<T>(): ProjectActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
    category: "auth",
  };
}

export function validateProjectInput(input: ProjectInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  let deadlineDate: string | null = null;
  let expectedDurationDays: number | null = null;

  if (title.length < 1) {
    return {
      ok: false as const,
      message: "Project title is required.",
      code: "project_title_invalid",
      category: "missing_parameter" as const,
      subject: "project" as const,
      field: "title",
      reason: "required" as const,
    };
  }

  if (title.length > 120) {
    return {
      ok: false as const,
      message: "Project title must be 120 characters or fewer.",
      code: "project_title_invalid",
      category: "invalid_parameter" as const,
      subject: "project" as const,
      field: "title",
      reason: "too_long" as const,
      limit: 120,
    };
  }

  if (description.length > 1000) {
    return {
      ok: false as const,
      message: "Project objective must be 1000 characters or fewer.",
      code: "project_description_invalid",
      category: "invalid_parameter" as const,
      subject: "project" as const,
      field: "objective",
      reason: "too_long" as const,
      limit: 1000,
    };
  }

  const startDate = validateRequiredProjectDate({
    value: input.startDate,
    missingMessage: "Select a start date.",
    invalidMessage: "Start date must be a real date in YYYY-MM-DD format.",
    missingCode: "project_start_date_missing",
    invalidCode: "project_start_date_invalid",
    field: "start_date",
  });

  if (!startDate.ok) {
    return startDate;
  }

  if (input.timelineType === "deadline") {
    const deadline = validateRequiredProjectDate({
      value: input.deadlineDate,
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
      field: "deadline",
    });

    if (!deadline.ok) {
      return deadline;
    }

    deadlineDate = deadline.value;

    if (deadlineDate < startDate.value) {
      return {
        ok: false as const,
        message: "Deadline cannot be before start date.",
        code: "project_deadline_before_start",
        category: "invalid_parameter" as const,
        field: "deadline",
        reason: "before_start" as const,
      };
    }
  } else {
    expectedDurationDays = durationDaysForRange(input.durationRange);

    if (!expectedDurationDays) {
      return {
        ok: false as const,
        message: "Choose an expected duration.",
        code: "project_duration_missing",
        category: "missing_parameter" as const,
        field: "expected_duration",
        reason: "required" as const,
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

  if (title.length < 1) {
    return {
      ok: false as const,
      message: "Milestone title is required.",
      code: "milestone_title_invalid",
      category: "missing_parameter" as const,
      subject: "milestone" as const,
      field: "title",
      reason: "required" as const,
    };
  }

  if (title.length > 120) {
    return {
      ok: false as const,
      message: "Milestone title must be 120 characters or fewer.",
      code: "milestone_title_invalid",
      category: "invalid_parameter" as const,
      subject: "milestone" as const,
      field: "title",
      reason: "too_long" as const,
      limit: 120,
    };
  }

  if (objective.length > 500) {
    return {
      ok: false as const,
      message: "Milestone objective must be 500 characters or fewer.",
      code: "milestone_objective_invalid",
      category: "invalid_parameter" as const,
      subject: "milestone" as const,
      field: "objective",
      reason: "too_long" as const,
      limit: 500,
    };
  }

  const startDate = validateRequiredProjectDate({
    value: input.startDate,
    missingMessage: "Select a start date.",
    invalidMessage: "Start date must be a real date in YYYY-MM-DD format.",
    missingCode: "project_start_date_missing",
    invalidCode: "project_start_date_invalid",
    field: "start_date",
  });

  if (!startDate.ok) {
    return startDate;
  }

  if (input.timelineType === "deadline") {
    const deadline = validateRequiredProjectDate({
      value: input.deadlineDate,
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
      field: "deadline",
    });

    if (!deadline.ok) {
      return deadline;
    }

    deadlineDate = deadline.value;

    if (deadlineDate < startDate.value) {
      return {
        ok: false as const,
        message: "Deadline cannot be before start date.",
        code: "project_deadline_before_start",
        category: "invalid_parameter" as const,
        field: "deadline",
        reason: "before_start" as const,
      };
    }
  } else {
    expectedDurationDays = durationDaysForRange(input.durationRange);

    if (!expectedDurationDays) {
      return {
        ok: false as const,
        message: "Choose an expected duration.",
        code: "project_duration_missing",
        category: "missing_parameter" as const,
        field: "expected_duration",
        reason: "required" as const,
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
  const startDate = input.startDate.trim() || null;
  const deadlineDate = input.deadlineDate.trim() || null;
  const estimatedDuration = validateOptionalEstimatedDurationMinutes(
    input.estimatedDurationMinutes,
    "task",
  );

  if (title.length < 1) {
    return {
      ok: false as const,
      message: "Task title is required.",
      code: "task_title_invalid",
      category: "missing_parameter" as const,
      subject: "task" as const,
      field: "title",
      reason: "required" as const,
    };
  }

  if (title.length > 120) {
    return {
      ok: false as const,
      message: "Task title must be 120 characters or fewer.",
      code: "task_title_invalid",
      category: "invalid_parameter" as const,
      subject: "task" as const,
      field: "title",
      reason: "too_long" as const,
      limit: 120,
    };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Task description must be 2000 characters or fewer.",
      code: "task_description_invalid",
      category: "invalid_parameter" as const,
      subject: "task" as const,
      field: "description",
      reason: "too_long" as const,
      limit: 2000,
    };
  }

  if (!estimatedDuration.ok) {
    return estimatedDuration;
  }

  if (startDate && !validateDate(startDate)) {
    return invalidParameter({
      message: "Start date must be a real date in YYYY-MM-DD format.",
      code: "project_dates_invalid",
      field: "start_date",
      reason: "invalid_format",
    });
  }

  if (deadlineDate && !validateDate(deadlineDate)) {
    return invalidParameter({
      message: "Deadline date must be a real date in YYYY-MM-DD format.",
      code: "project_dates_invalid",
      field: "deadline",
      reason: "invalid_format",
    });
  }

  if (startDate && deadlineDate && deadlineDate < startDate) {
    return {
      ok: false as const,
      message: "Deadline cannot be before start date.",
      code: "project_deadline_before_start",
      category: "invalid_parameter" as const,
      field: "deadline",
      reason: "before_start" as const,
    };
  }

  return {
    ok: true as const,
    milestoneId,
    title,
    description: description || null,
    startDate,
    deadlineDate,
    estimatedDurationMinutes: estimatedDuration.value,
  };
}

function validateDate(value: string) {
  return isValidProjectDate(value);
}

function invalidParameter({
  message,
  code,
  subject,
  field,
  reason,
  limit,
}: {
  message: string;
  code: string;
  subject?: ActionFailureSubject;
  field: string;
  reason: ActionFailureReason;
  limit?: number;
}) {
  const failure: ActionFailureResult = {
    ok: false as const,
    message,
    code,
    category: "invalid_parameter" as const,
    field,
    reason,
  };

  if (subject) {
    failure.subject = subject;
  }

  if (limit !== undefined) {
    failure.limit = limit;
  }

  return failure;
}
