import {
  routineRecurrenceOptions,
  type RoutineRecurrenceOption,
} from "./routine-recurrence.ts";
import type {
  RoutineImportBatchDocument,
  RoutineImportDocument,
  RoutineImportRoutine,
  RoutineImportResult,
} from "./routine-import-types.ts";

const knownFields = new Set([
  "description",
  "end date",
  "fixed interval days",
  "first start date",
  "preferred time",
  "recurrence",
  "repeat",
  "timezone",
  "title",
]);

export function parseRoutineMarkdownToJson(
  markdown: string,
): RoutineImportResult<unknown> {
  const routines: RoutineImportRoutine[] = [];
  let routine: RoutineImportRoutine | null = null;

  const lines = markdown.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index].trim();

    if (!line || line.startsWith("<!--")) {
      continue;
    }

    const headingTitle = readRoutineHeading(line);

    if (headingTitle !== null) {
      routine = { title: headingTitle };
      routines.push(routine);
      continue;
    }

    if (!routine) {
      return invalidStructure(`Content on line ${lineNumber} is outside a routine.`);
    }

    const parsed = parseField(line, lineNumber);
    if (!parsed.ok) {
      return parsed;
    }

    applyRoutineField(routine, parsed.data.field, parsed.data.value);
  }

  if (routines.length === 0) {
    return invalidStructure("Routine import Markdown must include a Routine heading.");
  }

  const firstRoutine = routines[0];

  return {
    ok: true,
    data:
      routines.length === 1 && firstRoutine
        ? ({
            routine: firstRoutine,
          } satisfies RoutineImportDocument)
        : ({
            routines,
          } satisfies RoutineImportBatchDocument),
  };
}

export function parseRoutineJsonToDocument(
  value: unknown,
): RoutineImportResult<RoutineImportDocument> {
  const parsed = parseRoutineJsonToDocuments(value);

  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.data.routines.length !== 1) {
    return invalidStructure("Routine import JSON must include exactly one routine.");
  }

  const routine = parsed.data.routines[0];

  if (!routine) {
    return missing("routine", "Routine import JSON must include a routine object.");
  }

  return {
    ok: true,
    data: {
      routine,
    },
  };
}

export function parseRoutineJsonToDocuments(
  value: unknown,
): RoutineImportResult<RoutineImportBatchDocument> {
  if (!isRecord(value)) {
    return invalidStructure("Routine import JSON must be an object.");
  }

  const unknownRoot = unknownKeys(value, ["routine", "routines"]);
  if (unknownRoot) {
    return invalidStructure(`Unknown root field "${unknownRoot}".`);
  }

  if (value.routine !== undefined && value.routines !== undefined) {
    return invalidStructure('Use either "routine" or "routines", not both.');
  }

  if (value.routines !== undefined) {
    return parseRoutineArray(value.routines);
  }

  if (value.routine === undefined) {
    return missing("routine", "Routine import JSON must include a routine object.");
  }

  const routine = parseRoutine(value.routine, "routine");

  if (!routine.ok) {
    return routine;
  }

  return {
    ok: true,
    data: {
      routines: [routine.data],
    },
  };
}

export function parseRoutineMarkdownToDocuments(
  markdown: string,
): RoutineImportResult<RoutineImportBatchDocument> {
  const parsed = parseRoutineMarkdownToJson(markdown);

  if (!parsed.ok) {
    return parsed;
  }

  return parseRoutineJsonToDocuments(parsed.data);
}

function parseRoutineArray(
  value: unknown,
): RoutineImportResult<RoutineImportBatchDocument> {
  if (!Array.isArray(value)) {
    return invalidStructure("routines must be an array.");
  }

  if (value.length === 0) {
    return missing("routines", "Routine import JSON must include at least one routine.");
  }

  const routines: RoutineImportRoutine[] = [];

  for (const [index, item] of value.entries()) {
    const routine = parseRoutine(item, `routines[${index}]`);

    if (!routine.ok) {
      return routine;
    }

    routines.push(routine.data);
  }

  return {
    ok: true,
    data: {
      routines,
    },
  };
}

