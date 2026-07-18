import assert from "node:assert/strict";
import test from "node:test";
import { englishFormMessages } from "../../../messages/form-messages.ts";
import { formatTimeDisplay } from "../time-display.ts";

test("time display omits generic day periods in 12-hour preference", () => {
  assert.equal(
    formatTimeDisplay("20:30", englishFormMessages.timePicker, "12h"),
    "8:30 PM",
  );
});

test("time display keeps noon and midnight hints in 12-hour preference", () => {
  assert.equal(
    formatTimeDisplay("00:30", englishFormMessages.timePicker, "12h"),
    "12:30 AM Midnight",
  );
  assert.equal(
    formatTimeDisplay("12:30", englishFormMessages.timePicker, "12h"),
    "12:30 PM Noon",
  );
});

test("time display uses 24-hour preference with capitalized day period", () => {
  assert.equal(
    formatTimeDisplay("20:30", englishFormMessages.timePicker, "24h"),
    "20:30 Evening",
  );
});
