import type {
  ProjectImportBatchDocument,
  ProjectImportDocument,
  ProjectImportMilestone,
  ProjectImportResult,
  ProjectImportTask,
  ProjectImportTimeline,
} from "./project-import-types.ts";
import { coerceProjectDurationRange } from "./project-duration.ts";
import type { ProjectDurationRange } from "./project-duration.ts";

type MutableProject = ProjectImportDocument["project"];
type Section =
  | {
      type: "project";
    }
  | {
      type: "milestone";
      milestone: ProjectImportMilestone;
    }
  | {
      type: "milestone_tasks";
      milestone: ProjectImportMilestone;
    };

const knownFields = new Set([
  "deadline",
  "description",
  "duration",
  "objective",
  "start date",
  "timeline",
  "title",
]);

const projectFields = new Set([
  "deadline",
  "duration",
  "objective",
  "start date",
  "timeline",
]);

const milestoneFields = new Set([
  "deadline",
  "duration",
  "objective",
  "start date",
  "timeline",
  "title",
]);

const taskFields = new Set(["deadline", "description", "start date", "title"]);

export function parseProjectMarkdownToJson(
  markdown: string,
): ProjectImportResult<unknown> {
  const documents: ProjectImportDocument[] = [];
  let currentDocument = null as ProjectImportDocument | null;
  let section = null as Section | null;
  let currentTask: ProjectImportTask | null = null;

  function finishTask() {
    if (!currentTask) {
      return;
    }

    if (section?.type !== "milestone_tasks") {
      currentTask = null;
      return;
    }

    section.milestone.tasks = [...(section.milestone.tasks ?? []), currentTask];
    currentTask = null;
  }

  function startProject(title: string) {
    finishTask();
    currentDocument = {
      project: { title },
      milestones: [],
    };
    documents.push(currentDocument);
    section = { type: "project" };
  }

  const lines = markdown.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line || line.startsWith("<!--") || isSeparatorLine(line)) {
      continue;
    }

    const projectTitle = readProjectHeading(line);

    if (projectTitle !== null) {
      startProject(projectTitle);
      continue;
    }

    if (line.startsWith("## ")) {
      finishTask();

      if (!currentDocument) {
        return invalidStructure(
          `Milestone on line ${lineNumber} must be inside a project.`,
        );
      }

      const heading = line.slice(3).trim();

      const title = heading.replace(/^Milestone:\s*/i, "").trim();
      const milestone: ProjectImportMilestone = {
        title,
      };
      currentDocument.milestones = [
        ...(currentDocument.milestones ?? []),
        milestone,
      ];
      section = { type: "milestone", milestone };
      continue;
    }

    if (line.startsWith("### ")) {
      finishTask();
      const heading = line.slice(4).trim();

      if (/^tasks$/i.test(heading) && section?.type === "milestone") {
        section = {
          type: "milestone_tasks",
          milestone: section.milestone,
        };
        continue;
      }

      return invalidStructure(`Unsupported heading on line ${lineNumber}.`);
    }

    const taskItemText = readTaskItemText(line);

    if (taskItemText !== null) {
      finishTask();

      if (section?.type !== "milestone_tasks") {
        return invalidStructure(
          `Task item on line ${lineNumber} must be inside a milestone Tasks section.`,
        );
      }

      const parsed = parseField(taskItemText, lineNumber);
      if (!parsed.ok) {
        return parsed;
      }

      if (parsed.data.field !== "title") {
        return invalidStructure(
          `Task item on line ${lineNumber} must start with Title.`,
        );
      }

      currentTask = {
        title: parsed.data.value,
      };
      continue;
    }

    const parsed = parseField(line, lineNumber);
    if (!parsed.ok) {
      return parsed;
    }

    if (currentTask) {
      if (!taskFields.has(parsed.data.field)) {
        return invalidStructure(
          `Unknown task field "${parsed.data.rawField}" on line ${lineNumber}.`,
        );
      }

      applyTaskField(currentTask, parsed.data.field, parsed.data.value);
      continue;
    }

    if (section?.type === "project") {
      if (!projectFields.has(parsed.data.field)) {
        return invalidStructure(`Unknown project field "${parsed.data.rawField}" on line ${lineNumber}.`);
      }

      if (!currentDocument) {
        return invalidStructure(`Content on line ${lineNumber} is outside a project section.`);
      }

      const result = applyProjectField(
        currentDocument.project,
        parsed.data.field,
        parsed.data.value,
      );
      if (!result.ok) {
        return result;
      }
      continue;
    }

    if (section?.type === "milestone") {
      if (!milestoneFields.has(parsed.data.field)) {
        return invalidStructure(
          `Unknown milestone field "${parsed.data.rawField}" on line ${lineNumber}.`,
        );
      }

      const result = applyMilestoneField(
        section.milestone,
        parsed.data.field,
        parsed.data.value,
      );
      if (!result.ok) {
        return result;
      }
      continue;
    }

    return invalidStructure(`Content on line ${lineNumber} is outside a project section.`);
  }

  finishTask();

  if (documents.length === 0) {
    return invalidStructure("Project import Markdown must include a Project heading.");
  }

  const firstDocument = documents[0];

  return {
    ok: true,
    data:
      documents.length === 1 && firstDocument
        ? (firstDocument satisfies ProjectImportDocument)
        : ({
            projects: documents,
          } satisfies ProjectImportBatchDocument),
  };
}

