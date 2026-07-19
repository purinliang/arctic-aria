import assert from "node:assert/strict";
import test from "node:test";
import { memoryDoneMetadataSegments } from "../components/memory-metadata.ts";

const messages = {
  doneTimes: (count: number) => `Experienced ${count} times`,
  lastDone: (date: string) => `Last experienced ${date}`,
  neverDone: "Never experienced",
};

const formatDate = (_value: string, fallback: string) => fallback;

test("memory metadata omits duplicate count when never experienced", () => {
  assert.deepEqual(
    memoryDoneMetadataSegments(
      {
        doneCount: 0,
        lastDoneDate: "",
        lastDoneText: "",
      },
      messages,
      formatDate,
    ),
    ["Never experienced"],
  );
});

test("memory metadata includes count after an experience", () => {
  assert.deepEqual(
    memoryDoneMetadataSegments(
      {
        doneCount: 2,
        lastDoneDate: "2026-07-19",
        lastDoneText: "Jul 19, 2026 Sun",
      },
      messages,
      formatDate,
    ),
    ["Last experienced Jul 19, 2026 Sun", "Experienced 2 times"],
  );
});
