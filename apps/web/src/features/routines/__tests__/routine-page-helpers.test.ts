import assert from "node:assert/strict";
import test from "node:test";
import { emptyDraft } from "../components/routine-page-helpers.ts";

test("routine empty draft uses the selected timezone local date", () => {
  const draft = emptyDraft(
    "Australia/Sydney",
    new Date("2026-07-21T23:30:00.000Z"),
  );

  assert.equal(draft.startDate, "2026-07-22");
  assert.equal(draft.ruleType, "once");
  assert.equal(draft.recurrenceOption, "once");
  assert.equal(draft.weekdays, null);
  assert.equal(draft.dayOfMonth, null);
});
