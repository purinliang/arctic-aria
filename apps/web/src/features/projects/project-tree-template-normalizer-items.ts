import {
  validateMilestoneInput,
  validateProjectTaskInput,
} from "./project-action-helpers.ts";
import {
  invalidProjectTreeTemplate,
  normalizeProjectTreeTemplateOperation,
  projectTreeTemplateTargetNotFound,
  projectTreeTemplateTimelineInput,
} from "./project-tree-template-normalizer-helpers.ts";
import type {
  MilestoneInput,
  ProjectTaskInput,
} from "./project-action-helpers.ts";
import type {
  ProjectRecord,
  ProjectTreeTemplateMilestoneInput,
  ProjectTreeTemplateTaskInput,
} from "./server/project-repository.ts";
import type {
  ProjectTreeTemplateMilestoneDraft,
  ProjectTreeTemplateOperation,
  ProjectTreeTemplatePreviewItem,
  ProjectTreeTemplateResult,
  ProjectTreeTemplateTaskDraft,
} from "./project-tree-template-types.ts";

export function normalizeProjectTreeTemplateMilestone({
  milestone,
  projectId,
  milestoneById,
  milestoneIds,
  createId,
}: {
  milestone: ProjectTreeTemplateMilestoneDraft;
  projectId: string;
  milestoneById: Map<string, ProjectRecord["milestones"][number]>;
  milestoneIds: Set<string>;
  createId: () => string;
}): ProjectTreeTemplateResult<{
  operation: ProjectTreeTemplateOperation;
  milestoneId: string;
  title: string;
  command: ProjectTreeTemplateMilestoneInput;
  preview: ProjectTreeTemplatePreviewItem;
}> {
  const operation = normalizeProjectTreeTemplateOperation(milestone.operation);
  const milestoneId = milestone.milestoneId.trim();

  if (!operation) {
    return invalidProjectTreeTemplate(
      `Milestone "${milestone.title || "Untitled"}" has an invalid op.`,
    );
  }

  if (operation === "create" && milestoneId) {
    return invalidProjectTreeTemplate(
      "Milestone create rows must leave milestone_id empty.",
    );
  }

  if (operation !== "create" && !milestoneId) {
    return invalidProjectTreeTemplate(
      "Milestone update/delete rows require milestone_id.",
    );
  }

  if (milestoneId) {
    if (milestoneIds.has(milestoneId)) {
      return invalidProjectTreeTemplate(
        `Milestone ${milestoneId} appears more than once.`,
      );
    }

    milestoneIds.add(milestoneId);

    if (!milestoneById.has(milestoneId)) {
      return projectTreeTemplateTargetNotFound(
        "Milestone was not found.",
        "milestone_not_found",
        "milestone",
      );
    }
  }

  if (operation === "delete") {
    const title =
      milestone.title ||
      milestoneById.get(milestoneId)?.title ||
      "Untitled milestone";

    return {
      ok: true,
      data: {
        operation,
        milestoneId,
        title,
        command: {
          operation,
          milestoneId,
        },
        preview: {
          subject: "milestone",
          operation,
          title,
          location: null,
        },
      },
    };
  }

  const resolvedMilestoneId = operation === "create" ? createId() : milestoneId;
  const input: MilestoneInput = {
    id: operation === "update" ? resolvedMilestoneId : undefined,
    projectId,
    title: milestone.title,
    objective: milestone.objective,
    startDate: milestone.startDate,
    ...projectTreeTemplateTimelineInput(milestone),
  };
  const validation = validateMilestoneInput(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    data: {
      operation,
      milestoneId: resolvedMilestoneId,
      title: validation.title,
      command: {
        operation,
        milestoneId: resolvedMilestoneId,
        title: validation.title,
        objective: validation.objective,
        startDate: validation.startDate,
        deadlineDate: validation.deadlineDate,
        expectedDurationDays: validation.expectedDurationDays,
      },
      preview: {
        subject: "milestone",
        operation,
        title: validation.title,
        location: null,
      },
    },
  };
}

export function normalizeProjectTreeTemplateTask({
  task,
  projectId,
  milestoneId,
  location,
  taskById,
  taskIds,
  createId,
}: {
  task: ProjectTreeTemplateTaskDraft;
  projectId: string;
  milestoneId: string | null;
  location: string;
  taskById: Map<string, ProjectRecord["tasks"][number]>;
  taskIds: Set<string>;
  createId: () => string;
}): ProjectTreeTemplateResult<{
  command: ProjectTreeTemplateTaskInput;
  preview: ProjectTreeTemplatePreviewItem;
}> {
  const operation = normalizeProjectTreeTemplateOperation(task.operation);
  const taskId = task.taskId.trim();

  if (!operation) {
    return invalidProjectTreeTemplate(
      `Task "${task.title || "Untitled"}" has an invalid op.`,
    );
  }

  if (operation === "create" && taskId) {
    return invalidProjectTreeTemplate("Task create rows must leave task_id empty.");
  }

  if (operation !== "create" && !taskId) {
    return invalidProjectTreeTemplate("Task update/delete rows require task_id.");
  }

  if (taskId) {
    if (taskIds.has(taskId)) {
      return invalidProjectTreeTemplate(`Task ${taskId} appears more than once.`);
    }

    taskIds.add(taskId);

    if (!taskById.has(taskId)) {
      return projectTreeTemplateTargetNotFound(
        "Task was not found.",
        "task_not_found",
        "task",
      );
    }
  }

  if (operation === "delete") {
    const title = task.title || taskById.get(taskId)?.title || "Untitled task";

    return {
      ok: true,
      data: {
        command: {
          operation,
          taskId,
        },
        preview: {
          subject: "task",
          operation,
          title,
          location,
        },
      },
    };
  }

  const resolvedTaskId = operation === "create" ? createId() : taskId;
  const input: ProjectTaskInput = {
    id: operation === "update" ? resolvedTaskId : undefined,
    projectId,
    milestoneId: milestoneId ?? "",
    title: task.title,
    description: task.description,
    startDate: task.startDate,
    deadlineDate: task.deadlineDate,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
  };
  const validation = validateProjectTaskInput(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    data: {
      command: {
        operation,
        taskId: resolvedTaskId,
        milestoneId,
        title: validation.title,
        description: validation.description,
        startDate: validation.startDate,
        deadlineDate: validation.deadlineDate,
        estimatedDurationMinutes: validation.estimatedDurationMinutes,
      },
      preview: {
        subject: "task",
        operation,
        title: validation.title,
        location,
      },
    },
  };
}
