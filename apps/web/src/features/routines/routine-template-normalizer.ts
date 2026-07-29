import type { ActionFailureResult } from "../../messages/action-result.ts";
import type {
  RoutineDefinition,
  RoutineGroupOption,
} from "../dashboard/types.ts";
import {
  flatTemplateInvalidResult,
  normalizeTemplateOperation,
  parseFlatTemplateMarkdown,
  type FlatTemplateField,
  type FlatTemplateItem,
} from "../template-parser.ts";
import {
  currentRoutineMatchesValidation,
  routineTemplateDraft,
} from "./routine-template-draft.ts";
import { validateRoutineInput } from "./routine-action-helpers.ts";
import type {
  NormalizedRoutineTemplate,
  RoutineTemplateCommand,
  RoutineTemplatePreview,
  RoutineTemplatePreviewOperation,
  RoutineTemplateSaveCommand,
} from "./routine-template-types.ts";

type RoutineTemplateMode = "create" | "update";

const routineTemplateFieldAliases = new Map([
  ["id", "id"],
  ["routine_id", "id"],
  ["op", "op"],
  ["operation", "op"],
  ["title", "title"],
  ["description", "description"],
  ["group", "group_id"],
  ["group_id", "group_id"],
  ["start_date", "start_date"],
  ["end_date", "end_date"],
  ["preferred_time", "preferred_time"],
  ["time", "preferred_time"],
  ["estimated_duration", "estimated_duration_minutes"],
  ["estimated_duration_minutes", "estimated_duration_minutes"],
  ["recurrence", "recurrence"],
  ["repeat_rule", "recurrence"],
  ["fixed_interval_days", "fixed_interval_days"],
  ["timezone", "timezone"],
]);

export function normalizeRoutineTemplateDocument({
  source,
  currentRoutines,
  routineGroups,
  targetRoutineId,
  defaultTimeZone,
}: {
  source: string;
  currentRoutines: RoutineDefinition[];
  routineGroups: RoutineGroupOption[];
  targetRoutineId: string | null;
  defaultTimeZone: string;
}) {
  const parsed = parseFlatTemplateMarkdown(source, {
    invalidCode: "routine_template_invalid",
    itemHeadings: ["routine"],
    subject: "routine",
  });

  if (!parsed.ok) {
    return parsed;
  }

  const mode: RoutineTemplateMode = targetRoutineId ? "update" : "create";
  const currentRoutineById = new Map(
    currentRoutines.map((routine) => [routine.id, routine]),
  );
  const routineGroupIds = new Set(routineGroups.map((group) => group.id));
  const commands: RoutineTemplateCommand[] = [];
  let ignoredFieldCount = 0;
  let targetSeen = mode === "create";

  for (const item of parsed.data.items) {
    const fields = readRoutineTemplateFields(item);

    ignoredFieldCount += fields.ignoredFieldCount;

    const routineId = fields.values.get("id")?.trim() ?? "";
    const operation = normalizeTemplateOperation(
      fields.values.get("op")?.trim() ||
        (routineId ? "update" : "create"),
    );

    if (!operation) {
      return invalidRoutineTemplate("Routine template operation is invalid.");
    }

    if (mode === "create" && (routineId || operation !== "create")) {
      return invalidRoutineTemplate(
        "Create templates can only contain create rows with an empty id.",
      );
    }

    if (operation === "create") {
      if (routineId) {
        return invalidRoutineTemplate("Create rows must leave id empty.");
      }

      const normalized = normalizeRoutineTemplateSave({
        fields: fields.values,
        currentRoutine: null,
        defaultTimeZone,
        routineGroupIds,
        operation: "create",
      });

      if (!normalized.ok) {
        return normalized;
      }

      commands.push(normalized.data);
      continue;
    }

    if (!routineId) {
      return invalidRoutineTemplate("Update and delete rows must include id.");
    }

    if (targetRoutineId && routineId !== targetRoutineId) {
      return invalidRoutineTemplate(
        "Template routine does not match this routine.",
        "routine_template_target_mismatch",
      );
    }

    const currentRoutine = currentRoutineById.get(routineId);

    if (!currentRoutine) {
      return routineNotFoundResult();
    }

    targetSeen = targetSeen || routineId === targetRoutineId;

    if (operation === "delete") {
      commands.push({
        operation: "delete",
        previewOperation: "delete",
        routineId,
        title: currentRoutine.title,
      });
      continue;
    }

    const normalized = normalizeRoutineTemplateSave({
      fields: fields.values,
      currentRoutine,
      defaultTimeZone,
      routineGroupIds,
      operation: "update",
    });

    if (!normalized.ok) {
      return normalized;
    }

    commands.push(normalized.data);
  }

  if (!targetSeen) {
    return invalidRoutineTemplate(
      "Template routine does not match this routine.",
      "routine_template_target_mismatch",
    );
  }

  return {
    ok: true as const,
    data: {
      commands,
      preview: routineTemplatePreview(commands, ignoredFieldCount),
    } satisfies NormalizedRoutineTemplate,
  };
}

function readRoutineTemplateFields(item: FlatTemplateItem) {
  const values = new Map<string, string>();
  let ignoredFieldCount = 0;

  for (const field of item.fields) {
    const canonicalName = canonicalRoutineTemplateFieldName(field);

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

function canonicalRoutineTemplateFieldName(field: FlatTemplateField) {
  return routineTemplateFieldAliases.get(field.name) ?? null;
}

function normalizeRoutineTemplateSave({
  fields,
  currentRoutine,
  defaultTimeZone,
  routineGroupIds,
  operation,
}: {
  fields: Map<string, string>;
  currentRoutine: RoutineDefinition | null;
  defaultTimeZone: string;
  routineGroupIds: Set<string>;
  operation: "create" | "update";
}) {
  const routineId = currentRoutine?.id ?? null;
  const draft = routineTemplateDraft({
    fields,
    currentRoutine,
    defaultTimeZone,
  });
  const validation = validateRoutineInput(draft);

  if (!validation.ok) {
    return validation;
  }

  if (validation.groupId && !routineGroupIds.has(validation.groupId)) {
    return routineGroupNotFoundResult();
  }

  return {
    ok: true as const,
    data: {
      operation,
      previewOperation:
        operation === "update" &&
        currentRoutineMatchesValidation(currentRoutine, validation)
          ? "preserve"
          : operation,
      routineId,
      groupId: validation.groupId,
      title: validation.title,
      description: validation.description,
      startDate: validation.startDate,
      endDate: validation.endDate,
      estimatedDurationMinutes: validation.estimatedDurationMinutes,
      rule: validation.rule,
    } satisfies RoutineTemplateSaveCommand,
  };
}

function routineTemplatePreview(
  commands: RoutineTemplateCommand[],
  ignoredFieldCount: number,
): RoutineTemplatePreview {
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
  } satisfies Record<RoutineTemplatePreviewOperation, number>;
}

function invalidRoutineTemplate(
  message: string,
  code = "routine_template_invalid",
): ActionFailureResult {
  return flatTemplateInvalidResult({
    code,
    message,
    subject: "routine",
  });
}

function routineNotFoundResult(): ActionFailureResult {
  return {
    ok: false,
    message: "Routine was not found.",
    code: "routine_not_found",
    category: "not_found",
    subject: "routine",
  };
}

function routineGroupNotFoundResult(): ActionFailureResult {
  return {
    ok: false,
    message: "Routine group was not found.",
    code: "routine_group_not_found",
    category: "not_found",
    subject: "group",
  };
}
