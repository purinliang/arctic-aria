import assert from "node:assert/strict";
import test from "node:test";
import { englishFormMessages } from "../../../messages/form-messages.ts";
import { formatTimeDisplay } from "../time-display.ts";

test("time display uses 12-hour preference with capitalized day period", () => {
  assert.equal(
    formatTimeDisplay("20:30", englishFormMessages.timePicker, "12h"),
    "8:30 PM Evening",
  );
});

test("time display uses 24-hour preference with capitalized day period", () => {
  assert.equal(
    formatTimeDisplay("20:30", englishFormMessages.timePicker, "24h"),
    "20:30 Evening",
  );
});
