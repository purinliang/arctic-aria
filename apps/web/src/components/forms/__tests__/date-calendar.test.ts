import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarMonthDays,
  shiftCalendarMonth,
} from "../date-calendar.ts";

test("calendar month grid always reserves six weeks", () => {
  assert.equal(
    buildCalendarMonthDays({ year: 2026, monthIndex: 1 }).length,
    42,
  );
  assert.equal(
    buildCalendarMonthDays({ year: 2026, monthIndex: 7 }).length,
    42,
  );
});

test("calendar month grid pads trailing blanks for short months", () => {
  const days = buildCalendarMonthDays({ year: 2026, monthIndex: 1 });

  assert.equal(days[0]?.value, "2026-02-01");
  assert.equal(days[27]?.value, "2026-02-28");
  assert.equal(days[28], null);
  assert.equal(days.at(-1), null);
});

test("calendar month shifting supports year jumps", () => {
  assert.deepEqual(shiftCalendarMonth({ year: 2026, monthIndex: 6 }, -12), {
    year: 2025,
    monthIndex: 6,
  });
  assert.deepEqual(shiftCalendarMonth({ year: 2026, monthIndex: 6 }, 12), {
    year: 2027,
    monthIndex: 6,
  });
});
