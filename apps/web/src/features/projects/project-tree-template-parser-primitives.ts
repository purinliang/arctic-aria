import type { ProjectTreeTemplateResult } from "./project-tree-template-types.ts";

export type ProjectTreeTemplateHeading = {
  level: number;
  text: string;
};

export type ProjectTreeTemplateParsedField = {
  name: string;
  value: string;
};

export type ProjectTreeTemplateCommentState = {
  inComment: boolean;
};

export function stripProjectTreeTemplateCommentLine(
  line: string,
  state: ProjectTreeTemplateCommentState,
) {
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

export function parseProjectTreeTemplateHeading(
  line: string,
): ProjectTreeTemplateHeading | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);

  if (!match) {
    return null;
  }

  return {
    level: match[1].length,
    text: match[2].trim(),
  };
}

export function parseProjectTreeTemplateField(
  line: string,
  lineNumber: number,
): ProjectTreeTemplateResult<ProjectTreeTemplateParsedField> {
  const match = line.match(/^([A-Za-z][A-Za-z0-9 _-]*)\s*[:=]\s*(.*)$/);

  if (!match) {
    return invalidProjectTreeTemplateParse(
      `Line ${lineNumber} must be a key/value field.`,
    );
  }

  return {
    ok: true,
    data: {
      name: normalizeProjectTreeTemplateFieldName(match[1]),
      value: decodeProjectTreeTemplateFieldValue(match[2]),
    },
  };
}

export function normalizeProjectTreeTemplateFieldName(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function invalidProjectTreeTemplateParse(
  message: string,
): ProjectTreeTemplateResult<never> {
  return {
    ok: false,
    code: "project_template_invalid",
    message,
    category: "invalid_parameter",
    subject: "project",
    field: "template",
    reason: "invalid_value",
  };
}

function decodeProjectTreeTemplateFieldValue(value: string) {
  return value.trim().replace(/\\n/g, "\n");
}
