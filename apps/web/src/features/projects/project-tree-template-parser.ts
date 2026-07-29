import type {
  ProjectTreeTemplateDocument,
  ProjectTreeTemplateMilestoneDraft,
  ProjectTreeTemplateResult,
  ProjectTreeTemplateTaskDraft,
} from "./project-tree-template-types.ts";
import {
  invalidProjectTreeTemplateParse,
  normalizeProjectTreeTemplateFieldName,
  parseProjectTreeTemplateField,
  parseProjectTreeTemplateHeading,
  stripProjectTreeTemplateCommentLine,
} from "./project-tree-template-parser-primitives.ts";
import type { ProjectTreeTemplateHeading } from "./project-tree-template-parser-primitives.ts";

type Section = "project" | "top_tasks" | "milestone_fields" | "milestone_tasks";

type TaskOwner =
  | {
      type: "top";
      tasks: ProjectTreeTemplateTaskDraft[];
    }
  | {
      type: "milestone";
      milestone: ProjectTreeTemplateMilestoneDraft;
    };

type ParserState = {
  document: ProjectTreeTemplateDocument;
  section: Section;
  currentMilestone: ProjectTreeTemplateMilestoneDraft | null;
  currentTask: ProjectTreeTemplateTaskDraft | null;
  currentTaskOwner: TaskOwner | null;
  inComment: boolean;
};

export function parseProjectTreeTemplateMarkdown(
  source: string,
): ProjectTreeTemplateResult<ProjectTreeTemplateDocument> {
  const state: ParserState = {
    document: emptyDocument(),
    section: "project",
    currentMilestone: null,
    currentTask: null,
    currentTaskOwner: null,
    inComment: false,
  };
  const lines = source.replace(/\r\n?/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = stripProjectTreeTemplateCommentLine(lines[index], state);

    if (line === null) {
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed || trimmed === "---") {
      continue;
    }

    const heading = parseProjectTreeTemplateHeading(trimmed);

    if (heading) {
      const handled = handleHeading(state, heading);

      if (!handled.ok) {
        return handled;
      }

      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const handled = handleTaskBullet(state, line, lineNumber);

      if (!handled.ok) {
        return handled;
      }

      continue;
    }

    const field = parseProjectTreeTemplateField(trimmed, lineNumber);

    if (!field.ok) {
      ignoreTemplateField(state);
      continue;
    }

    assignField(state, field.data.name, field.data.value);
  }

  commitTask(state);

  return {
    ok: true,
    data: state.document,
  };
}

function emptyDocument(): ProjectTreeTemplateDocument {
  return {
    project: {
      projectId: "",
      operation: "",
      title: "",
      objective: "",
      startDate: "",
      timelineType: "",
      deadlineDate: "",
      durationRange: "",
    },
    topLevelTasks: [],
    milestones: [],
    ignoredFieldCount: 0,
  };
}

function emptyMilestone(title = ""): ProjectTreeTemplateMilestoneDraft {
  return {
    milestoneId: "",
    operation: "",
    title,
    objective: "",
    startDate: "",
    timelineType: "",
    deadlineDate: "",
    durationRange: "",
    tasks: [],
  };
}

function emptyTask(): ProjectTreeTemplateTaskDraft {
  return {
    taskId: "",
    operation: "",
    title: "",
    description: "",
    startDate: "",
    deadlineDate: "",
    estimatedDurationMinutes: "",
  };
}

function handleHeading(
  state: ParserState,
  heading: ProjectTreeTemplateHeading,
): ProjectTreeTemplateResult<undefined> {
  const normalized = normalizeProjectTreeTemplateFieldName(
    heading.text.replace(/:.+$/, ""),
  );
  const valueAfterColon = heading.text.includes(":")
    ? heading.text.slice(heading.text.indexOf(":") + 1).trim()
    : "";

  commitTask(state);

  if (
    normalized === "project_tree_template" ||
    normalized === "project_template"
  ) {
    state.section = "project";
    return ok();
  }

  if (normalized === "project") {
    state.section = "project";
    return ok();
  }

  if (
    normalized === "top_level_tasks" ||
    normalized === "tasks_without_milestone"
  ) {
    state.section = "top_tasks";
    state.currentMilestone = null;
    return ok();
  }

  if (normalized === "milestones") {
    state.section = "milestone_fields";
    state.currentMilestone = null;
    return ok();
  }

  if (normalized === "milestone") {
    const milestone = emptyMilestone(valueAfterColon);

    state.document.milestones.push(milestone);
    state.currentMilestone = milestone;
    state.section = "milestone_fields";
    return ok();
  }

  if (normalized === "tasks") {
    if (state.currentMilestone) {
      state.section = "milestone_tasks";
      return ok();
    }

    state.section = "top_tasks";
    return ok();
  }

  return ok();
}