export function parseProjectJsonToDocument(
  value: unknown,
): ProjectImportResult<ProjectImportDocument> {
  return parseProjectJsonDocument(value);
}

export function parseProjectJsonToDocuments(
  value: unknown,
): ProjectImportResult<ProjectImportBatchDocument> {
  if (!isRecord(value)) {
    return invalidStructure("Project import JSON must be an object.");
  }

  if (value.projects !== undefined) {
    const unknownRoot = unknownKeys(value, ["projects"]);
    if (unknownRoot) {
      return invalidStructure(`Unknown root field "${unknownRoot}".`);
    }

    return parseProjectArray(value.projects);
  }

  const document = parseProjectJsonDocument(value);

  if (!document.ok) {
    return document;
  }

  return {
    ok: true,
    data: {
      projects: [document.data],
    },
  };
}

export function parseProjectMarkdownToDocuments(
  markdown: string,
): ProjectImportResult<ProjectImportBatchDocument> {
  const parsed = parseProjectMarkdownToJson(markdown);

  if (!parsed.ok) {
    return parsed;
  }

  return parseProjectJsonToDocuments(parsed.data);
}

function parseProjectArray(
  value: unknown,
): ProjectImportResult<ProjectImportBatchDocument> {
  if (!Array.isArray(value)) {
    return invalidStructure("projects must be an array.");
  }

  if (value.length === 0) {
    return missing("projects", "Project import JSON must include at least one project.");
  }

  const projects: ProjectImportDocument[] = [];

  for (const item of value) {
    const document = parseProjectJsonDocument(item);

    if (!document.ok) {
      return document;
    }

    projects.push(document.data);
  }

  return {
    ok: true,
    data: {
      projects,
    },
  };
}

function parseProjectJsonDocument(
  value: unknown,
): ProjectImportResult<ProjectImportDocument> {
  if (!isRecord(value)) {
    return invalidStructure("Project import JSON must be an object.");
  }

  const unknownRoot = unknownKeys(value, ["project", "milestones"]);
  if (unknownRoot) {
    return invalidStructure(`Unknown root field "${unknownRoot}".`);
  }

  const projectResult = parseProject(value.project);
  if (!projectResult.ok) {
    return projectResult;
  }

  const milestonesResult = parseMilestones(value.milestones);
  if (!milestonesResult.ok) {
    return milestonesResult;
  }

  return {
    ok: true,
    data: {
      project: projectResult.data,
      milestones: milestonesResult.data,
    },
  };
}

function parseProject(value: unknown): ProjectImportResult<ProjectImportDocument["project"]> {
  if (!isRecord(value)) {
    return missing("project", "Project import JSON must include a project object.");
  }

  const unknown = unknownKeys(value, ["objective", "startDate", "timeline", "title"]);
  if (unknown) {
    return invalidStructure(`Unknown project field "${unknown}".`);
  }

  const title = readOptionalString(value.title, "project.title");
  if (!title.ok) {
    return title;
  }

  const objective = readOptionalString(value.objective, "project.objective");
  if (!objective.ok) {
    return objective;
  }

  const startDate = readOptionalString(value.startDate, "project.startDate");
  if (!startDate.ok) {
    return startDate;
  }

  const timeline = parseTimeline(value.timeline, "project.timeline");
  if (!timeline.ok) {
    return timeline;
  }

  return {
    ok: true,
    data: {
      title: title.data ?? "",
      objective: objective.data,
      startDate: startDate.data,
      timeline: timeline.data,
    },
  };
}

