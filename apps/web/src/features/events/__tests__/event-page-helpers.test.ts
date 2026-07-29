import assert from "node:assert/strict";
import test from "node:test";
import type { ScheduledEvent } from "../../dashboard/types.ts";
import {
  emptyEventDraft,
  splitEventsByCurrentTime,
} from "../components/event-page-helpers.ts";

function event(
  input: Partial<ScheduledEvent> & Pick<ScheduledEvent, "id">,
): ScheduledEvent {
  return {
    id: input.id,
    title: input.title ?? input.id,
    description: input.description ?? null,
    eventDate: input.eventDate ?? "2026-07-22",
    eventTime: input.eventTime ?? "09:00",
    estimatedDurationHours: input.estimatedDurationHours ?? null,
    location: input.location ?? null,
    createdAt: input.createdAt ?? "2026-07-01T00:00:00.000Z",
    updatedAt: input.updatedAt ?? "2026-07-01T00:00:00.000Z",
  };
}

test("event page splits upcoming and past events by current local time", () => {
  const grouped = splitEventsByCurrentTime({
    events: [
      event({ id: "past", eventDate: "2026-07-22", eventTime: "08:59" }),
      event({ id: "upcoming", eventDate: "2026-07-22", eventTime: "09:00" }),
      event({ id: "future", eventDate: "2026-07-23", eventTime: "08:00" }),
    ],
    now: new Date("2026-07-21T23:00:00.000Z"),
    timeZone: "Australia/Sydney",
  });

  assert.deepEqual(grouped.upcoming.map((item) => item.id), [
    "upcoming",
    "future",
  ]);
  assert.deepEqual(grouped.past.map((item) => item.id), ["past"]);
});

test("new event draft defaults to the local scheduled board date", () => {
  assert.equal(
    emptyEventDraft(
      "Australia/Sydney",
      new Date("2026-07-21T17:30:00.000Z"),
    ).eventDate,
    "2026-07-21",
  );
});
