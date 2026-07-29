import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRoutineTemplateDocument } from "../routine-template-normalizer.ts";
import type {
  RoutineDefinition,
  RoutineGroupOption,
} from "../../dashboard/types.ts";

const groups: RoutineGroupOption[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Health",
    description: null,
  },
];

test("normalizes routine create templates and counts ignored fields", () => {
  const result = normalizeRoutineTemplateDocument({
    source: `# Routine Template

## Routine
id:
op: create
title: Evening review
description: Check tomorrow's plan.
group_id: 11111111-1111-4111-8111-111111111111
start_date: 2026-07-29
end_date:
preferred_time: 21:30
estimated_duration_minutes: 15
recurrence: daily
fixed_interval_days:
timezone: UTC
unsupported: ignored
`,
    currentRoutines: [],
    routineGroups: groups,
    targetRoutineId: null,
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.data.preview.counts.create, 1);
  assert.equal(result.data.preview.ignoredFieldCount, 1);
  assert.deepEqual(result.data.commands[0], {
    operation: "create",
    previewOperation: "create",
    routineId: null,
    groupId: "11111111-1111-4111-8111-111111111111",
    title: "Evening review",
    description: "Check tomorrow's plan.",
    startDate: "2026-07-29",
    endDate: null,
    estimatedDurationMinutes: 15,
    rule: {
      ruleType: "daily",
      intervalValue: null,
      weekdays: null,
      dayOfMonth: null,
      preferredTime: "21:30",
      timezone: "UTC",
    },
  });
});

test("routine create mode rejects update rows", () => {
  const result = normalizeRoutineTemplateDocument({
    source: `## Routine
id: routine-1
op: update
title: Existing routine
start_date: 2026-07-29
recurrence: daily
timezone: UTC
`,
    currentRoutines: [routineDefinition({ id: "routine-1" })],
    routineGroups: groups,
    targetRoutineId: null,
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "routine_template_invalid");
});

test("routine update preview preserves unchanged target", () => {
  const currentRoutine = routineDefinition({ id: "routine-1" });
  const result = normalizeRoutineTemplateDocument({
    source: `## Routine
id: routine-1
op: update
title: Existing routine
description: Keep this.
group_id: 11111111-1111-4111-8111-111111111111
start_date: 2026-07-29
end_date:
preferred_time: 21:30
estimated_duration_minutes: 15
recurrence: daily
fixed_interval_days:
timezone: UTC
`,
    currentRoutines: [currentRoutine],
    routineGroups: groups,
    targetRoutineId: "routine-1",
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.data.preview.counts.preserve, 1);
  assert.equal(result.data.commands[0]?.previewOperation, "preserve");
});

test("routine update mode requires the current target id", () => {
  const result = normalizeRoutineTemplateDocument({
    source: `## Routine
id: routine-2
op: update
title: Other routine
start_date: 2026-07-29
recurrence: daily
timezone: UTC
`,
    currentRoutines: [
      routineDefinition({ id: "routine-2", title: "Other routine" }),
    ],
    routineGroups: groups,
    targetRoutineId: "routine-1",
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "routine_template_target_mismatch");
});

test("routine templates reuse routine input validation", () => {
  const result = normalizeRoutineTemplateDocument({
    source: `## Routine
id:
op: create
title: Bad routine
start_date: 2026-07-29
estimated_duration_minutes: 2000
recurrence: daily
timezone: UTC
`,
    currentRoutines: [],
    routineGroups: groups,
    targetRoutineId: null,
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "routine_estimated_duration_invalid");
});

test("routine templates reject unknown group ids", () => {
  const result = normalizeRoutineTemplateDocument({
    source: `## Routine
id:
op: create
title: Bad group
group_id: 22222222-2222-4222-8222-222222222222
start_date: 2026-07-29
recurrence: daily
timezone: UTC
`,
    currentRoutines: [],
    routineGroups: groups,
    targetRoutineId: null,
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "routine_group_not_found");
});

test("routine fixed interval templates normalize the interval rule", () => {
  const result = normalizeRoutineTemplateDocument({
    source: `## Routine
id:
op: create
title: Clean filter
start_date: 2026-07-29
recurrence: fixed_days
fixed_interval_days: 45
timezone: UTC
`,
    currentRoutines: [],
    routineGroups: groups,
    targetRoutineId: null,
    defaultTimeZone: "UTC",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  const command = result.data.commands[0];

  assert.equal(command?.operation, "create");

  if (!command || command.operation === "delete") {
    return;
  }

  assert.equal(command.rule.ruleType, "day_interval");
  assert.equal(command.rule.intervalValue, 45);
});

function routineDefinition(
  input: Partial<RoutineDefinition> = {},
): RoutineDefinition {
  return {
    id: input.id ?? "routine-1",
    groupId: input.groupId ?? "11111111-1111-4111-8111-111111111111",
    groupName: input.groupName ?? "Health",
    title: input.title ?? "Existing routine",
    description: input.description ?? "Keep this.",
    startDate: input.startDate ?? "2026-07-29",
    endDate: input.endDate ?? null,
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? 15,
    ruleType: input.ruleType ?? "daily",
    intervalValue: input.intervalValue ?? null,
    weekdays: input.weekdays ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    preferredTime: input.preferredTime ?? "21:30",
    timezone: input.timezone ?? "UTC",
  };
}
