import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProjectImportDocument } from "../project-import-normalizer.ts";
import {
  parseProjectJsonToDocument,
  parseProjectMarkdownToJson,
} from "../project-import-parser.ts";

const today = "2026-07-22";

test("project import parses markdown into canonical JSON", () => {
  const parsed = parseProjectMarkdownToJson(`# Project: Find a job
Objective: Land a backend role.
Start date: 2026-07-22
Timeline: duration
Duration: 3_6_months

## Milestone: Applications
Objective: Submit strong applications.
Start date: 2026-07-22
Timeline: duration
Duration: 1_3_months

### Tasks
- Title: Prepare resume
  Description: Rewrite backend experience bullets.
  Start date: 2026-07-22
  Deadline: 2026-07-30
`);

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.deepEqual(parsed.data, {
      project: {
        title: "Find a job",
        objective: "Land a backend role.",
        startDate: "2026-07-22",
        timeline: {
          type: "duration",
          durationRange: "3_6_months",
        },
      },
      milestones: [
        {
          title: "Applications",
          objective: "Submit strong applications.",
          startDate: "2026-07-22",
          timeline: {
            type: "duration",
            durationRange: "1_3_months",
          },
          tasks: [
            {
              title: "Prepare resume",
              description: "Rewrite backend experience bullets.",
              startDate: "2026-07-22",
              deadlineDate: "2026-07-30",
            },
          ],
        },
      ],
    });
  }
});

test("project import rejects top-level tasks without milestones", () => {
  const parsed = parseProjectMarkdownToJson(`# Project: Find a job
## Tasks
- Title: Prepare resume
`);

  assert.equal(parsed.ok, false);

  if (!parsed.ok) {
    assert.equal(parsed.code, "project_import_invalid");
    assert.match(parsed.message, /must be inside a milestone Tasks section/);
  }
});

test("project import validates json shape before normalization", () => {
  assert.deepEqual(parseProjectJsonToDocument({ wrong: true }), {
    ok: false,
    code: "project_import_invalid",
    message: 'Unknown root field "wrong".',
    category: "invalid_parameter",
    subject: "project",
    field: "structure",
    reason: "invalid_value",
  });

  assert.deepEqual(
    parseProjectJsonToDocument({
      project: {
        title: "Find a job",
      },
      tasks: [
        {
          title: "Prepare resume",
        },
      ],
    }),
    {
      ok: false,
      code: "project_import_invalid",
      message: 'Unknown root field "tasks".',
      category: "invalid_parameter",
      subject: "project",
      field: "structure",
      reason: "invalid_value",
    },
  );

  assert.deepEqual(
    parseProjectJsonToDocument({
      project: {
        title: "Find a job",
        startDate: 42,
      },
    }),
    {
      ok: false,
      code: "project_import_invalid",
      message: "project.startDate must be text.",
      category: "invalid_parameter",
      subject: "project",
      field: "project.startDate",
      reason: "invalid_value",
    },
  );
});

test("project import fills defaults and validates the typed object", () => {
  const parsed = parseProjectJsonToDocument({
    project: {
      title: "Find a job",
    },
    milestones: [
      {
        title: "Applications",
        tasks: [
          {
            title: "Prepare resume",
          },
        ],
      },
    ],
  });

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  assert.deepEqual(normalizeProjectImportDocument(parsed.data, today), {
    ok: true,
    data: {
      project: {
        title: "Find a job",
        objective: null,
        startDate: "2026-07-22",
        deadlineDate: null,
        expectedDurationDays: 180,
      },
      milestones: [
        {
          title: "Applications",
          objective: null,
          startDate: "2026-07-22",
          deadlineDate: null,
          expectedDurationDays: 180,
          tasks: [
            {
              title: "Prepare resume",
              description: null,
              startDate: "2026-07-22",
              deadlineDate: null,
            },
          ],
        },
      ],
    },
  });
});

test("project import maps plain language durations to supported ranges", () => {
  const markdown = parseProjectMarkdownToJson(`# Project: Find a job
Timeline: duration
Duration: 4 months

## Milestone: Applications
Timeline: duration
Duration: 2 years

### Tasks
- Title: Prepare resume
`);

  assert.equal(markdown.ok, true);

  if (markdown.ok) {
    assert.deepEqual(markdown.data, {
      project: {
        title: "Find a job",
        timeline: {
          type: "duration",
          durationRange: "3_6_months",
        },
      },
      milestones: [
        {
          title: "Applications",
          timeline: {
            type: "duration",
            durationRange: "1_3_years",
          },
          tasks: [
            {
              title: "Prepare resume",
            },
          ],
        },
      ],
    });
  }

  const json = parseProjectJsonToDocument({
    project: {
      title: "Find a job",
      timeline: {
        type: "duration",
        durationRange: "4 months",
      },
    },
    milestones: [
      {
        title: "Applications",
        timeline: {
          type: "duration",
          durationRange: "2 years",
        },
        tasks: [
          {
            title: "Prepare resume",
          },
        ],
      },
    ],
  });

  assert.equal(json.ok, true);

  if (!json.ok) {
    return;
  }

  assert.deepEqual(json.data.project.timeline, {
    type: "duration",
    durationRange: "3_6_months",
  });
  assert.deepEqual(json.data.milestones[0].timeline, {
    type: "duration",
    durationRange: "1_3_years",
  });
});

test("project import rejects invalid task fields inside milestones", () => {
  const result = normalizeProjectImportDocument(
    {
      project: { title: "Find a job" },
      milestones: [
        {
          title: "Applications",
          tasks: [{ title: "   " }],
        },
      ],
    },
    today,
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.field, "title");
  }
});
