import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectTreeTemplateMarkdown } from "../project-tree-template-parser.ts";
import { normalizeProjectTreeTemplateDocument } from "../project-tree-template-normalizer.ts";
import {
  projectTreeTemplateForNewProject,
  projectTreeTemplateForProject,
} from "../project-tree-template-serializer.ts";
import { InMemoryProjectRepository } from "../server/project-repository.ts";
import { createProjectService } from "../server/project-service.ts";
import type {
  ApplyProjectTreeTemplateInput,
  ProjectMilestoneRecord,
  ProjectRecord,
  ProjectTaskRecord,
} from "../server/project-repository.ts";
import type { ProjectView } from "../project-view-models.ts";

const userId = "user-1";
const now = new Date("2026-07-29T10:00:00.000Z");

test("project tree template parser reads top-level and milestone tasks", () => {
  const parsed = parseProjectTreeTemplateMarkdown(`# Project Tree Template

## Project
project_id: project-1
op: update
title: Find a job
objective: Land a backend role.
start_date: 2026-07-29
timeline: duration
duration: 3_6_months

## Top-level Tasks
- op: update
  task_id: task-1
  title: Prepare resume
  description: Rewrite bullets.

## Milestones
### Milestone: Applications
milestone_id: milestone-1
op: update
title: Applications
objective: Submit strong applications.
start_date: 2026-07-29
timeline: deadline
deadline: 2026-08-29

#### Tasks
- op: create
  task_id:
  title: Apply to one role
  deadline: 2026-08-02
`);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  assert.equal(parsed.data.project.projectId, "project-1");
  assert.equal(parsed.data.topLevelTasks[0].taskId, "task-1");
  assert.equal(parsed.data.milestones[0].milestoneId, "milestone-1");
  assert.equal(parsed.data.milestones[0].tasks[0].operation, "create");
});

test("project template parser ignores unsupported extra fields", () => {
  const parsed = parseProjectTreeTemplateMarkdown(`# Project Template
## Project
project_id:
op: create
title: Learn Japanese
objective: Pass the N3 exam.
start_date: 2026-07-29
timeline: duration
duration: 6_12_months
priority: high

## Top-level Tasks
- op: create
  task_id:
  title: Buy textbook
  color: blue
  this line is an unsupported note
`);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  assert.equal(parsed.data.ignoredFieldCount, 3);

  const normalized = normalizeProjectTreeTemplateDocument({
    document: parsed.data,
    createId: () => "",
  });

  assert.equal(normalized.ok, true);

  if (!normalized.ok) {
    return;
  }

  assert.equal(normalized.data.preview.ignoredFieldCount, 3);
  assert.equal(normalized.data.preview.items[1].title, "Buy textbook");
});

test("project tree template serializer round trips escaped multiline text", () => {
  const template = projectTreeTemplateForProject(projectView({
    description: "Line one\nLine two",
  }));
  const parsed = parseProjectTreeTemplateMarkdown(template);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  assert.equal(parsed.data.project.objective, "Line one\nLine two");
});

test("project template serializer orders fields as id op then dialog fields", () => {
  const template = projectTreeTemplateForProject(projectView({
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        projectTitle: "Find a job",
        milestoneId: null,
        milestoneTitle: "",
        title: "Prepare resume",
        description: "Rewrite bullets.",
        status: "todo",
        startDate: "2026-07-29",
        deadlineDate: "2026-08-02",
        estimatedDurationMinutes: "45",
      },
    ],
  }));
  const projectIndex = template.indexOf("project_id: project-1\nop: update\ntitle:");
  const taskIndex = template.indexOf(
    "- task_id: task-1\n  op: update\n  title: Prepare resume\n  description:",
  );

  assert.notEqual(projectIndex, -1);
  assert.notEqual(taskIndex, -1);
});

