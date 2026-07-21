export type ActionFailureCategory =
  | "auth"
  | "database_connection"
  | "database_update"
  | "missing_parameter"
  | "invalid_parameter"
  | "not_found"
  | "server"
  | "domain";

export type ActionFailureAction =
  | "add"
  | "archive"
  | "delete"
  | "edit"
  | "pin"
  | "save"
  | "unpin"
  | "update";

export type ActionFailureSubject =
  | "category"
  | "discord"
  | "idea"
  | "memory"
  | "milestone"
  | "project"
  | "routine"
  | "settings"
  | "suggestion"
  | "task";

export type ActionFailureReason =
  | "required"
  | "too_short"
  | "too_long"
  | "invalid_format"
  | "invalid_value"
  | "before_start"
  | "duplicate"
  | "protected"
  | "in_use"
  | "limit_reached";

export type ActionFailureResult = {
  ok: false;
  message: string;
  code?: string;
  category: ActionFailureCategory;
  action?: ActionFailureAction;
  subject?: ActionFailureSubject;
  field?: string;
  reason?: ActionFailureReason;
  limit?: number;
};

export function localizedActionMessage(
  result: { message: string; code?: string },
  messages?: Record<string, string>,
) {
  return result.code ? messages?.[result.code] ?? result.message : result.message;
}
