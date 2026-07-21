import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRoutineImportDocument } from "../routine-import-normalizer.ts";
import {
  parseRoutineJsonToDocument,
  parseRoutineMarkdownToJson,
} from "../routine-import-parser.ts";

const today = "2026-07-22";

test("routine import parses markdown into canonical JSON", () => {
  const parsed = parseRoutineMarkdownToJson(`# Routine: Morning walk
Description: A short walk to start the day.
First start date: 2026-07-22
Repeat: daily
Preferred time: 08:30
Timezone: Australia/Melbourne
`);

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.deepEqual(parsed.data, {
      routine: {
        title: "Morning walk",
        description: "A short walk to start the day.",
        firstStartDate: "2026-07-22",
        recurrence: "daily",
        preferredTime: "08:30",
        timezone: "Australia/Melbourne",
      },
    });
  }
});

test("routine import accepts bare Routine headings", () => {
  const parsed = parseRoutineMarkdownToJson(`Routine: Speaking practice
Description: Practise speaking drills.
First start date: 2026-07-22
End date: 2026-08-17
Repeat: daily
Fixed interval days:
Preferred time: 10:00
Timezone: Australia/Melbourne
`);

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.deepEqual(parsed.data, {
      routine: {
        title: "Speaking practice",
        description: "Practise speaking drills.",
        firstStartDate: "2026-07-22",
        endDate: "2026-08-17",
        recurrence: "daily",
        fixedIntervalDays: undefined,
        preferredTime: "10:00",
        timezone: "Australia/Melbourne",
      },
    });
  }
});

test("routine import parses multiple markdown routines", () => {
  const parsed = parseRoutineMarkdownToJson(`Routine: Morning walk
Description: Start with a short walk.
First start date: 2026-07-22
Repeat: daily
Preferred time: 08:30
Timezone: Australia/Melbourne

---

Routine: Evening reset
Description: Clear small loose ends.
First start date: 2026-07-22
Repeat: daily
Preferred time: 21:30
Timezone: Australia/Melbourne
`);

  assert.equal(parsed.ok, true);

  if (parsed.ok) {
    assert.deepEqual(parsed.data, {
      routines: [
        {
          title: "Morning walk",
          description: "Start with a short walk.",
          firstStartDate: "2026-07-22",
          recurrence: "daily",
          preferredTime: "08:30",
          timezone: "Australia/Melbourne",
        },
        {
          title: "Evening reset",
          description: "Clear small loose ends.",
          firstStartDate: "2026-07-22",
          recurrence: "daily",
          preferredTime: "21:30",
          timezone: "Australia/Melbourne",
        },
      ],
    });
  }
});

test("routine import validates json shape before normalization", () => {
  assert.deepEqual(parseRoutineJsonToDocument({ wrong: true }), {
    ok: false,
    code: "routine_import_invalid",
    message: 'Unknown root field "wrong".',
    category: "invalid_parameter",
    subject: "routine",
    field: "structure",
    reason: "invalid_value",
  });

  assert.deepEqual(
    parseRoutineJsonToDocument({
      routine: {
        title: "Morning walk",
        recurrence: "yearly",
      },
    }),
    {
      ok: false,
      code: "routine_import_invalid",
      message:
        "Routine recurrence must be daily, weekly, monthly, every_14_days, every_30_days, or fixed_days.",
      category: "invalid_parameter",
      subject: "routine",
      field: "routine.recurrence",
      reason: "invalid_value",
    },
  );
});

test("routine import validates batch json shape", () => {
  const parsed = parseRoutineJsonToDocument({
    routines: [
      {
        title: "Morning walk",
      },
      {
        title: "Evening reset",
      },
    ],
  });

  assert.deepEqual(parsed, {
    ok: false,
    code: "routine_import_invalid",
    message: "Routine import JSON must include exactly one routine.",
    category: "invalid_parameter",
    subject: "routine",
    field: "structure",
    reason: "invalid_value",
  });
});

test("routine import fills defaults and validates the typed object", () => {
  const parsed = parseRoutineJsonToDocument({
    routine: {
      title: "Morning walk",
    },
  });

  assert.equal(parsed.ok, true);

  if (!parsed.ok) {
    return;
  }

  assert.deepEqual(normalizeRoutineImportDocument(parsed.data, today), {
    ok: true,
    data: {
      title: "Morning walk",
      description: null,
      firstStartDate: "2026-07-22",
      endDate: null,
      rule: {
        ruleType: "daily",
        intervalValue: null,
        weekdays: null,
        dayOfMonth: null,
        preferredTime: null,
        timezone: "UTC",
      },
    },
  });
});

test("routine import rejects invalid fixed interval values", () => {
  const result = normalizeRoutineImportDocument(
    {
      routine: {
        title: "Quarterly check",
        firstStartDate: "2026-07-22",
        recurrence: "fixed_days",
        fixedIntervalDays: -2,
      },
    },
    today,
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.code, "routine_rule_invalid");
    assert.equal(result.field, "rule");
  }
});
