import assert from "node:assert/strict";
import test from "node:test";
import { projectTaskProgressText } from "../project-progress.ts";

test("project progress text uses a natural empty-task state", () => {
  assert.equal(projectTaskProgressText(0, 0), "No tasks yet");
});

test("project progress text keeps done count for existing tasks", () => {
  assert.equal(projectTaskProgressText(2, 5), "2 of 5 tasks done");
});
