import assert from "node:assert/strict";
import test from "node:test";
import { projectDatabaseErrorMessage } from "../project-database-errors.ts";
import {
  isValidProjectDate,
  validateRequiredProjectDate,
} from "../project-date-validation.ts";
import {
  validateMilestoneInput,
  validateProjectInput,
  validateProjectTaskInput,
} from "../project-action-helpers.ts";

test("project database errors explain missing project migrations", () => {
  const message = projectDatabaseErrorMessage({
    code: "42P01",
    message: 'relation "project_milestones" does not exist',
  });

  assert.equal(
    message,
    "Project database tables are missing. Run pnpm --dir apps/web db:migrate before using Projects.",
  );
});

test("project database errors fall back to a generic update failure", () => {
  assert.equal(
    projectDatabaseErrorMessage(new Error("connection interrupted")),
    "Project database update failed.",
  );
});

test("project date validation rejects impossible calendar dates", () => {
  assert.equal(isValidProjectDate("2026-08-48"), false);
  assert.equal(isValidProjectDate("2026-02-29"), false);
  assert.equal(isValidProjectDate("2028-02-29"), true);
  assert.equal(isValidProjectDate("2026-08-04"), true);
});

test("required project date validation asks the user to select empty dates", () => {
  assert.deepEqual(
    validateRequiredProjectDate({
      value: "",
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
    }),
    {
      ok: false,
      message: "Select a deadline date.",
      code: "project_deadline_missing",
    },
  );
});

test("required project date validation explains malformed dates", () => {
  assert.deepEqual(
    validateRequiredProjectDate({
      value: "2026-08-48",
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
    }),
    {
      ok: false,
      message: "Deadline date must be a real date in YYYY-MM-DD format.",
      code: "project_deadline_invalid",
    },
  );
});

test("required project date validation returns trimmed valid dates", () => {
  assert.deepEqual(
    validateRequiredProjectDate({
      value: " 2026-08-16 ",
      missingMessage: "Select a deadline date.",
      invalidMessage: "Deadline date must be a real date in YYYY-MM-DD format.",
      missingCode: "project_deadline_missing",
      invalidCode: "project_deadline_invalid",
    }),
    {
      ok: true,
      value: "2026-08-16",
    },
  );
});

test("project database date errors show a date-specific message", () => {
  const message = projectDatabaseErrorMessage({
    code: "22007",
    message: 'invalid input syntax for type date: "2026-08-48"',
  });

  assert.equal(
    message,
    "Dates must be real calendar dates in YYYY-MM-DD format.",
  );
});

test("project database pin conflicts show a retry message", () => {
  const message = projectDatabaseErrorMessage({
    code: "23505",
    constraint: "projects_sidebar_pin_order_unique",
    message: "duplicate key value violates unique constraint",
  });

  assert.equal(message, "Pinned projects changed. Refresh and try again.");
});

test("project validation accepts an empty optional description", () => {
  const validation = validateProjectInput({
    title: "Find a job",
    description: "   ",
    priority: "medium",
    startDate: "2026-07-19",
    timelineType: "duration",
    deadlineDate: "",
    durationRange: "3_6_months",
  });

  assert.equal(validation.ok, true);

  if (validation.ok) {
    assert.equal(validation.objective, null);
  }
});

test("project validation still rejects over-length descriptions", () => {
  const validation = validateProjectInput({
    title: "Find a job",
    description: "x".repeat(1001),
    priority: "medium",
    startDate: "2026-07-19",
    timelineType: "duration",
    deadlineDate: "",
    durationRange: "3_6_months",
  });

  assert.deepEqual(validation, {
    ok: false,
    message: "Project objective must be 1000 characters or fewer.",
    code: "project_description_invalid",
  });
});

test("milestone validation stores blank optional objectives as null", () => {
  const validation = validateMilestoneInput({
    projectId: "project-1",
    title: "Applications",
    objective: "   ",
    startDate: "2026-07-19",
    timelineType: "duration",
    deadlineDate: "",
    durationRange: "1_3_months",
  });

  assert.equal(validation.ok, true);

  if (validation.ok) {
    assert.equal(validation.objective, null);
  }
});

test("task validation stores blank optional descriptions as null", () => {
  const validation = validateProjectTaskInput({
    projectId: "project-1",
    milestoneId: "",
    title: "Prepare resume",
    description: "   ",
    priority: "medium",
    status: "todo",
    scheduledDate: "",
    startDate: "2026-07-19",
    deadlineDate: "",
  });

  assert.equal(validation.ok, true);

  if (validation.ok) {
    assert.equal(validation.description, null);
  }
});