function parseMilestones(value: unknown): ProjectImportResult<ProjectImportMilestone[]> {
  if (value === undefined) {
    return { ok: true, data: [] };
  }

  if (!Array.isArray(value)) {
    return invalidStructure("milestones must be an array.");
  }

  const milestones: ProjectImportMilestone[] = [];

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      return invalidStructure(`milestones[${index}] must be an object.`);
    }

    const unknown = unknownKeys(item, [
      "objective",
      "startDate",
      "tasks",
      "timeline",
      "title",
    ]);
    if (unknown) {
      return invalidStructure(`Unknown milestone field "${unknown}".`);
    }

    const title = readOptionalString(item.title, `milestones[${index}].title`);
    if (!title.ok) {
      return title;
    }

    const objective = readOptionalString(
      item.objective,
      `milestones[${index}].objective`,
    );
    if (!objective.ok) {
      return objective;
    }

    const startDate = readOptionalString(
      item.startDate,
      `milestones[${index}].startDate`,
    );
    if (!startDate.ok) {
      return startDate;
    }

    const timeline = parseTimeline(
      item.timeline,
      `milestones[${index}].timeline`,
    );
    if (!timeline.ok) {
      return timeline;
    }

    const tasks = parseTasks(item.tasks, `milestones[${index}].tasks`);
    if (!tasks.ok) {
      return tasks;
    }

    milestones.push({
      title: title.data ?? "",
      objective: objective.data,
      startDate: startDate.data,
      timeline: timeline.data,
      tasks: tasks.data,
    });
  }

  return { ok: true, data: milestones };
}

function parseTasks(
  value: unknown,
  field: string,
): ProjectImportResult<ProjectImportTask[]> {
  if (value === undefined) {
    return { ok: true, data: [] };
  }

  if (!Array.isArray(value)) {
    return invalidStructure(`${field} must be an array.`);
  }

  const tasks: ProjectImportTask[] = [];

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      return invalidStructure(`tasks[${index}] must be an object.`);
    }

    const unknown = unknownKeys(item, [
      "deadlineDate",
      "description",
      "startDate",
      "title",
    ]);
    if (unknown) {
      return invalidStructure(`Unknown task field "${unknown}".`);
    }

    const title = readOptionalString(item.title, `tasks[${index}].title`);
    if (!title.ok) {
      return title;
    }

    const description = readOptionalString(
      item.description,
      `tasks[${index}].description`,
    );
    if (!description.ok) {
      return description;
    }

    const startDate = readOptionalString(item.startDate, `tasks[${index}].startDate`);
    if (!startDate.ok) {
      return startDate;
    }

    const deadlineDate = readOptionalString(
      item.deadlineDate,
      `tasks[${index}].deadlineDate`,
    );
    if (!deadlineDate.ok) {
      return deadlineDate;
    }

    tasks.push({
      title: title.data ?? "",
      description: description.data,
      startDate: startDate.data,
      deadlineDate: deadlineDate.data,
    });
  }

  return { ok: true, data: tasks };
}

function parseTimeline(
  value: unknown,
  field: string,
): ProjectImportResult<ProjectImportTimeline | undefined> {
  if (value === undefined) {
    return { ok: true, data: undefined };
  }

  if (!isRecord(value)) {
    return invalid(field, "Timeline must be an object.");
  }

  const type = value.type;

  if (type === "deadline") {
    const unknown = unknownKeys(value, ["deadlineDate", "type"]);
    if (unknown) {
      return invalidStructure(`Unknown timeline field "${unknown}".`);
    }

    const deadlineDate = readOptionalString(
      value.deadlineDate,
      `${field}.deadlineDate`,
    );
    if (!deadlineDate.ok) {
      return deadlineDate;
    }

    return {
      ok: true,
      data: {
        type,
        deadlineDate: deadlineDate.data ?? "",
      },
    };
  }

  if (type === "duration") {
    const unknown = unknownKeys(value, ["durationRange", "type"]);
    if (unknown) {
      return invalidStructure(`Unknown timeline field "${unknown}".`);
    }

    const durationRange = readOptionalString(
      value.durationRange,
      `${field}.durationRange`,
    );
    if (!durationRange.ok) {
      return durationRange;
    }

    const range = coerceProjectDurationRange(durationRange.data);

    return {
      ok: true,
      data: {
        type,
        durationRange: range as ProjectDurationRange,
      },
    };
  }

  return invalid(`${field}.type`, "Timeline type must be deadline or duration.");
}

function parseField(
  line: string,
  lineNumber: number,
): ProjectImportResult<{ field: string; rawField: string; value: string }> {
  const separator = line.indexOf(":");

  if (separator < 1) {
    return invalidStructure(`Expected Field: value on line ${lineNumber}.`);
  }

  const rawField = line.slice(0, separator).trim();
  const field = normalizeFieldName(rawField);

  if (!knownFields.has(field)) {
    return invalidStructure(`Unknown field "${rawField}" on line ${lineNumber}.`);
  }

  return {
    ok: true,
    data: {
      field,
      rawField,
      value: line.slice(separator + 1).trim(),
    },
  };
}

