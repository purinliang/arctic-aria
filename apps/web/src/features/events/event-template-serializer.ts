import { encodeTemplateFieldValue } from "../template-parser.ts";
import type { ScheduledEvent } from "../dashboard/types.ts";
import type { EventInput } from "./actions.ts";

export function eventTemplateForNewEvent(draft: EventInput) {
  return [
    "# Event Template",
    "",
    "<!--",
    "Create one or more Arctic Aria events from the user's request.",
    "Return only the filled Markdown in this format.",
    "Use one ## Event section per event.",
    "Leave id empty for create rows and use op: create.",
    "Use single-line field values. Use \\n inside description for line breaks.",
    "Date must use YYYY-MM-DD. Time must use HH:MM in 24-hour time.",
    "estimated_duration_hours is optional and must be a positive number up to 24.",
    "",
    "Example:",
    "## Event",
    "id:",
    "op: create",
    "title: Dentist appointment",
    "description: Bring insurance card.",
    "date: 2026-07-29",
    "time: 09:30",
    "estimated_duration_hours: 1.5",
    "location: City Dental",
    "-->",
    "",
    ...eventTemplateItemLines({
      id: "",
      op: "create",
      title: draft.title,
      description: draft.description,
      eventDate: draft.eventDate,
      eventTime: draft.eventTime,
      estimatedDurationHours: draft.estimatedDurationHours ?? "",
      location: draft.location,
    }),
  ].join("\n");
}

export function eventTemplateForEvent(event: ScheduledEvent) {
  return [
    "# Event Template",
    "",
    "<!--",
    "Fill this Arctic Aria event template and return only the filled Markdown.",
    "Keep id unchanged for update/delete rows.",
    "Use op: update for edits, op: delete only when this event should be deleted.",
    "Use op: create with an empty id for additional new events.",
    "Use single-line field values. Use \\n inside description for line breaks.",
    "Date must use YYYY-MM-DD. Time must use HH:MM in 24-hour time.",
    "estimated_duration_hours is optional and must be a positive number up to 24.",
    "-->",
    "",
    ...eventTemplateItemLines({
      id: event.id,
      op: "update",
      title: event.title,
      description: event.description ?? "",
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      estimatedDurationHours: event.estimatedDurationHours?.toString() ?? "",
      location: event.location ?? "",
    }),
  ].join("\n");
}

function eventTemplateItemLines(input: {
  id: string;
  op: "create" | "update";
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  estimatedDurationHours: string;
  location: string;
}) {
  return [
    "## Event",
    `id: ${input.id}`,
    `op: ${input.op}`,
    `title: ${encodeTemplateFieldValue(input.title)}`,
    `description: ${encodeTemplateFieldValue(input.description)}`,
    `date: ${input.eventDate}`,
    `time: ${input.eventTime}`,
    `estimated_duration_hours: ${input.estimatedDurationHours}`,
    `location: ${encodeTemplateFieldValue(input.location)}`,
  ];
}
