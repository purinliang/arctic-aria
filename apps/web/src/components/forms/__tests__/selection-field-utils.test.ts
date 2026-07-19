import assert from "node:assert/strict";
import test from "node:test";
import { orderOptionsForSelectPopover } from "../selection-field-utils.ts";

const options = ["first", "second", "third"] as const;

test("select popover keeps normal option order when opened below", () => {
  assert.deepEqual(orderOptionsForSelectPopover(options, false), [
    "first",
    "second",
    "third",
  ]);
});

test("select popover reverses option order when opened above", () => {
  assert.deepEqual(orderOptionsForSelectPopover(options, true), [
    "third",
    "second",
    "first",
  ]);
});
