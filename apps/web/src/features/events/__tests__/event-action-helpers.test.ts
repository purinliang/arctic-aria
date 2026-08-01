import assert from "node:assert/strict";
import test from "node:test";
import {
  validateEventInput,
  validateEventInstanceCancelInput,
  validateEventInstanceInput,
} from "../event-action-helpers.ts";

test("event validation accepts complete input", () => {
  const result = validateEventInput({
    title: "Visa appointment",
    description: "Bring documents.",
    eventDate: "2026-07-22",
    eventTime: "09:30",
    estimatedDurationHours: "1.255",
    location: "Office",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.title, "Visa appointment");
    assert.equal(result.description, "Bring documents.");
    assert.equal(result.eventDate, "2026-07-22");
    assert.equal(result.eventTime, "09:30");
    assert.equal(result.estimatedDurationHours, 1.26);
    assert.equal(result.location, "Office");
  }
});

test("event validation rejects missing title, date, and time", () => {
  assert.deepEqual(
    validateEventInput({
      title: " ",
      description: "",
      eventDate: "2026-07-22",
      eventTime: "09:30",
      location: "",
    }),
    {
      ok: false,
      message: "Event title is required.",
      code: "event_title_invalid",
      category: "missing_parameter",
      subject: "event",
      field: "title",
      reason: "required",
    },
  );
  assert.deepEqual(
    validateEventInput({
      title: "Visa appointment",
      description: "",
      eventDate: " ",
      eventTime: "09:30",
      location: "",
    }),
    {
      ok: false,
      message: "Choose an event date.",
      code: "event_date_missing",
      category: "missing_parameter",
      subject: "event",
      field: "date",
      reason: "required",
    },
  );
  assert.deepEqual(
    validateEventInput({
      title: "Visa appointment",
      description: "",
      eventDate: "2026-07-22",
      eventTime: " ",
      location: "",
    }),
    {
      ok: false,
      message: "Choose an event time.",
      code: "event_time_missing",
      category: "missing_parameter",
      subject: "event",
      field: "time",
      reason: "required",
    },
  );
});

test("event validation rejects invalid date and clock time", () => {
  assert.deepEqual(
    validateEventInput({
      title: "Visa appointment",
      description: "",
      eventDate: "2026-02-31",
      eventTime: "09:30",
      location: "",
    }),
    {
      ok: false,
      message: "Event date must be a real date in YYYY-MM-DD format.",
      code: "event_date_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "date",
      reason: "invalid_format",
    },
  );
  assert.deepEqual(
    validateEventInput({
      title: "Visa appointment",
      description: "",
      eventDate: "2026-07-22",
      eventTime: "24:00",
      location: "",
    }),
    {
      ok: false,
      message: "Event time must use HH:MM.",
      code: "event_time_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "time",
      reason: "invalid_format",
    },
  );
});

test("event validation rejects invalid duration and long location", () => {
  assert.deepEqual(
    validateEventInput({
      title: "Visa appointment",
      description: "",
      eventDate: "2026-07-22",
      eventTime: "09:30",
      estimatedDurationHours: "24.01",
      location: "",
    }),
    {
      ok: false,
      message:
        "Event estimated duration must be a positive number up to 24 hours.",
      code: "event_estimated_duration_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "estimated_duration_hours",
      reason: "invalid_value",
      limit: 24,
    },
  );
  assert.deepEqual(
    validateEventInput({
      title: "Visa appointment",
      description: "",
      eventDate: "2026-07-22",
      eventTime: "09:30",
      location: "x".repeat(501),
    }),
    {
      ok: false,
      message: "Event location must be 500 characters or fewer.",
      code: "event_location_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "location",
      reason: "too_long",
      limit: 500,
    },
  );
});

test("event instance validation accepts reschedule and location override input", () => {
  const result = validateEventInstanceInput({
    id: "instance-1",
    eventDate: "2026-07-23",
    eventTime: "10:30",
    locationOverride: "Room 2",
    reason: "Teacher request",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.instanceId, "instance-1");
    assert.equal(result.eventDate, "2026-07-23");
    assert.equal(result.eventTime, "10:30");
    assert.equal(result.locationOverride, "Room 2");
    assert.equal(result.reason, "Teacher request");
  }
});

test("event instance validation rejects invalid date, time, and long reason", () => {
  assert.deepEqual(
    validateEventInstanceInput({
      id: "instance-1",
      eventDate: "2026-02-31",
      eventTime: "10:30",
      locationOverride: "",
      reason: "",
    }),
    {
      ok: false,
      message:
        "Event instance date must be a real date in YYYY-MM-DD format.",
      code: "event_instance_date_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "date",
      reason: "invalid_format",
    },
  );
  assert.deepEqual(
    validateEventInstanceInput({
      id: "instance-1",
      eventDate: "2026-07-23",
      eventTime: "24:00",
      locationOverride: "",
      reason: "",
    }),
    {
      ok: false,
      message: "Event instance time must use HH:MM.",
      code: "event_instance_time_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "time",
      reason: "invalid_format",
    },
  );
  assert.deepEqual(
    validateEventInstanceCancelInput({
      id: "instance-1",
      reason: "x".repeat(501),
    }),
    {
      ok: false,
      message: "Event instance reason must be 500 characters or fewer.",
      code: "event_instance_reason_invalid",
      category: "invalid_parameter",
      subject: "event",
      field: "reason",
      reason: "too_long",
      limit: 500,
    },
  );
});
