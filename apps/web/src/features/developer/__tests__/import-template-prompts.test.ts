import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  detectDeveloperImportTarget,
  developerImportMarkdownTemplates,
  developerImportPromptFor,
} from "../import-template-prompts.ts";

test("developer import web templates match cli markdown templates", () => {
  assert.equal(
    developerImportMarkdownTemplates.projects,
    readTemplate("project-import.md"),
  );
  assert.equal(
    developerImportMarkdownTemplates.routines,
    readTemplate("routine-import.md"),
  );
});

test("developer import prompts wrap templates with llm instructions", () => {
  const prompt = developerImportPromptFor("projects");

  assert.match(prompt, /According to the following template/);
  assert.match(prompt, /Supported duration values/);
  assert.match(prompt, /# Project: Find a job/);
  assert.match(prompt, /My requirement is:\n$/);

  const routinePrompt = developerImportPromptFor("routines");

  assert.match(routinePrompt, /Fixed interval days/);
  assert.match(routinePrompt, /2 means every 2 days/);
  assert.match(routinePrompt, /1 = daily, 2 = every 2 days, 7 = weekly/);
});

test("developer import target detection reads markdown and json", () => {
  assert.equal(
    detectDeveloperImportTarget("# Project: Find a job"),
    "projects",
  );
  assert.equal(
    detectDeveloperImportTarget("Routine: Morning walk"),
    "routines",
  );
  assert.equal(
    detectDeveloperImportTarget('{"projects":[{"project":{"title":"A"}}]}'),
    "projects",
  );
  assert.equal(
    detectDeveloperImportTarget('{"routine":{"title":"A"}}'),
    "routines",
  );
  assert.equal(
    detectDeveloperImportTarget(
      '{"format":"markdown","source":"Routine: Morning walk"}',
    ),
    "routines",
  );
  assert.equal(
    detectDeveloperImportTarget("# Project: A\n\nRoutine: B"),
    "ambiguous",
  );
  assert.equal(detectDeveloperImportTarget("Title: A"), null);
});

function readTemplate(fileName: string) {
  return readFileSync(
    new URL(`../../../../../cli/templates/${fileName}`, import.meta.url),
    "utf8",
  ).trimEnd();
}
