import assert from "node:assert/strict";
import test from "node:test";
import { emptyEventDraft } from "../components/event-page-helpers.ts";

test("new event draft defaults to the local scheduled board date", () => {
  assert.equal(
    emptyEventDraft(
      "Australia/Sydney",
      new Date("2026-07-21T17:30:00.000Z"),
    ).eventDate,
    "2026-07-21",
  );
});
