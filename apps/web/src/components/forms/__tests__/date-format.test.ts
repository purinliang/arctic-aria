import assert from "node:assert/strict";
import test from "node:test";
import { formatDateKey } from "../date-format.ts";
import {
  englishFormMessages,
  simplifiedChineseFormMessages,
} from "../../../messages/form-messages.ts";

test("date key formatting includes weekday", () => {
  assert.equal(
    formatDateKey("2026-07-16", englishFormMessages.datePicker),
    "Jul 16, 2026 Thu",
  );
});

test("date key formatting uses active date messages", () => {
  assert.equal(
    formatDateKey("2026-07-16", simplifiedChineseFormMessages.datePicker),
    "2026年7月16日 四",
  );
});

test("date key formatting returns fallback for invalid dates", () => {
  assert.equal(
    formatDateKey("2026-08-48", englishFormMessages.datePicker, "invalid"),
    "invalid",
  );
});
