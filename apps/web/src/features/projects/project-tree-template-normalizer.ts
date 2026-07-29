import {
  countProjectTreeTemplatePreviewOperations,
  invalidProjectTreeTemplate,
  normalizeProjectTreeTemplateOperation,
  normalizeProjectTreeTemplateCreateProject,
  normalizeProjectTreeTemplateProject,
} from "./project-tree-template-normalizer-helpers.ts";
import {
  normalizeProjectTreeTemplateMilestone,
  normalizeProjectTreeTemplateTask,
} from "./project-tree-template-normalizer-items.ts";
import type {
  ApplyProjectTreeTemplateInput,
  CreateProjectTreeTemplateInput,
  ProjectRecord,
  ProjectTreeTemplateCreateMilestoneInput,
  ProjectTreeTemplateCreateTaskInput,
  ProjectTreeTemplateMilestoneInput,
  ProjectTreeTemplateTaskInput,
} from "./server/project-repository.ts";
import type {
  ProjectTreeTemplateDocument,
  ProjectTreeTemplatePreview,
  ProjectTreeTemplatePreviewItem,
  ProjectTreeTemplateResult,
} from "./project-tree-template-types.ts";

export type NormalizedProjectTreeTemplate =
  | {
      mode: "create";
      command: Omit<CreateProjectTreeTemplateInput, "userId" | "occurredAt">;
      preview: ProjectTreeTemplatePreview;
    }
  | {
      mode: "update";
      command: Omit<ApplyProjectTreeTemplateInput, "userId" | "occurredAt">;
      preview: ProjectTreeTemplatePreview;
    };

export function normalizeProjectTreeTemplateDocument({
  document,
  currentProject = null,
  createId = () => crypto.randomUUID(),
}: {
  document: ProjectTreeTemplateDocument;
  currentProject?: ProjectRecord | null;
  createId?: () => string;
}): ProjectTreeTemplateResult<NormalizedProjectTreeTemplate> {
  if (!currentProject) {
    return normalizeCreateProjectTreeTemplateDocument({ document, createId });
  }

  return normalizeUpdateProjectTreeTemplateDocument({
    document,
    currentProject,
    createId,
  });
}

function normalizeUpdateProjectTreeTemplateDocument({
  document,
  currentProject,
  createId,
}: {
  document: ProjectTreeTemplateDocument;
  currentProject: ProjectRecord;
  createId: () => string;
}): ProjectTreeTemplateResult<NormalizedProjectTreeTemplate> {
  const project = normalizeProjectTreeTemplateProject(document, currentProject);

  if (!project.ok) {
    return project;
  }

  const milestoneById = new Map(
    currentProject.milestones.map((milestone) => [milestone.id, milestone]),
  );
  const taskById = new Map(
    currentProject.tasks.map((task) => [task.id, task]),
  );
  const milestoneIds = new Set<string>();
  const taskIds = new Set<string>();
  const milestoneCommands: ProjectTreeTemplateMilestoneInput[] = [];
  const taskCommands: ProjectTreeTemplateTaskInput[] = [];
  const previewItems: ProjectTreeTemplatePreviewItem[] = [
    {
      subject: "project",
      operation: projectCommandPreserved(project.data, currentProject)
        ? "preserve"
        : "update",
      title: project.data.title,
      location: null,
    },
  ];

  for (const task of document.topLevelTasks) {
    const normalized = normalizeProjectTreeTemplateTask({
      task,
      projectId: currentProject.id,
      milestoneId: null,
      location: "No milestone",
      taskById,
      taskIds,
      createId,
    });

    if (!normalized.ok) {
      return normalized;
    }

    taskCommands.push(normalized.data.command);
    previewItems.push(normalized.data.preview);
  }

  for (const milestone of document.milestones) {
    const normalizedMilestone = normalizeProjectTreeTemplateMilestone({
      milestone,
      projectId: currentProject.id,
      milestoneById,
      milestoneIds,
      createId,
    });

    if (!normalizedMilestone.ok) {
      return normalizedMilestone;
    }

    milestoneCommands.push(normalizedMilestone.data.command);
    previewItems.push(normalizedMilestone.data.preview);

    for (const task of milestone.tasks) {
      const taskOperation = normalizeProjectTreeTemplateOperation(task.operation);

      if (
        normalizedMilestone.data.operation === "delete" &&
        taskOperation !== "delete"
      ) {
        return invalidProjectTreeTemplate(
          "Tasks inside a deleted milestone must also use op: delete.",
        );
      }

      const normalizedTask = normalizeProjectTreeTemplateTask({
        task,
        projectId: currentProject.id,
        milestoneId:
          normalizedMilestone.data.operation === "delete"
            ? null
            : normalizedMilestone.data.milestoneId,
        location:
          normalizedMilestone.data.operation === "delete"
            ? milestone.title
            : normalizedMilestone.data.title,
        taskById,
        taskIds,
        createId,
      });

      if (!normalizedTask.ok) {
        return normalizedTask;
      }

      taskCommands.push(normalizedTask.data.command);
      previewItems.push(normalizedTask.data.preview);
    }
  }

  return {
    ok: true,
    data: {
      command: {
        project: project.data,
        milestones: milestoneCommands,
        tasks: taskCommands,
      },
      mode: "update",
      preview: {
        projectTitle: project.data.title,
        items: previewItems,
        counts: countProjectTreeTemplatePreviewOperations(previewItems),
        ignoredFieldCount: document.ignoredFieldCount,
      },
    },
  };
}

