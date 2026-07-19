import assert from "node:assert/strict";
import test from "node:test";
import {
  englishMemoryExperienceMessages,
  simplifiedChineseMemoryExperienceMessages,
} from "../../../messages/memory-experience-messages.ts";
import { memoryExperienceMetadataSegments } from "../components/memory-metadata.ts";

const formatDate = (_value: string, fallback: string) => fallback;

test("memory metadata omits duplicate count when never experienced", () => {
  assert.deepEqual(
    memoryExperienceMetadataSegments(
      {
        categoryBuiltInKey: null,
        doneCount: 0,
        lastDoneDate: "",
        lastDoneText: "",
      },
      englishMemoryExperienceMessages,
      formatDate,
    ),
    ["Never experienced"],
  );
});

test("memory metadata includes count after an experience", () => {
  assert.deepEqual(
    memoryExperienceMetadataSegments(
      {
        categoryBuiltInKey: null,
        doneCount: 2,
        lastDoneDate: "2026-07-19",
        lastDoneText: "Jul 19, 2026 Sun",
      },
      englishMemoryExperienceMessages,
      formatDate,
    ),
    ["Last experienced Jul 19, 2026 Sun", "Experienced 2 times"],
  );
});

test("memory metadata uses category-specific copy for built-in categories", () => {
  assert.deepEqual(
    memoryExperienceMetadataSegments(
      {
        categoryBuiltInKey: "cuisine",
        doneCount: 1,
        lastDoneDate: "2026-07-19",
        lastDoneText: "Jul 19, 2026 Sun",
      },
      englishMemoryExperienceMessages,
      formatDate,
    ),
    ["Last tasted Jul 19, 2026 Sun", "Tasted 1 time"],
  );
});

test("memory metadata uses natural Chinese music wording", () => {
  assert.deepEqual(
    memoryExperienceMetadataSegments(
      {
        categoryBuiltInKey: "music",
        doneCount: 3,
        lastDoneDate: "2026-07-19",
        lastDoneText: "2026年7月19日 星期日",
      },
      simplifiedChineseMemoryExperienceMessages,
      formatDate,
    ),
    ["上次听过 2026年7月19日 星期日", "听过 3 次"],
  );
});