function parseRoutine(
  value: unknown,
  fieldPrefix: string,
): RoutineImportResult<RoutineImportRoutine> {
  if (!isRecord(value)) {
    return missing(fieldPrefix, `${fieldPrefix} must be a routine object.`);
  }

  const unknown = unknownKeys(value, [
    "description",
    "endDate",
    "firstStartDate",
    "fixedIntervalDays",
    "preferredTime",
    "recurrence",
    "timezone",
    "title",
  ]);
  if (unknown) {
    return invalidStructure(`Unknown ${fieldPrefix} field "${unknown}".`);
  }

  const title = readOptionalString(value.title, `${fieldPrefix}.title`);
  if (!title.ok) {
    return title;
  }

  const description = readOptionalString(
    value.description,
    `${fieldPrefix}.description`,
  );
  if (!description.ok) {
    return description;
  }

  const firstStartDate = readOptionalString(
    value.firstStartDate,
    `${fieldPrefix}.firstStartDate`,
  );
  if (!firstStartDate.ok) {
    return firstStartDate;
  }

  const endDate = readOptionalString(value.endDate, `${fieldPrefix}.endDate`);
  if (!endDate.ok) {
    return endDate;
  }

  const recurrence = readRecurrence(value.recurrence, `${fieldPrefix}.recurrence`);
  if (!recurrence.ok) {
    return recurrence;
  }

  const fixedIntervalDays = readOptionalNumber(
    value.fixedIntervalDays,
    `${fieldPrefix}.fixedIntervalDays`,
  );
  if (!fixedIntervalDays.ok) {
    return fixedIntervalDays;
  }

  const preferredTime = readOptionalString(
    value.preferredTime,
    `${fieldPrefix}.preferredTime`,
  );
  if (!preferredTime.ok) {
    return preferredTime;
  }

  const timezone = readOptionalString(value.timezone, `${fieldPrefix}.timezone`);
  if (!timezone.ok) {
    return timezone;
  }

  return {
    ok: true,
    data: {
      title: title.data ?? "",
      description: description.data,
      firstStartDate: firstStartDate.data,
      endDate: endDate.data,
      recurrence: recurrence.data,
      fixedIntervalDays: fixedIntervalDays.data,
      preferredTime: preferredTime.data,
      timezone: timezone.data,
    },
  };
}

function parseField(
  line: string,
  lineNumber: number,
): RoutineImportResult<{ field: string; rawField: string; value: string }> {
  const separator = line.indexOf(":");

  if (separator < 1) {
    return invalidStructure(`Expected Field: value on line ${lineNumber}.`);
  }

  const rawField = line.slice(0, separator).trim();
  const field = normalizeFieldName(rawField);

  if (!knownFields.has(field)) {
    return invalidStructure(`Unknown field "${rawField}" on line ${lineNumber}.`);
  }

  return {
    ok: true,
    data: {
      field,
      rawField,
      value: line.slice(separator + 1).trim(),
    },
  };
}

function applyRoutineField(
  routine: RoutineImportRoutine,
  field: string,
  value: string,
) {
  if (field === "title") {
    routine.title = value;
  } else if (field === "description") {
    routine.description = value;
  } else if (field === "first start date") {
    routine.firstStartDate = value;
  } else if (field === "end date") {
    routine.endDate = value;
  } else if (field === "repeat" || field === "recurrence") {
    routine.recurrence = value as RoutineRecurrenceOption;
  } else if (field === "fixed interval days") {
    routine.fixedIntervalDays = value ? Number(value) : undefined;
  } else if (field === "preferred time") {
    routine.preferredTime = value;
  } else if (field === "timezone") {
    routine.timezone = value;
  }
}

function readRecurrence(
  value: unknown,
  field = "routine.recurrence",
): RoutineImportResult<RoutineRecurrenceOption | undefined> {
  if (value === undefined) {
    return { ok: true, data: undefined };
  }

  if (typeof value !== "string") {
    return invalid(field, `${field} must be text.`);
  }

  if (!routineRecurrenceOptions.includes(value as RoutineRecurrenceOption)) {
    return invalid(
      field,
      "Routine recurrence must be daily, weekly, monthly, every_14_days, every_30_days, or fixed_days.",
    );
  }

  return { ok: true, data: value as RoutineRecurrenceOption };
}

function readOptionalString(
  value: unknown,
  field: string,
): RoutineImportResult<string | undefined> {
  if (value === undefined) {
    return { ok: true, data: undefined };
  }

  if (typeof value !== "string") {
    return invalid(field, `${field} must be text.`);
  }

  return { ok: true, data: value };
}

function readOptionalNumber(
  value: unknown,
  field: string,
): RoutineImportResult<number | undefined> {
  if (value === undefined) {
    return { ok: true, data: undefined };
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    return invalid(field, `${field} must be a number.`);
  }

  return { ok: true, data: value };
}

function unknownKeys(value: Record<string, unknown>, allowed: string[]) {
  const allowedSet = new Set(allowed);
  return Object.keys(value).find((key) => !allowedSet.has(key)) ?? null;
}

function normalizeFieldName(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ");
}

function readRoutineHeading(line: string) {
  const hashedRoutineHeading = line.match(/^#\s+Routine:\s*(.*)$/i);

  if (hashedRoutineHeading) {
    return hashedRoutineHeading[1].trim();
  }

  const bareRoutineHeading = line.match(/^Routine:\s*(.*)$/i);

  if (bareRoutineHeading) {
    return bareRoutineHeading[1].trim();
  }

  if (line.startsWith("# ")) {
    return line.slice(2).trim();
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function missing(field: string, message: string) {
  return {
    ok: false,
    code: "routine_import_missing",
    message,
    category: "missing_parameter",
    subject: "routine",
    field,
    reason: "required",
  } satisfies RoutineImportResult<never>;
}

function invalid(field: string, message: string) {
  return {
    ok: false,
    code: "routine_import_invalid",
    message,
    category: "invalid_parameter",
    subject: "routine",
    field,
    reason: "invalid_value",
  } satisfies RoutineImportResult<never>;
}

function invalidStructure(message: string) {
  return invalid("structure", message);
}
