import {
  routineRecurrenceOptions,
  type RoutineRecurrenceOption,
} from "./routine-recurrence.ts";
import type {
  RoutineImportDocument,
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
  const routine: RoutineImportDocument["routine"] = { title: "" };
  let inRoutine = false;

  const lines = markdown.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index].trim();

    if (!line || line.startsWith("<!--")) {
      continue;
    }

    if (line.startsWith("# ")) {
      const title = line.slice(2).trim().replace(/^Routine:\s*/i, "").trim();
      routine.title = title;
      inRoutine = true;
      continue;
    }

    if (!inRoutine) {
      return invalidStructure(`Content on line ${lineNumber} is outside a routine.`);
    }

    const parsed = parseField(line, lineNumber);
    if (!parsed.ok) {
      return parsed;
    }

    applyRoutineField(routine, parsed.data.field, parsed.data.value);
  }

  return {
    ok: true,
    data: {
      routine,
    } satisfies RoutineImportDocument,
  };
}

export function parseRoutineJsonToDocument(
  value: unknown,
): RoutineImportResult<RoutineImportDocument> {
  if (!isRecord(value)) {
    return invalidStructure("Routine import JSON must be an object.");
  }

  const unknownRoot = unknownKeys(value, ["routine"]);
  if (unknownRoot) {
    return invalidStructure(`Unknown root field "${unknownRoot}".`);
  }

  if (!isRecord(value.routine)) {
    return missing("routine", "Routine import JSON must include a routine object.");
  }

  const unknown = unknownKeys(value.routine, [
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
    return invalidStructure(`Unknown routine field "${unknown}".`);
  }

  const title = readOptionalString(value.routine.title, "routine.title");
  if (!title.ok) {
    return title;
  }

  const description = readOptionalString(
    value.routine.description,
    "routine.description",
  );
  if (!description.ok) {
    return description;
  }

  const firstStartDate = readOptionalString(
    value.routine.firstStartDate,
    "routine.firstStartDate",
  );
  if (!firstStartDate.ok) {
    return firstStartDate;
  }

  const endDate = readOptionalString(value.routine.endDate, "routine.endDate");
  if (!endDate.ok) {
    return endDate;
  }

  const recurrence = readRecurrence(value.routine.recurrence);
  if (!recurrence.ok) {
    return recurrence;
  }

  const fixedIntervalDays = readOptionalNumber(
    value.routine.fixedIntervalDays,
    "routine.fixedIntervalDays",
  );
  if (!fixedIntervalDays.ok) {
    return fixedIntervalDays;
  }

  const preferredTime = readOptionalString(
    value.routine.preferredTime,
    "routine.preferredTime",
  );
  if (!preferredTime.ok) {
    return preferredTime;
  }

  const timezone = readOptionalString(value.routine.timezone, "routine.timezone");
  if (!timezone.ok) {
    return timezone;
  }

  return {
    ok: true,
    data: {
      routine: {
        title: title.data ?? "",
        description: description.data,
        firstStartDate: firstStartDate.data,
        endDate: endDate.data,
        recurrence: recurrence.data,
        fixedIntervalDays: fixedIntervalDays.data,
        preferredTime: preferredTime.data,
        timezone: timezone.data,
      },
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
  routine: RoutineImportDocument["routine"],
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
): RoutineImportResult<RoutineRecurrenceOption | undefined> {
  if (value === undefined) {
    return { ok: true, data: undefined };
  }

  if (typeof value !== "string") {
    return invalid("routine.recurrence", "routine.recurrence must be text.");
  }

  if (!routineRecurrenceOptions.includes(value as RoutineRecurrenceOption)) {
    return invalid(
      "routine.recurrence",
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