test("project tree template create mode accepts blank ids", async () => {
  const parsed = parseProjectTreeTemplateMarkdown(`# Project Tree Template
## Project
project_id:
op: create
title: Learn Japanese
objective: Pass the N3 exam.
start_date: 2026-07-29
timeline: duration
duration: 6_12_months

## Top-level Tasks
- op: create
  task_id:
  title: Buy textbook
  estimated_duration_minutes: 30

## Milestones
### Milestone: Foundation
milestone_id:
op: create
title: Foundation
objective: Build daily study basics.
start_date: 2026-07-29
timeline: duration
duration: 1_3_months

#### Tasks
- op: create
  task_id:
  title: Review kana
  deadline: 2026-08-05
`);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  const previewOnly = normalizeProjectTreeTemplateDocument({
    document: parsed.data,
    createId: () => "",
  });

  assert.equal(previewOnly.ok, true);

  if (!previewOnly.ok) {
    return;
  }

  assert.equal(previewOnly.data.mode, "create");
  assert.equal(previewOnly.data.command.project.projectId, "");
  assert.deepEqual(previewOnly.data.preview.counts, {
    create: 4,
    update: 0,
    delete: 0,
    preserve: 0,
  });

  const ids = [
    "project-new",
    "task-top",
    "milestone-new",
    "task-foundation",
  ];
  const normalized = normalizeProjectTreeTemplateDocument({
    document: parsed.data,
    createId: () => ids.shift() ?? "",
  });

  assert.equal(normalized.ok, true);

  if (!normalized.ok || normalized.data.mode !== "create") {
    return;
  }

  const service = createProjectService({
    projects: new InMemoryProjectRepository(),
    now: () => now,
  });
  const projectId = await service.createProjectTreeTemplate(
    userId,
    normalized.data.command,
  );
  const [project] = await service.listProjects(userId);

  assert.equal(projectId, "project-new");
  assert.equal(project.title, "Learn Japanese");
  assert.equal(project.milestones[0].id, "milestone-new");
  assert.equal(project.tasks.find((task) => task.id === "task-top")?.milestoneId, null);
  assert.equal(
    project.tasks.find((task) => task.id === "task-foundation")?.milestoneId,
    "milestone-new",
  );
});

test("project tree template create mode rejects edit operations", () => {
  const parsed = parseProjectTreeTemplateMarkdown(`# Project Tree Template
## Project
project_id:
op: create
title: Learn Japanese
start_date: 2026-07-29
timeline: duration
duration: 6_12_months

## Top-level Tasks
- op: update
  task_id:
  title: Existing task
`);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  const normalized = normalizeProjectTreeTemplateDocument({
    document: parsed.data,
    createId: () => "",
  });

  assert.equal(normalized.ok, false);
  if (!normalized.ok) {
    assert.equal(normalized.code, "project_template_invalid");
    assert.match(normalized.message, /only use op: create/);
  }
});

test("project tree template create serializer uses blank ids", () => {
  const template = projectTreeTemplateForNewProject({
    title: "Move home",
    description: "Find a rental and move.",
    startDate: "2026-07-29",
    timelineType: "deadline",
    deadlineDate: "2026-08-29",
    durationRange: "3_6_months",
  });
  const parsed = parseProjectTreeTemplateMarkdown(template);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  assert.equal(parsed.data.project.projectId, "");
  assert.equal(parsed.data.project.operation, "create");
  assert.equal(parsed.data.project.title, "Move home");
  assert.equal(parsed.data.project.deadlineDate, "2026-08-29");
});

test("project tree template normalization rejects invalid ids and operations", () => {
  const currentProject = projectRecord({});
  const createWithId = parseProjectTreeTemplateMarkdown(`# Project Tree Template
## Project
project_id: project-1
op: update
title: Find a job
start_date: 2026-07-29
timeline: duration
duration: 3_6_months

## Top-level Tasks
- op: create
  task_id: task-1
  title: Duplicate task
`);

  assert.equal(createWithId.ok, true);

  if (createWithId.ok) {
    const normalized = normalizeProjectTreeTemplateDocument({
      document: createWithId.data,
      currentProject,
    });

    assert.equal(normalized.ok, false);
    if (!normalized.ok) {
      assert.equal(normalized.code, "project_template_invalid");
      assert.match(normalized.message, /create rows must leave task_id empty/);
    }
  }

  const mismatch = parseProjectTreeTemplateMarkdown(`# Project Tree Template
## Project
project_id: other-project
op: update
title: Find a job
start_date: 2026-07-29
timeline: duration
duration: 3_6_months
`);

  assert.equal(mismatch.ok, true);

  if (mismatch.ok) {
    const normalized = normalizeProjectTreeTemplateDocument({
      document: mismatch.data,
      currentProject,
    });

    assert.equal(normalized.ok, false);
    if (!normalized.ok) {
      assert.equal(normalized.code, "project_template_project_mismatch");
    }
  }
});

