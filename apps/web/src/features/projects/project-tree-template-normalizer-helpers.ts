import {
  coerceProjectDurationRange,
  defaultProjectDurationRange,
} from "./project-duration.ts";
import { validateProjectInput } from "./project-action-helpers.ts";
import type { ProjectInput } from "./project-action-helpers.ts";
import type {
  ApplyProjectTreeTemplateInput,
  CreateProjectTreeTemplateInput,
  ProjectRecord,
} from "./server/project-repository.ts";
import type {
  ProjectTreeTemplateDocument,
  ProjectTreeTemplateOperation,
  ProjectTreeTemplatePreview,
  ProjectTreeTemplatePreviewItem,
  ProjectTreeTemplateResult,
  ProjectTreeTemplateTimelineDraft,
} from "./project-tree-template-types.ts";

export function normalizeProjectTreeTemplateProject(
  document: ProjectTreeTemplateDocument,
  currentProject: ProjectRecord,
): ProjectTreeTemplateResult<
  Omit<ApplyProjectTreeTemplateInput["project"], "userId" | "occurredAt">
> {
  const project = document.project;

  if (project.projectId.trim() !== currentProject.id) {
    return {
      ok: false,
      code: "project_template_project_mismatch",
      message: "Template project does not match this project.",
      category: "invalid_parameter",
      subject: "project",
      field: "project_id",
      reason: "invalid_value",
    };
  }

  if (normalizeProjectTreeTemplateOperation(project.operation) !== "update") {
    return invalidProjectTreeTemplate("Root project must use op: update.");
  }

  const input: ProjectInput = {
    id: project.projectId,
    title: project.title,
    description: project.objective,
    startDate: project.startDate,
    ...projectTreeTemplateTimelineInput(project),
  };
  const validation = validateProjectInput(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    data: {
      projectId: currentProject.id,
      title: validation.title,
      objective: validation.objective,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      expectedDurationDays: validation.expectedDurationDays,
    },
  };
}

export function normalizeProjectTreeTemplateCreateProject(
  document: ProjectTreeTemplateDocument,
  createId: () => string,
): ProjectTreeTemplateResult<
  Omit<CreateProjectTreeTemplateInput["project"], "userId" | "occurredAt">
> {
  const project = document.project;

  if (project.projectId.trim()) {
    return invalidProjectTreeTemplate(
      "Create project templates must leave project_id empty.",
    );
  }

  if (normalizeProjectTreeTemplateOperation(project.operation) !== "create") {
    return invalidProjectTreeTemplate("Root project must use op: create.");
  }

  const input: ProjectInput = {
    id: undefined,
    title: project.title,
    description: project.objective,
    startDate: project.startDate,
    ...projectTreeTemplateTimelineInput(project),
  };
  const validation = validateProjectInput(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    data: {
      projectId: createId(),
      title: validation.title,
      objective: validation.objective,
      startDate: validation.startDate,
      deadlineDate: validation.deadlineDate,
      expectedDurationDays: validation.expectedDurationDays,
    },
  };
}

export function projectTreeTemplateTimelineInput(
  input: {
    timelineType: string;
    deadlineDate: string;
    durationRange: string;
  },
): ProjectTreeTemplateTimelineDraft {
  const timelineType = normalizeTimelineType(input.timelineType, input.deadlineDate);

  if (timelineType === "deadline") {
    return {
      timelineType,
      deadlineDate: input.deadlineDate,
      durationRange: defaultProjectDurationRange,
    };
  }

  return {
    timelineType,
    deadlineDate: "",
    durationRange: coerceProjectDurationRange(input.durationRange),
  };
}

export function normalizeProjectTreeTemplateOperation(
  value: string,
): ProjectTreeTemplateOperation | null {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "create" ||
    normalized === "update" ||
    normalized === "delete"
  ) {
    return normalized;
  }

  return null;
}

export function countProjectTreeTemplatePreviewOperations(
  items: ProjectTreeTemplatePreviewItem[],
) {
  return items.reduce(
    (counts, item) => ({
      ...counts,
      [item.operation]: counts[item.operation] + 1,
    }),
    {
      create: 0,
      update: 0,
      delete: 0,
    } satisfies ProjectTreeTemplatePreview["counts"],
  );
}

export function invalidProjectTreeTemplate(
  message: string,
): ProjectTreeTemplateResult<never> {
  return {
    ok: false,
    code: "project_template_invalid",
    message,
    category: "invalid_parameter",
    subject: "project",
    field: "template",
    reason: "invalid_value",
  };
}

export function projectTreeTemplateTargetNotFound(
  message: string,
  code: string,
  subject: "milestone" | "task",
): ProjectTreeTemplateResult<never> {
  return {
    ok: false,
    code,
    message,
    category: "not_found",
    subject,
  };
}

function normalizeTimelineType(value: string, deadlineDate: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "deadline" || normalized === "due") {
    return "deadline";
  }

  if (
    normalized === "duration" ||
    normalized === "no_fixed_deadline" ||
    normalized === "open_ended"
  ) {
    return "duration";
  }

  return deadlineDate.trim() ? "deadline" : "duration";
}
