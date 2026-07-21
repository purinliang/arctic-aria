import type {
  ActionFailureAction,
  ActionFailureCategory,
  ActionFailureResult,
  ActionFailureSubject,
} from "./action-result.ts";

export type {
  ActionFailureAction,
  ActionFailureCategory,
  ActionFailureReason,
  ActionFailureResult,
  ActionFailureSubject,
} from "./action-result.ts";

export type StructuredActionFailure = ActionFailureResult;

type ParameterFailureMessages = {
  beforeStart?: (field: string, startField: string) => string;
  chooseRequired?: (field: string) => string;
  duplicateName?: (subject: string) => string;
  inUse?: (subject: string) => string;
  invalidFormatDate?: (field: string) => string;
  invalidFormatTime?: (field: string) => string;
  invalidValue?: (field: string) => string;
  limitReached?: (action: string, subject: string, limit?: number) => string;
  protected?: (subject: string) => string;
  required?: (field: string) => string;
  selectRequired?: (field: string) => string;
  tooLong?: (field: string, limit?: number) => string;
  tooShort?: (field: string, limit?: number) => string;
};

export type ActionFailureNotificationMessages = {
  actionFailedTitle?: (action: string, subject: string) => string;
  actionWords?: Partial<Record<ActionFailureAction, string>>;
  fieldWords?: Partial<Record<string, string>>;
  parameterFailureMessages?: ParameterFailureMessages;
  subjectWords?: Partial<Record<ActionFailureSubject, string>>;
};

type FieldDisplay = {
  article?: "a" | "an";
  format?: "date" | "time";
  label: string;
  requiredVerb?: "choose" | "enter" | "select";
  subjectPrefix?: boolean;
};

const fieldDisplays: Record<string, FieldDisplay> = {
  category: {
    article: "a",
    label: "category",
    requiredVerb: "choose",
  },
  category_name: {
    label: "name",
    requiredVerb: "enter",
    subjectPrefix: true,
  },
  date: {
    article: "a",
    format: "date",
    label: "date",
    requiredVerb: "select",
  },
  dates: {
    format: "date",
    label: "dates",
  },
  deadline: {
    article: "a",
    format: "date",
    label: "deadline",
    requiredVerb: "select",
  },
  description: {
    label: "description",
    requiredVerb: "enter",
    subjectPrefix: true,
  },
  end_date: {
    article: "an",
    format: "date",
    label: "end date",
    requiredVerb: "select",
  },
  expected_duration: {
    article: "an",
    label: "expected duration",
    requiredVerb: "choose",
  },
  first_start_date: {
    article: "a",
    format: "date",
    label: "first start date",
    requiredVerb: "select",
  },
  name: {
    label: "name",
    requiredVerb: "enter",
    subjectPrefix: true,
  },
  objective: {
    label: "objective",
    requiredVerb: "enter",
    subjectPrefix: true,
  },
  preferred_time: {
    format: "time",
    label: "preferred time",
    requiredVerb: "enter",
  },
  rule: {
    label: "rule",
    subjectPrefix: true,
  },
  start_date: {
    article: "a",
    format: "date",
    label: "start date",
    requiredVerb: "select",
  },
  text: {
    label: "text",
    requiredVerb: "enter",
    subjectPrefix: true,
  },
  timezone: {
    article: "a",
    label: "timezone",
    requiredVerb: "choose",
  },
  title: {
    label: "title",
    requiredVerb: "enter",
    subjectPrefix: true,
  },
};

const subjectFallbacks: Record<ActionFailureSubject, string> = {
  category: "Category",
  discord: "Discord",
  idea: "Idea",
  memory: "Memory",
  milestone: "Milestone",
  project: "Project",
  routine: "Routine",
  settings: "Settings",
  suggestion: "Suggestion",
  task: "Task",
};

const actionFallbacks: Record<ActionFailureAction, string> = {
  add: "Add",
  archive: "Archive",
  delete: "Delete",
  edit: "Edit",
  pin: "Pin",
  save: "Save",
  unpin: "Unpin",
  update: "Update",
};

export function actionFailureCategory(
  result: StructuredActionFailure,
): ActionFailureCategory {
  return result.category;
}

export function actionFailureTitle(
  result: StructuredActionFailure,
  messages?: ActionFailureNotificationMessages,
  fallbackTitle?: string,
) {
  if (result.action && result.subject) {
    const action = actionWord(result.action, messages);
    const subject = subjectWord(result.subject, messages);

    return messages?.actionFailedTitle?.(action, subject) ??
      `${action} ${subject.toLowerCase()} failed`;
  }

  return fallbackTitle;
}

