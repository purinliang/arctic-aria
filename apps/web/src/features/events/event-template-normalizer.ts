import type { ActionFailureResult } from "../../messages/action-result.ts";
import {
  flatTemplateInvalidResult,
  normalizeTemplateOperation,
  parseFlatTemplateMarkdown,
  type FlatTemplateField,
  type FlatTemplateItem,
} from "../template-parser.ts";
import {
  validateEventInput,
  type EventInput,
} from "./event-action-helpers.ts";
import type { EventRecord } from "./server/event-repository.ts";
import type {
  EventTemplateCommand,
  EventTemplatePreview,
  EventTemplatePreviewOperation,
  EventTemplateSaveCommand,
  NormalizedEventTemplate,
} from "./event-template-types.ts";

type EventTemplateMode = "create" | "update";

const eventTemplateFieldAliases = new Map([
  ["id", "id"],
  ["event_id", "id"],
  ["op", "op"],
  ["operation", "op"],
  ["title", "title"],
  ["description", "description"],
  ["date", "event_date"],
  ["event_date", "event_date"],
  ["time", "event_time"],
  ["event_time", "event_time"],
  ["estimated_duration", "estimated_duration_hours"],
  ["estimated_duration_hours", "estimated_duration_hours"],
  ["location", "location"],
]);

export function normalizeEventTemplateDocument({
  source,
  currentEvents,
  targetEventId,
}: {
  source: string;
  currentEvents: EventRecord[];
  targetEventId: string | null;
}) {
  const parsed = parseFlatTemplateMarkdown(source, {
    invalidCode: "event_template_invalid",
    itemHeadings: ["event"],
    subject: "event",
  });

  if (!parsed.ok) {
    return parsed;
  }

  const mode: EventTemplateMode = targetEventId ? "update" : "create";
  const currentEventById = new Map(
    currentEvents.map((event) => [event.id, event]),
  );
  const commands: EventTemplateCommand[] = [];
  let ignoredFieldCount = 0;
  let targetSeen = mode === "create";

  for (const item of parsed.data.items) {
    const fields = readEventTemplateFields(item);

    ignoredFieldCount += fields.ignoredFieldCount;

    const eventId = fields.values.get("id")?.trim() ?? "";
    const operation = normalizeTemplateOperation(
      fields.values.get("op")?.trim() ||
        (eventId ? "update" : "create"),
    );

    if (!operation) {
      return invalidEventTemplate("Event template operation is invalid.");
    }

    if (mode === "create" && (eventId || operation !== "create")) {
      return invalidEventTemplate(
        "Create templates can only contain create rows with an empty id.",
      );
    }

    if (operation === "create") {
      if (eventId) {
        return invalidEventTemplate("Create rows must leave id empty.");
      }

      const normalized = normalizeEventTemplateSave({
        fields: fields.values,
        currentEvent: null,
        operation: "create",
      });

      if (!normalized.ok) {
        return normalized;
      }

      commands.push(normalized.data);
      continue;
    }

    if (!eventId) {
      return invalidEventTemplate("Update and delete rows must include id.");
    }

    if (targetEventId && eventId !== targetEventId) {
      return invalidEventTemplate(
        "Template event does not match this event.",
        "event_template_target_mismatch",
      );
    }

    const currentEvent = currentEventById.get(eventId);

    if (!currentEvent) {
      return eventNotFoundResult();
    }

    targetSeen = targetSeen || eventId === targetEventId;

    if (operation === "delete") {
      commands.push({
        operation: "delete",
        previewOperation: "delete",
        eventId,
        title: currentEvent.title,
      });
      continue;
    }

    const normalized = normalizeEventTemplateSave({
      fields: fields.values,
      currentEvent,
      operation: "update",
    });

    if (!normalized.ok) {
      return normalized;
    }

    commands.push(normalized.data);
  }

  if (!targetSeen) {
    return invalidEventTemplate(
      "Template event does not match this event.",
      "event_template_target_mismatch",
    );
  }

  return {
    ok: true as const,
    data: {
      commands,
      preview: eventTemplatePreview(commands, ignoredFieldCount),
    } satisfies NormalizedEventTemplate,
  };
}