function normalizeCreateProjectTreeTemplateDocument({
  document,
  createId,
}: {
  document: ProjectTreeTemplateDocument;
  createId: () => string;
}): ProjectTreeTemplateResult<NormalizedProjectTreeTemplate> {
  const project = normalizeProjectTreeTemplateCreateProject(document, createId);

  if (!project.ok) {
    return project;
  }

  const milestoneById = new Map<string, ProjectRecord["milestones"][number]>();
  const taskById = new Map<string, ProjectRecord["tasks"][number]>();
  const milestoneIds = new Set<string>();
  const taskIds = new Set<string>();
  const milestoneCommands: ProjectTreeTemplateCreateMilestoneInput[] = [];
  const taskCommands: ProjectTreeTemplateCreateTaskInput[] = [];
  const previewItems: ProjectTreeTemplatePreviewItem[] = [
    {
      subject: "project",
      operation: "create",
      title: project.data.title,
      location: null,
    },
  ];

  for (const task of document.topLevelTasks) {
    const createOnly = requireCreateOperation("Task", task.title, task.operation);

    if (!createOnly.ok) {
      return createOnly;
    }

    const normalized = normalizeProjectTreeTemplateTask({
      task,
      projectId: project.data.projectId,
      milestoneId: null,
      location: "No milestone",
      taskById,
      taskIds,
      createId,
    });

    if (!normalized.ok) {
      return normalized;
    }

    const command = normalized.data.command;

    if (command.operation !== "create") {
      return invalidProjectTreeTemplate(
        "Create project templates can only create tasks.",
      );
    }

    taskCommands.push({
      taskId: command.taskId,
      milestoneId: command.milestoneId,
      title: command.title,
      description: command.description,
      startDate: command.startDate,
      deadlineDate: command.deadlineDate,
      estimatedDurationMinutes: command.estimatedDurationMinutes,
    });
    previewItems.push(normalized.data.preview);
  }

  for (const milestone of document.milestones) {
    const createOnly = requireCreateOperation(
      "Milestone",
      milestone.title,
      milestone.operation,
    );

    if (!createOnly.ok) {
      return createOnly;
    }

    const normalizedMilestone = normalizeProjectTreeTemplateMilestone({
      milestone,
      projectId: project.data.projectId,
      milestoneById,
      milestoneIds,
      createId,
    });

    if (!normalizedMilestone.ok) {
      return normalizedMilestone;
    }

    const milestoneCommand = normalizedMilestone.data.command;

    if (milestoneCommand.operation !== "create") {
      return invalidProjectTreeTemplate(
        "Create project templates can only create milestones.",
      );
    }

    milestoneCommands.push({
      milestoneId: milestoneCommand.milestoneId,
      title: milestoneCommand.title,
      objective: milestoneCommand.objective,
      startDate: milestoneCommand.startDate,
      deadlineDate: milestoneCommand.deadlineDate,
      expectedDurationDays: milestoneCommand.expectedDurationDays,
    });
    previewItems.push(normalizedMilestone.data.preview);

    for (const task of milestone.tasks) {
      const taskCreateOnly = requireCreateOperation("Task", task.title, task.operation);

      if (!taskCreateOnly.ok) {
        return taskCreateOnly;
      }

      const normalizedTask = normalizeProjectTreeTemplateTask({
        task,
        projectId: project.data.projectId,
        milestoneId: normalizedMilestone.data.milestoneId,
        location: normalizedMilestone.data.title,
        taskById,
        taskIds,
        createId,
      });

      if (!normalizedTask.ok) {
        return normalizedTask;
      }

      const taskCommand = normalizedTask.data.command;

      if (taskCommand.operation !== "create") {
        return invalidProjectTreeTemplate(
          "Create project templates can only create tasks.",
        );
      }

      taskCommands.push({
        taskId: taskCommand.taskId,
        milestoneId: taskCommand.milestoneId,
        title: taskCommand.title,
        description: taskCommand.description,
        startDate: taskCommand.startDate,
        deadlineDate: taskCommand.deadlineDate,
        estimatedDurationMinutes: taskCommand.estimatedDurationMinutes,
      });
      previewItems.push(normalizedTask.data.preview);
    }
  }

  return {
    ok: true,
    data: {
      command: {
        project: project.data,
        milestones: milestoneCommands,
        tasks: taskCommands,
      },
      mode: "create",
      preview: {
        projectTitle: project.data.title,
        items: previewItems,
        counts: countProjectTreeTemplatePreviewOperations(previewItems),
        ignoredFieldCount: document.ignoredFieldCount,
      },
    },
  };
}

function requireCreateOperation(
  subject: "Milestone" | "Task",
  title: string,
  value: string,
): ProjectTreeTemplateResult<undefined> {
  const operation = normalizeProjectTreeTemplateOperation(value);

  if (!operation) {
    return invalidProjectTreeTemplate(
      `${subject} "${title || "Untitled"}" has an invalid op.`,
    );
  }

  if (operation !== "create") {
    return invalidProjectTreeTemplate(
      `Create project templates can only use op: create for ${subject.toLowerCase()} rows.`,
    );
  }

  return {
    ok: true,
    data: undefined,
  };
}

function projectCommandPreserved(
  command: Omit<ApplyProjectTreeTemplateInput["project"], "userId" | "occurredAt">,
  existing: ProjectRecord,
) {
  return (
    command.projectId === existing.id &&
    command.title === existing.title &&
    command.objective === existing.objective &&
    command.startDate === existing.startDate &&
    command.deadlineDate === existing.deadlineDate &&
    command.expectedDurationDays === existing.expectedDurationDays
  );
}
