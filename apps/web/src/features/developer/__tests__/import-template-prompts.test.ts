import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
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
});

function readTemplate(fileName: string) {
  return readFileSync(
    new URL(`../../../../../cli/templates/${fileName}`, import.meta.url),
    "utf8",
  ).trimEnd();
}
