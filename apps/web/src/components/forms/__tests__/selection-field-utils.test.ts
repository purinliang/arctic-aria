import assert from "node:assert/strict";
import test from "node:test";
import {
  orderOptionsForSelectPopover,
  selectedOptionRenderIndexForSelectPopover,
} from "../selection-field-utils.ts";

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

test("selected option render index stays normal when opened below", () => {
  const namedOptions = [
    { value: "first" },
    { value: "second" },
    { value: "third" },
  ];

  assert.equal(
    selectedOptionRenderIndexForSelectPopover(namedOptions, "second", false),
    1,
  );
});

test("selected option render index reverses when opened above", () => {
  const namedOptions = [
    { value: "first" },
    { value: "second" },
    { value: "third" },
  ];

  assert.equal(
    selectedOptionRenderIndexForSelectPopover(namedOptions, "first", true),
    2,
  );

  assert.equal(
    selectedOptionRenderIndexForSelectPopover(namedOptions, "third", true),
    0,
  );
});

test("selected option render index returns -1 when the selected value is missing", () => {
  const namedOptions = [
    { value: "first" },
    { value: "second" },
    { value: "third" },
  ];

  assert.equal(
    selectedOptionRenderIndexForSelectPopover(namedOptions, "absent", false),
    -1,
  );
});