function handleTaskBullet(
  state: ParserState,
  line: string,
  lineNumber: number,
): ProjectTreeTemplateResult<undefined> {
  if (state.section !== "top_tasks" && state.section !== "milestone_tasks") {
    return invalidProjectTreeTemplateParse(
      `Task item on line ${lineNumber} must be inside a Tasks section.`,
    );
  }

  commitTask(state);

  const owner: TaskOwner =
    state.section === "milestone_tasks" && state.currentMilestone
      ? { type: "milestone", milestone: state.currentMilestone }
      : { type: "top", tasks: state.document.topLevelTasks };
  const task = emptyTask();
  const itemText = line.replace(/^[-*]\s+/, "").trim();

  state.currentTask = task;
  state.currentTaskOwner = owner;

  if (!itemText) {
    return ok();
  }

  const field = parseProjectTreeTemplateField(itemText, lineNumber);

  if (field.ok) {
    if (!assignTaskField(task, field.data.name, field.data.value)) {
      ignoreTemplateField(state);
    }
  } else {
    task.title = itemText;
  }

  return ok();
}

function commitTask(state: ParserState) {
  if (!state.currentTask || !state.currentTaskOwner) {
    return;
  }

  if (state.currentTaskOwner.type === "milestone") {
    state.currentTaskOwner.milestone.tasks.push(state.currentTask);
  } else {
    state.currentTaskOwner.tasks.push(state.currentTask);
  }

  state.currentTask = null;
  state.currentTaskOwner = null;
}

function assignField(
  state: ParserState,
  name: string,
  value: string,
): void {
  if (state.currentTask) {
    if (!assignTaskField(state.currentTask, name, value)) {
      ignoreTemplateField(state);
    }
    return;
  }

  if (state.section === "project") {
    if (!assignProjectField(state.document.project, name, value)) {
      ignoreTemplateField(state);
    }
    return;
  }

  if (state.currentMilestone) {
    if (!assignMilestoneField(state.currentMilestone, name, value)) {
      ignoreTemplateField(state);
    }
    return;
  }

  ignoreTemplateField(state);
}

function assignProjectField(
  project: ProjectTreeTemplateDocument["project"],
  name: string,
  value: string,
) {
  if (name === "project_id") {
    project.projectId = value;
  } else if (name === "op" || name === "operation") {
    project.operation = value;
  } else if (name === "title") {
    project.title = value;
  } else if (name === "objective" || name === "description") {
    project.objective = value;
  } else if (name === "start_date") {
    project.startDate = value;
  } else if (name === "timeline" || name === "timeline_type") {
    project.timelineType = value;
  } else if (name === "deadline" || name === "deadline_date") {
    project.deadlineDate = value;
  } else if (name === "duration" || name === "duration_range") {
    project.durationRange = value;
  } else {
    return false;
  }

  return true;
}

function assignMilestoneField(
  milestone: ProjectTreeTemplateMilestoneDraft,
  name: string,
  value: string,
) {
  if (name === "milestone_id") {
    milestone.milestoneId = value;
  } else if (name === "op" || name === "operation") {
    milestone.operation = value;
  } else if (name === "title") {
    milestone.title = value;
  } else if (name === "objective" || name === "description") {
    milestone.objective = value;
  } else if (name === "start_date") {
    milestone.startDate = value;
  } else if (name === "timeline" || name === "timeline_type") {
    milestone.timelineType = value;
  } else if (name === "deadline" || name === "deadline_date") {
    milestone.deadlineDate = value;
  } else if (name === "duration" || name === "duration_range") {
    milestone.durationRange = value;
  } else {
    return false;
  }

  return true;
}

function assignTaskField(
  task: ProjectTreeTemplateTaskDraft,
  name: string,
  value: string,
) {
  if (name === "task_id") {
    task.taskId = value;
  } else if (name === "op" || name === "operation") {
    task.operation = value;
  } else if (name === "title") {
    task.title = value;
  } else if (name === "description") {
    task.description = value;
  } else if (name === "start_date") {
    task.startDate = value;
  } else if (name === "deadline" || name === "deadline_date") {
    task.deadlineDate = value;
  } else if (
    name === "estimated_duration" ||
    name === "estimated_duration_minutes"
  ) {
    task.estimatedDurationMinutes = value;
  } else {
    return false;
  }

  return true;
}

function ok(): ProjectTreeTemplateResult<undefined> {
  return {
    ok: true,
    data: undefined,
  };
}

function ignoreTemplateField(state: ParserState) {
  state.document.ignoredFieldCount += 1;
}
