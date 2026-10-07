import assert from "node:assert/strict";
import test from "node:test";
import { pageHelpKeyForView } from "../page-help.ts";
import {
  englishPageHelpMessages,
  simplifiedChinesePageHelpMessages,
} from "../../messages/page-help-messages.ts";

test("project and milestone views select their own page help", () => {
  assert.equal(pageHelpKeyForView({ view: "projects", projectSelected: false, milestoneSelected: false }), "projects");
  assert.equal(pageHelpKeyForView({ view: "projects", projectSelected: true, milestoneSelected: false }), "project");
  assert.equal(pageHelpKeyForView({ view: "projects", projectSelected: true, milestoneSelected: true }), "milestone");
  assert.equal(pageHelpKeyForView({ view: "events", projectSelected: true, milestoneSelected: true }), "events");
});

test("every auth and workspace page has localized summaries and detailed sections", () => {
  const keys = ["login", "register", "dashboard", "daily", "money", "projects", "project", "milestone", "routines", "events", "memories", "ideas", "settings", "design"] as const;
  assert.deepEqual(Object.keys(englishPageHelpMessages.pages).sort(), [...keys].sort());
  assert.deepEqual(Object.keys(simplifiedChinesePageHelpMessages.pages).sort(), [...keys].sort());
  for (const key of keys) {
    for (const messages of [englishPageHelpMessages, simplifiedChinesePageHelpMessages]) {
      const content = messages.pages[key];
      assert.ok(content.title.trim());
      assert.ok(content.summary.trim());
      assert.ok(content.sections.length >= 2);
      assert.ok(content.sections.every((section) => section.title.trim() && section.body.trim()));
    }
  }
});
