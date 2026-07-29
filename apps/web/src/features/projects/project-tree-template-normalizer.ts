import {
  countProjectTreeTemplatePreviewOperations,
  invalidProjectTreeTemplate,
  normalizeProjectTreeTemplateOperation,
  normalizeProjectTreeTemplateProject,
} from "./project-tree-template-normalizer-helpers.ts";
import {
  normalizeProjectTreeTemplateMilestone,
  normalizeProjectTreeTemplateTask,
} from "./project-tree-template-normalizer-items.ts";
import type {
  ApplyProjectTreeTemplateInput,
  ProjectRecord,
  ProjectTreeTemplateMilestoneInput,
  ProjectTreeTemplateTaskInput,
} from "./server/project-repository.ts";
import type {
  ProjectTreeTemplateDocument,
  ProjectTreeTemplatePreview,
  ProjectTreeTemplatePreviewItem,
  ProjectTreeTemplateResult,
} from "./project-tree-template-types.ts";

export type NormalizedProjectTreeTemplate = {
  command: Omit<ApplyProjectTreeTemplateInput, "userId" | "occurredAt">;
  preview: ProjectTreeTemplatePreview;
};

export function normalizeProjectTreeTemplateDocument({
  document,
  currentProject,
  createId = () => crypto.randomUUID(),
}: {
  document: ProjectTreeTemplateDocument;
  currentProject: ProjectRecord;
  createId?: () => string;
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
      operation: "update",
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
      preview: {
        projectTitle: project.data.title,
        items: previewItems,
        counts: countProjectTreeTemplatePreviewOperations(previewItems),
      },
    },
  };
}
