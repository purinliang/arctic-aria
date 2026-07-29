import type {
  ActionFailureResult,
  ActionFailureSubject,
} from "../messages/action-result.ts";

export type TemplateOperation = "create" | "update" | "delete";
export type TemplatePreviewOperation = TemplateOperation | "preserve";

export type FlatTemplateField = {
  name: string;
  value: string;
  lineNumber: number;
};

export type FlatTemplateItem = {
  heading: string;
  lineNumber: number;
  fields: FlatTemplateField[];
};

export type FlatTemplateDocument = {
  items: FlatTemplateItem[];
};

type FlatTemplateParseOptions = {
  invalidCode: string;
  itemHeadings: string[];
  subject: ActionFailureSubject;
};

type FlatTemplateParseResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

type TemplateCommentState = {
  inComment: boolean;
};

export function parseFlatTemplateMarkdown(
  source: string,
  options: FlatTemplateParseOptions,
): FlatTemplateParseResult<FlatTemplateDocument> {
  const items: FlatTemplateItem[] = [];
  const commentState: TemplateCommentState = { inComment: false };
  let currentItem: FlatTemplateItem | null = null;

  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    const uncommented = stripTemplateCommentLine(rawLine, commentState);

    if (uncommented === null) {
      continue;
    }

    const trimmed = uncommented.trim();

    if (!trimmed) {
      continue;
    }

    const heading = parseTemplateHeading(trimmed);

    if (heading) {
      if (isItemHeading(heading.text, options.itemHeadings)) {
        currentItem = {
          heading: heading.text,
          lineNumber,
          fields: [],
        };
        items.push(currentItem);
      }

      continue;
    }

    if (!currentItem) {
      return invalidFlatTemplateParse(
        `Line ${lineNumber} must belong to an item section.`,
        options,
      );
    }

    const field = parseTemplateField(trimmed, lineNumber, options);

    if (!field.ok) {
      return field;
    }

    currentItem.fields.push(field.data);
  }

  if (items.length === 0) {
    return invalidFlatTemplateParse(
      "Template must contain at least one item section.",
      options,
    );
  }

  return {
    ok: true,
    data: {
      items,
    },
  };
}

export function normalizeTemplateFieldName(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function encodeTemplateFieldValue(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/\n/g, "\\n");
}

export function normalizeTemplateOperation(value: string) {
  const normalized = normalizeTemplateFieldName(value);

  if (normalized === "create" || normalized === "add" || normalized === "new") {
    return "create";
  }

  if (
    normalized === "update" ||
    normalized === "edit" ||
    normalized === "change"
  ) {
    return "update";
  }

  if (
    normalized === "delete" ||
    normalized === "remove" ||
    normalized === "archive"
  ) {
    return "delete";
  }

  return null;
}

export function flatTemplateInvalidResult({
  code,
  message,
  subject,
}: {
  code: string;
  message: string;
  subject: ActionFailureSubject;
}): ActionFailureResult {
  return {
    ok: false,
    code,
    message,
    category: "invalid_parameter",
    action: "save",
    subject,
    field: "template",
    reason: "invalid_value",
  };
}

function stripTemplateCommentLine(line: string, state: TemplateCommentState) {
  let current = line;

  if (state.inComment) {
    const endIndex = current.indexOf("-->");

    if (endIndex === -1) {
      return null;
    }

    current = current.slice(endIndex + 3);
    state.inComment = false;
  }

  while (current.includes("<!--")) {
    const startIndex = current.indexOf("<!--");
    const endIndex = current.indexOf("-->", startIndex + 4);

    if (endIndex === -1) {
      state.inComment = true;
      current = current.slice(0, startIndex);
      break;
    }

    current = current.slice(0, startIndex) + current.slice(endIndex + 3);
  }

  return current;
}

function parseTemplateHeading(line: string) {
  const match = line.match(/^(#{1,6})\s+(.+)$/);

  if (!match) {
    return null;
  }

  return {
    level: match[1].length,
    text: match[2].trim(),
  };
}

function isItemHeading(value: string, itemHeadings: string[]) {
  const normalized = normalizeTemplateFieldName(value.split(":")[0] ?? "");

  return itemHeadings.some(
    (heading) => normalized === normalizeTemplateFieldName(heading),
  );
}

function parseTemplateField(
  line: string,
  lineNumber: number,
  options: FlatTemplateParseOptions,
): FlatTemplateParseResult<FlatTemplateField> {
  const normalizedLine = line.startsWith("- ") ? line.slice(2).trim() : line;
  const match = normalizedLine.match(/^([A-Za-z][A-Za-z0-9 _-]*)\s*[:=]\s*(.*)$/);

  if (!match) {
    return invalidFlatTemplateParse(
      `Line ${lineNumber} must be a key/value field.`,
      options,
    );
  }

  return {
    ok: true,
    data: {
      name: normalizeTemplateFieldName(match[1]),
      value: decodeTemplateFieldValue(match[2]),
      lineNumber,
    },
  };
}

function invalidFlatTemplateParse(
  message: string,
  options: FlatTemplateParseOptions,
): ActionFailureResult {
  return flatTemplateInvalidResult({
    code: options.invalidCode,
    message,
    subject: options.subject,
  });
}

function decodeTemplateFieldValue(value: string) {
  return value.trim().replace(/\\n/g, "\n");
}