export function structuredActionFailureMessage(
  result: StructuredActionFailure,
  messages?: ActionFailureNotificationMessages,
) {
  if (!result.reason) {
    return null;
  }

  const field = fieldPhrase(result, messages, {
    sentenceStart: true,
    useArticle: false,
  });
  const fieldWithArticle = fieldPhrase(result, messages, {
    sentenceStart: false,
    useArticle: true,
  });
  const subject = result.subject
    ? lowercaseFirst(subjectWord(result.subject, messages))
    : "item";
  const parameterMessages = messages?.parameterFailureMessages;

  if (result.reason === "required") {
    const requiredVerb = fieldDisplay(result.field).requiredVerb;

    if (requiredVerb === "select") {
      return parameterMessages?.selectRequired?.(fieldWithArticle) ??
        `Select ${fieldWithArticle}.`;
    }

    if (requiredVerb === "choose") {
      return parameterMessages?.chooseRequired?.(fieldWithArticle) ??
        `Choose ${fieldWithArticle}.`;
    }

    return parameterMessages?.required?.(field) ?? `${field} is required.`;
  }

  if (result.reason === "too_long") {
    return parameterMessages?.tooLong?.(field, result.limit) ??
      tooLongMessage(field, result.limit);
  }

  if (result.reason === "too_short") {
    return parameterMessages?.tooShort?.(field, result.limit) ??
      tooShortMessage(field, result.limit);
  }

  if (result.reason === "invalid_format") {
    const format = fieldDisplay(result.field).format;

    if (format === "date") {
      return parameterMessages?.invalidFormatDate?.(field) ??
        `${field} must be a real date in YYYY-MM-DD format.`;
    }

    if (format === "time") {
      return parameterMessages?.invalidFormatTime?.(field) ??
        `${field} must use HH:MM format.`;
    }
  }

  if (result.reason === "before_start") {
    return parameterMessages?.beforeStart?.(field, "start date") ??
      `${field} cannot be before start date.`;
  }

  if (result.reason === "duplicate") {
    return parameterMessages?.duplicateName?.(subject) ??
      `A ${subject} with that name already exists.`;
  }

  if (result.reason === "protected") {
    return parameterMessages?.protected?.(subject) ??
      `This ${subject} is protected.`;
  }

  if (result.reason === "in_use") {
    return parameterMessages?.inUse?.(subject) ??
      `This ${subject} is still in use.`;
  }

  if (result.reason === "limit_reached") {
    const action = result.action ? actionWord(result.action, messages) : "Use";

    return parameterMessages?.limitReached?.(
      lowercaseFirst(action),
      subject,
      result.limit,
    ) ?? limitReachedMessage(action, subject, result.limit);
  }

  return parameterMessages?.invalidValue?.(field) ?? `${field} is invalid.`;
}

function actionWord(
  action: ActionFailureAction,
  messages?: ActionFailureNotificationMessages,
) {
  return messages?.actionWords?.[action] ?? actionFallbacks[action];
}

function subjectWord(
  subject: ActionFailureSubject,
  messages?: ActionFailureNotificationMessages,
) {
  return messages?.subjectWords?.[subject] ?? subjectFallbacks[subject];
}

function fieldDisplay(field: string | undefined): FieldDisplay {
  const key = normalizeFieldKey(field);

  return fieldDisplays[key] ?? {
    label: key.replaceAll("_", " ") || "parameter",
  };
}

function fieldPhrase(
  result: StructuredActionFailure,
  messages: ActionFailureNotificationMessages | undefined,
  options: {
    sentenceStart: boolean;
    useArticle: boolean;
  },
) {
  const display = fieldDisplay(result.field);
  const key = normalizeFieldKey(result.field);
  const translatedLabel = messages?.fieldWords?.[key] ?? display.label;
  const label =
    display.subjectPrefix && result.subject
      ? `${subjectWord(result.subject, messages)} ${translatedLabel}`
      : translatedLabel;
  const phrase =
    options.useArticle && display.article
      ? `${display.article} ${label}`
      : label;

  return options.sentenceStart ? uppercaseFirst(phrase) : lowercaseFirst(phrase);
}

function normalizeFieldKey(field: string | undefined) {
  return (field ?? "")
    .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
    .replaceAll("-", "_")
    .replace(/^_+|_+$/g, "");
}

function uppercaseFirst(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function lowercaseFirst(value: string) {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function tooLongMessage(field: string, limit: number | undefined) {
  return limit === undefined
    ? `${field} is too long.`
    : `${field} must be ${limit} characters or fewer.`;
}

function tooShortMessage(field: string, limit: number | undefined) {
  return limit === undefined
    ? `${field} is too short.`
    : `${field} must be at least ${limit} characters.`;
}

function limitReachedMessage(
  action: string,
  subject: string,
  limit: number | undefined,
) {
  return limit === undefined
    ? `${action} ${subject} limit reached.`
    : `You can ${action.toLowerCase()} up to ${limit} ${pluralize(subject)}.`;
}

function pluralize(value: string) {
  return value.endsWith("s") ? value : `${value}s`;
}
