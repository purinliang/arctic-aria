import assert from "node:assert/strict";
import test from "node:test";
import { projectDatabaseErrorMessage } from "../project-database-errors.ts";

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