function readTaskItemText(line: string) {
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return line.slice(2);
  }

  return null;
}

function applyProjectField(
  project: MutableProject,
  field: string,
  value: string,
): ProjectImportResult<undefined> {
  if (field === "objective") {
    project.objective = value;
  } else if (field === "start date") {
    project.startDate = value;
  } else if (field === "timeline") {
    const timeline = readMarkdownTimeline(value, project.timeline, "project.timeline");
    if (!timeline.ok) {
      return timeline;
    }
    project.timeline = timeline.data;
  } else if (field === "deadline") {
    project.timeline = { type: "deadline", deadlineDate: value };
  } else if (field === "duration") {
    project.timeline = {
      type: "duration",
      durationRange: coerceProjectDurationRange(value),
    };
  }

  return { ok: true, data: undefined };
}

function applyMilestoneField(
  milestone: ProjectImportMilestone,
  field: string,
  value: string,
): ProjectImportResult<undefined> {
  if (field === "title") {
    milestone.title = value;
  } else if (field === "objective") {
    milestone.objective = value;
  } else if (field === "start date") {
    milestone.startDate = value;
  } else if (field === "timeline") {
    const timeline = readMarkdownTimeline(
      value,
      milestone.timeline,
      "milestones.timeline",
    );
    if (!timeline.ok) {
      return timeline;
    }
    milestone.timeline = timeline.data;
  } else if (field === "deadline") {
    milestone.timeline = { type: "deadline", deadlineDate: value };
  } else if (field === "duration") {
    milestone.timeline = {
      type: "duration",
      durationRange: coerceProjectDurationRange(value),
    };
  }

  return { ok: true, data: undefined };
}

function applyTaskField(task: ProjectImportTask, field: string, value: string) {
  if (field === "title") {
    task.title = value;
  } else if (field === "description") {
    task.description = value;
  } else if (field === "start date") {
    task.startDate = value;
  } else if (field === "deadline") {
    task.deadlineDate = value;
  }
}

function readMarkdownTimeline(
  value: string,
  current: ProjectImportTimeline | undefined,
  field: string,
): ProjectImportResult<ProjectImportTimeline | undefined> {
  if (/^deadline$/i.test(value)) {
    return {
      ok: true,
      data: {
        type: "deadline",
        deadlineDate: current?.type === "deadline" ? current.deadlineDate : "",
      },
    };
  }

  if (/^duration$/i.test(value)) {
    return {
      ok: true,
      data: {
        type: "duration",
        durationRange:
          current?.type === "duration" ? current.durationRange : "3_6_months",
      },
    };
  }

  return invalid(field, "Timeline type must be deadline or duration.");
}

function readOptionalString(
  value: unknown,
  field: string,
): ProjectImportResult<string | undefined> {
  if (value === undefined) {
    return { ok: true, data: undefined };
  }

  if (typeof value !== "string") {
    return invalid(field, `${field} must be text.`);
  }

  return { ok: true, data: value };
}

function unknownKeys(value: Record<string, unknown>, allowed: string[]) {
  const allowedSet = new Set(allowed);
  return Object.keys(value).find((key) => !allowedSet.has(key)) ?? null;
}

function normalizeFieldName(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ");
}

function isSeparatorLine(value: string) {
  return /^-{3,}$/.test(value);
}

function readProjectHeading(line: string) {
  const hashedProjectHeading = line.match(/^#\s+Project:\s*(.*)$/i);

  if (hashedProjectHeading) {
    return hashedProjectHeading[1].trim();
  }

  const bareProjectHeading = line.match(/^Project:\s*(.*)$/i);

  if (bareProjectHeading) {
    return bareProjectHeading[1].trim();
  }

  if (line.startsWith("# ")) {
    return line.slice(2).trim();
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function missing(field: string, message: string) {
  return {
    ok: false,
    code: "project_import_missing",
    message,
    category: "missing_parameter",
    subject: "project",
    field,
    reason: "required",
  } satisfies ProjectImportResult<never>;
}

function invalid(field: string, message: string) {
  return {
    ok: false,
    code: "project_import_invalid",
    message,
    category: "invalid_parameter",
    subject: "project",
    field,
    reason: "invalid_value",
  } satisfies ProjectImportResult<never>;
}

function invalidStructure(message: string) {
  return invalid("structure", message);
}