test("project tree template preview marks unchanged update rows as preserve", () => {
  const task = taskRecord({
    id: "task-1",
    milestoneId: "milestone-1",
    milestoneTitle: "Applications",
  });
  const currentProject = projectRecord({
    milestones: [
      milestoneRecord({
        id: "milestone-1",
        tasks: [task],
      }),
    ],
    tasks: [task],
  });
  const parsed = parseProjectTreeTemplateMarkdown(`# Project Tree Template
## Project
project_id: project-1
op: update
title: Find a job
objective: Land a backend role.
start_date: 2026-07-29
timeline: duration
duration: 3_6_months

## Top-level Tasks

## Milestones
### Milestone: Applications
milestone_id: milestone-1
op: update
title: Applications
objective:
start_date: 2026-07-29
timeline: duration
duration: 1_3_months

#### Tasks
- task_id: task-1
  op: update
  title: Prepare resume
  description:
  start_date:
  deadline:
  estimated_duration_minutes:
`);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  const normalized = normalizeProjectTreeTemplateDocument({
    document: parsed.data,
    currentProject,
  });

  assert.equal(normalized.ok, true);

  if (!normalized.ok) {
    return;
  }

  assert.deepEqual(
    normalized.data.preview.items.map((item) => item.operation),
    ["preserve", "preserve", "preserve"],
  );
  assert.deepEqual(normalized.data.preview.counts, {
    create: 0,
    update: 0,
    delete: 0,
    preserve: 3,
  });
});

test("project tree template edit preview includes created task rows", () => {
  const currentProject = projectRecord({
    milestones: [milestoneRecord({ id: "milestone-1" })],
  });
  const parsed = parseProjectTreeTemplateMarkdown(`# Project Tree Template
## Project
project_id: project-1
op: update
title: Find a job
objective: Land a backend role.
start_date: 2026-07-29
timeline: duration
duration: 3_6_months

## Top-level Tasks
- task_id:
  op: create
  title: New top task

## Milestones
### Milestone: Applications
milestone_id: milestone-1
op: update
title: Applications
objective:
start_date: 2026-07-29
timeline: duration
duration: 1_3_months

#### Tasks
- task_id:
  op: create
  title: New milestone task
`);

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  const normalized = normalizeProjectTreeTemplateDocument({
    document: parsed.data,
    currentProject,
    createId: () => "",
  });

  assert.equal(normalized.ok, true);

  if (!normalized.ok) {
    return;
  }

  assert.deepEqual(
    normalized.data.preview.items
      .filter((item) => item.operation === "create")
      .map((item) => item.title),
    ["New top task", "New milestone task"],
  );
  assert.equal(normalized.data.preview.counts.create, 2);
});

test("project tree template apply updates, creates, moves, deletes, and preserves rows", async () => {
  const service = createProjectService({
    projects: new InMemoryProjectRepository({
      projects: [
        projectRecord({
          milestones: [
            milestoneRecord({
              id: "milestone-1",
              title: "Applications",
            }),
          ],
          tasks: [
            taskRecord({
              id: "task-1",
              milestoneId: "milestone-1",
              milestoneTitle: "Applications",
              title: "Prepare resume",
            }),
            taskRecord({
              id: "task-2",
              milestoneId: null,
              milestoneTitle: "",
              title: "Find roles",
            }),
            taskRecord({
              id: "task-preserved",
              milestoneId: null,
              milestoneTitle: "",
              title: "Preserved task",
            }),
            taskRecord({
              id: "task-delete",
              milestoneId: null,
              milestoneTitle: "",
              title: "Remove this task",
            }),
          ],
        }),
      ],
    }),
    now: () => now,
  });
  const applied = await service.applyProjectTreeTemplate(
    userId,
    applyCommand({
      milestones: [
        {
          operation: "update",
          milestoneId: "milestone-1",
          title: "Applications updated",
          objective: "Submit stronger applications.",
          startDate: "2026-07-29",
          deadlineDate: null,
          expectedDurationDays: 90,
        },
        {
          operation: "create",
          milestoneId: "milestone-2",
          title: "Interviews",
          objective: null,
          startDate: "2026-08-01",
          deadlineDate: null,
          expectedDurationDays: 90,
        },
      ],
      tasks: [
        {
          operation: "update",
          taskId: "task-1",
          milestoneId: null,
          title: "Prepare resume updated",
          description: null,
          startDate: "2026-07-29",
          deadlineDate: "2026-08-02",
          estimatedDurationMinutes: 60,
        },
        {
          operation: "update",
          taskId: "task-2",
          milestoneId: "milestone-2",
          title: "Find roles updated",
          description: "Move under interviews.",
          startDate: null,
          deadlineDate: null,
          estimatedDurationMinutes: null,
        },
        {
          operation: "create",
          taskId: "task-3",
          milestoneId: "milestone-2",
          title: "Practice interview",
          description: null,
          startDate: null,
          deadlineDate: "2026-08-10",
          estimatedDurationMinutes: 45,
        },
        {
          operation: "delete",
          taskId: "task-delete",
        },
      ],
    }),
  );
  const [project] = await service.listProjects(userId);

  assert.equal(applied, true);
  assert.equal(project.title, "Find a job updated");
  assert.equal(project.milestones.length, 2);
  assert.equal(project.milestones[0].title, "Applications updated");
  assert.equal(project.tasks.some((task) => task.id === "task-delete"), false);
  assert.equal(
    project.tasks.find((task) => task.id === "task-preserved")?.title,
    "Preserved task",
  );
  assert.equal(project.tasks.find((task) => task.id === "task-1")?.milestoneId, null);
  assert.equal(project.tasks.find((task) => task.id === "task-2")?.milestoneId, "milestone-2");
  assert.equal(project.tasks.find((task) => task.id === "task-3")?.milestoneId, "milestone-2");
});

