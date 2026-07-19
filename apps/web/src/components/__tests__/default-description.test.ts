import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultDescriptionForTitle,
  displayDescription,
} from "../default-description.ts";

const defaults = [
  "First fallback.",
  "Second fallback.",
  "Third fallback.",
] as const;

test("display description keeps saved description text", () => {
  assert.equal(
    displayDescription(" Saved text. ", "Any title", defaults),
    "Saved text.",
  );
});

test("display description uses a stable title-based fallback for empty text", () => {
  assert.equal(
    displayDescription("", "Apply for a degree", defaults),
    defaultDescriptionForTitle("Apply for a degree", defaults),
  );
  assert.equal(
    displayDescription("   ", "Apply for a degree", defaults),
    defaultDescriptionForTitle("Apply for a degree", defaults),
  );
  assert.equal(
    displayDescription(null, "Apply for a degree", defaults),
    defaultDescriptionForTitle("Apply for a degree", defaults),
  );
});

test("default description returns an empty string when no defaults exist", () => {
  assert.equal(defaultDescriptionForTitle("Title", []), "");
});
