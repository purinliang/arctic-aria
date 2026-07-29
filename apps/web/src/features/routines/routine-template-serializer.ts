import { encodeTemplateFieldValue } from "../template-parser.ts";
import type {
  RoutineDefinition,
  RoutineGroupOption,
} from "../dashboard/types.ts";
import type { RoutineInput } from "./actions.ts";
import { recurrenceOptionFromRule } from "./routine-recurrence.ts";

export function routineTemplateForNewRoutine({
  draft,
  groups,
}: {
  draft: RoutineInput;
  groups: RoutineGroupOption[];
}) {
  return [
    "# Routine Template",
    "",
    "<!--",
    "Create one or more Arctic Aria routines from the user's request.",
    "Return only the filled Markdown in this format.",
    "Use one ## Routine section per routine.",
    "Leave id empty for create rows and use op: create.",
    "Use single-line field values. Use \\n inside description for line breaks.",
    "Date fields must use YYYY-MM-DD. preferred_time is optional HH:MM.",
    "estimated_duration_minutes is optional and must be 1-1440 when present.",
    "Legal recurrence values: once, daily, weekly, monthly, yearly, every_14_days, every_30_days, fixed_days.",
    "Use fixed_interval_days only when recurrence is fixed_days.",
    ...routineGroupPromptLines(groups),
    "",
    "Example:",
    "## Routine",
    "id:",
    "op: create",
    "title: Evening review",
    "description: Check tomorrow's plan.",
    "group_id:",
    "start_date: 2026-07-29",
    "end_date:",
    "preferred_time: 21:30",
    "estimated_duration_minutes: 15",
    "recurrence: daily",
    "fixed_interval_days:",
    "timezone:",
    "-->",
    "",
    ...routineTemplateItemLines({
      id: "",
      op: "create",
      title: draft.title,
      description: draft.description,
      groupId: draft.groupId ?? "",
      startDate: draft.startDate,
      endDate: draft.endDate ?? "",
      preferredTime: draft.preferredTime ?? "",
      estimatedDurationMinutes: draft.estimatedDurationMinutes ?? "",
      recurrence: recurrenceOptionFromRule(draft),
      fixedIntervalDays:
        recurrenceOptionFromRule(draft) === "fixed_days"
          ? draft.intervalValue?.toString() ?? ""
          : "",
      timezone: draft.timezone ?? "",
    }),
  ].join("\n");
}

export function routineTemplateForRoutine({
  routine,
  groups,
}: {
  routine: RoutineDefinition;
  groups: RoutineGroupOption[];
}) {
  const recurrence = recurrenceOptionFromRule(routine);

  return [
    "# Routine Template",
    "",
    "<!--",
    "Fill this Arctic Aria routine template and return only the filled Markdown.",
    "Keep id unchanged for update/delete rows.",
    "Use op: update for edits, op: delete only when this routine should be deleted.",
    "Use op: create with an empty id for additional new routines.",
    "Use single-line field values. Use \\n inside description for line breaks.",
    "Date fields must use YYYY-MM-DD. preferred_time is optional HH:MM.",
    "estimated_duration_minutes is optional and must be 1-1440 when present.",
    "Legal recurrence values: once, daily, weekly, monthly, yearly, every_14_days, every_30_days, fixed_days.",
    "Use fixed_interval_days only when recurrence is fixed_days.",
    ...routineGroupPromptLines(groups),
    "-->",
    "",
    ...routineTemplateItemLines({
      id: routine.id,
      op: "update",
      title: routine.title,
      description: routine.description ?? "",
      groupId: routine.groupId ?? "",
      startDate: routine.startDate,
      endDate: routine.endDate ?? "",
      preferredTime: routine.preferredTime ?? "",
      estimatedDurationMinutes:
        routine.estimatedDurationMinutes?.toString() ?? "",
      recurrence,
      fixedIntervalDays:
        recurrence === "fixed_days"
          ? routine.intervalValue?.toString() ?? ""
          : "",
      timezone: routine.timezone,
    }),
  ].join("\n");
}

function routineTemplateItemLines(input: {
  id: string;
  op: "create" | "update";
  title: string;
  description: string;
  groupId: string;
  startDate: string;
  endDate: string;
  preferredTime: string;
  estimatedDurationMinutes: string;
  recurrence: string;
  fixedIntervalDays: string;
  timezone: string;
}) {
  return [
    "## Routine",
    `id: ${input.id}`,
    `op: ${input.op}`,
    `title: ${encodeTemplateFieldValue(input.title)}`,
    `description: ${encodeTemplateFieldValue(input.description)}`,
    `group_id: ${input.groupId}`,
    `start_date: ${input.startDate}`,
    `end_date: ${input.endDate}`,
    `preferred_time: ${input.preferredTime}`,
    `estimated_duration_minutes: ${input.estimatedDurationMinutes}`,
    `recurrence: ${input.recurrence}`,
    `fixed_interval_days: ${input.fixedIntervalDays}`,
    `timezone: ${input.timezone}`,
  ];
}

function routineGroupPromptLines(groups: RoutineGroupOption[]) {
  if (groups.length === 0) {
    return [
      "No routine groups exist. Leave group_id empty.",
      "Do not create groups in this template.",
    ];
  }

  return [
    "Use one of these group_id values or leave group_id empty:",
    ...groups.map((group) => `- ${group.id}: ${group.name}`),
    "Do not invent group_id values and do not create groups in this template.",
  ];
}