test("project tree template apply deletes milestone and its tasks", async () => {
  const service = createProjectService({
    projects: new InMemoryProjectRepository({
      projects: [
        projectRecord({
          milestones: [milestoneRecord({ id: "milestone-1" })],
          tasks: [
            taskRecord({
              id: "task-1",
              milestoneId: "milestone-1",
              milestoneTitle: "Applications",
            }),
          ],
        }),
      ],
    }),
    now: () => now,
  });

  const applied = await service.applyProjectTreeTemplate(
    userId,
    applyCommand({
      milestones: [
        {
          operation: "delete",
          milestoneId: "milestone-1",
        },
      ],
      tasks: [],
    }),
  );
  const [project] = await service.listProjects(userId);

  assert.equal(applied, true);
  assert.equal(project.milestones.length, 0);
  assert.equal(project.tasks.length, 0);
});

function projectRecord(input: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: input.id ?? "project-1",
    userId,
    title: input.title ?? "Find a job",
    objective: input.objective ?? "Land a backend role.",
    startDate: input.startDate ?? "2026-07-29",
    deadlineDate: input.deadlineDate ?? null,
    expectedDurationDays: input.expectedDurationDays ?? 180,
    sidebarPinOrder: input.sidebarPinOrder ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: input.completedAt ?? null,
    deletedAt: input.deletedAt ?? null,
    tasks: input.tasks ?? [],
    milestones: input.milestones ?? [],
  };
}

function milestoneRecord(
  input: Partial<ProjectMilestoneRecord>,
): ProjectMilestoneRecord {
  return {
    id: input.id ?? "milestone-1",
    userId,
    projectId: input.projectId ?? "project-1",
    title: input.title ?? "Applications",
    objective: input.objective ?? null,
    sortOrder: input.sortOrder ?? 0,
    startDate: input.startDate ?? "2026-07-29",
    deadlineDate: input.deadlineDate ?? null,
    expectedDurationDays: input.expectedDurationDays ?? 90,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: input.completedAt ?? null,
    deletedAt: input.deletedAt ?? null,
    tasks: input.tasks ?? [],
  };
}

function taskRecord(input: Partial<ProjectTaskRecord>): ProjectTaskRecord {
  return {
    id: input.id ?? "task-1",
    userId,
    projectId: input.projectId ?? "project-1",
    projectTitle: input.projectTitle ?? "Find a job",
    milestoneId: input.milestoneId ?? null,
    milestoneTitle: input.milestoneTitle ?? "",
    title: input.title ?? "Prepare resume",
    description: input.description ?? null,
    status: input.status ?? "todo",
    startDate: input.startDate ?? null,
    deadlineDate: input.deadlineDate ?? null,
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: input.completedAt ?? null,
    deletedAt: input.deletedAt ?? null,
  };
}

function projectView(input: Partial<ProjectView>): ProjectView {
  return {
    id: input.id ?? "project-1",
    title: input.title ?? "Find a job",
    description: input.description ?? "Land a backend role.",
    startDate: input.startDate ?? "2026-07-29",
    deadlineDate: input.deadlineDate ?? "",
    expectedDurationDays: input.expectedDurationDays ?? "180",
    durationRange: input.durationRange ?? "3_6_months",
    sidebarPinOrder: input.sidebarPinOrder ?? null,
    timelineText: input.timelineText ?? "Expected duration 3-6 months",
    currentMilestone: input.currentMilestone ?? "Applications",
    progressText: input.progressText ?? "No tasks yet",
    tasks: input.tasks ?? [],
    milestones: input.milestones ?? [],
  };
}

function applyCommand(
  input: Partial<Omit<ApplyProjectTreeTemplateInput, "userId" | "occurredAt">>,
): Omit<ApplyProjectTreeTemplateInput, "userId" | "occurredAt"> {
  return {
    project: input.project ?? {
      projectId: "project-1",
      title: "Find a job updated",
      objective: "Land a backend role.",
      startDate: "2026-07-29",
      deadlineDate: null,
      expectedDurationDays: 180,
    },
    milestones: input.milestones ?? [],
    tasks: input.tasks ?? [],
  };
}
