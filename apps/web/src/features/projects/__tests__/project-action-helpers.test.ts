import assert from "node:assert/strict";
import test from "node:test";
import { projectDatabaseErrorMessage } from "../project-database-errors.ts";
import { isValidProjectDate } from "../project-date-validation.ts";

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