function readEventTemplateFields(item: FlatTemplateItem) {
  const values = new Map<string, string>();
  let ignoredFieldCount = 0;

  for (const field of item.fields) {
    const canonicalName = canonicalEventTemplateFieldName(field);

    if (!canonicalName) {
      ignoredFieldCount += 1;
      continue;
    }

    values.set(canonicalName, field.value);
  }

  return {
    values,
    ignoredFieldCount,
  };
}

function canonicalEventTemplateFieldName(field: FlatTemplateField) {
  return eventTemplateFieldAliases.get(field.name) ?? null;
}

function normalizeEventTemplateSave({
  fields,
  currentEvent,
  operation,
}: {
  fields: Map<string, string>;
  currentEvent: EventRecord | null;
  operation: "create" | "update";
}) {
  const eventId = currentEvent?.id ?? null;
  const draft: EventInput = {
    id: eventId ?? undefined,
    title: fieldValue(fields, "title", currentEvent?.title ?? ""),
    description: fieldValue(
      fields,
      "description",
      currentEvent?.description ?? "",
    ),
    eventDate: fieldValue(fields, "event_date", currentEvent?.eventDate ?? ""),
    eventTime: fieldValue(fields, "event_time", currentEvent?.eventTime ?? ""),
    estimatedDurationHours: fieldValue(
      fields,
      "estimated_duration_hours",
      currentEvent?.estimatedDurationHours?.toString() ?? "",
    ),
    location: fieldValue(fields, "location", currentEvent?.location ?? ""),
  };
  const validation = validateEventInput(draft);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true as const,
    data: {
      operation,
      previewOperation:
        operation === "update" && currentEventMatchesValidation(currentEvent, validation)
          ? "preserve"
          : operation,
      eventId,
      title: validation.title,
      description: validation.description,
      eventDate: validation.eventDate,
      eventTime: validation.eventTime,
      estimatedDurationHours: validation.estimatedDurationHours,
      location: validation.location,
    } satisfies EventTemplateSaveCommand,
  };
}

function fieldValue(
  fields: Map<string, string>,
  name: string,
  fallback: string,
) {
  return fields.has(name) ? fields.get(name) ?? "" : fallback;
}

function currentEventMatchesValidation(
  currentEvent: EventRecord | null,
  validation: ReturnType<typeof validateEventInput> & { ok: true },
) {
  if (!currentEvent) {
    return false;
  }

  return (
    currentEvent.title === validation.title &&
    currentEvent.description === validation.description &&
    currentEvent.eventDate === validation.eventDate &&
    currentEvent.eventTime === validation.eventTime &&
    currentEvent.estimatedDurationHours === validation.estimatedDurationHours &&
    currentEvent.location === validation.location
  );
}

function eventTemplatePreview(
  commands: EventTemplateCommand[],
  ignoredFieldCount: number,
): EventTemplatePreview {
  const counts = emptyPreviewCounts();

  for (const command of commands) {
    counts[command.previewOperation] += 1;
  }

  return {
    items: commands.map((command) => ({
      operation: command.previewOperation,
      title: command.title,
    })),
    counts,
    ignoredFieldCount,
  };
}

function emptyPreviewCounts() {
  return {
    create: 0,
    update: 0,
    delete: 0,
    preserve: 0,
  } satisfies Record<EventTemplatePreviewOperation, number>;
}

function invalidEventTemplate(
  message: string,
  code = "event_template_invalid",
): ActionFailureResult {
  return flatTemplateInvalidResult({
    code,
    message,
    subject: "event",
  });
}

function eventNotFoundResult(): ActionFailureResult {
  return {
    ok: false,
    message: "Event was not found.",
    code: "event_not_found",
    category: "not_found",
    subject: "event",
  };
}
