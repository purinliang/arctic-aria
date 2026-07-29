import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEventTemplateDocument } from "../event-template-normalizer.ts";
import type { EventRecord } from "../server/event-repository.ts";

const now = new Date("2026-07-29T00:00:00.000Z");

test("normalizes event create templates and counts ignored fields", () => {
  const result = normalizeEventTemplateDocument({
    source: `# Event Template

## Event
id:
op: create
title: Dentist appointment
description: Bring insurance card.
date: 2026-07-29
time: 09:30
estimated_duration_hours: 1.5
location: City Dental
unsupported: ignored
`,
    currentEvents: [],
    targetEventId: null,
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
    eventId: null,
    title: "Dentist appointment",
    description: "Bring insurance card.",
    eventDate: "2026-07-29",
    eventTime: "09:30",
    estimatedDurationHours: 1.5,
    location: "City Dental",
  });
});

test("event create mode rejects update rows", () => {
  const result = normalizeEventTemplateDocument({
    source: `## Event
id: event-1
op: update
title: Existing event
date: 2026-07-29
time: 09:30
`,
    currentEvents: [eventRecord({ id: "event-1" })],
    targetEventId: null,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "event_template_invalid");
});

test("event update preview preserves unchanged target", () => {
  const currentEvent = eventRecord({ id: "event-1" });
  const result = normalizeEventTemplateDocument({
    source: `## Event
id: event-1
op: update
title: Existing event
description: Keep this.
date: 2026-07-29
time: 09:30
estimated_duration_hours: 1.25
location: Library
`,
    currentEvents: [currentEvent],
    targetEventId: "event-1",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.data.preview.counts.preserve, 1);
  assert.equal(result.data.commands[0]?.previewOperation, "preserve");
});

test("event update mode requires the current target id", () => {
  const result = normalizeEventTemplateDocument({
    source: `## Event
id: event-2
op: update
title: Other event
date: 2026-07-29
time: 10:00
`,
    currentEvents: [eventRecord({ id: "event-2", title: "Other event" })],
    targetEventId: "event-1",
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "event_template_target_mismatch");
});

test("event templates reuse event input validation", () => {
  const result = normalizeEventTemplateDocument({
    source: `## Event
id:
op: create
title: Bad event
date: 2026-07-29
time: 25:00
`,
    currentEvents: [],
    targetEventId: null,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.code, "event_time_invalid");
});

function eventRecord(input: Partial<EventRecord> = {}): EventRecord {
  return {
    id: input.id ?? "event-1",
    userId: input.userId ?? "user-1",
    title: input.title ?? "Existing event",
    description: input.description ?? "Keep this.",
    eventDate: input.eventDate ?? "2026-07-29",
    eventTime: input.eventTime ?? "09:30",
    estimatedDurationHours: input.estimatedDurationHours ?? 1.25,
    location: input.location ?? "Library",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    deletedAt: input.deletedAt ?? null,
  };
}
