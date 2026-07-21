export type ActionFailureCategory =
  | "auth"
  | "database_connection"
  | "database_update"
  | "parameter_missing"
  | "parameter_invalid"
  | "not_found"
  | "server"
  | "domain";

export type CodedActionFailure = {
  message: string;
  code?: string;
};

const databaseConnectionFailureCodes = new Set([
  "auth_database_failed",
  "ideas_unavailable",
  "settings_discord_binding_unavailable",
  "settings_preferences_unavailable",
]);

const databaseUpdateFailureCodes = new Set([
  "idea_capture_failed",
  "idea_save_failed",
  "idea_archive_failed",
  "settings_discord_code_cancel_failed",
  "settings_discord_code_create_failed",
  "settings_discord_unbind_failed",
  "settings_preferences_save_failed",
]);

const serverFailureCodes = new Set([
  "auth_request_failed",
  "auth_request_invalid",
  "performance_latency_failed",
  "settings_discord_test_bot_unavailable",
  "settings_discord_test_config_missing",
  "settings_discord_test_delivery_failed",
]);

export function actionFailureCategory(
  result: CodedActionFailure,
): ActionFailureCategory {
  const code = result.code ?? "";

  if (code === "auth_required" || code === "settings_unauthorized") {
    return "auth";
  }

  if (
    databaseConnectionFailureCodes.has(code) ||
    code.endsWith("_database_tables_missing")
  ) {
    return "database_connection";
  }

  if (
    databaseUpdateFailureCodes.has(code) ||
    code.includes("_database_update_")
  ) {
    return "database_update";
  }

  if (code.endsWith("_not_found") || code.includes("_not_found")) {
    return "not_found";
  }

  if (code.endsWith("_missing")) {
    return "parameter_missing";
  }

  if (code.endsWith("_invalid") || code === "auth_validation_failed") {
    return "parameter_invalid";
  }

  if (
    serverFailureCodes.has(code) ||
    code.endsWith("_failed") ||
    code.endsWith("_unavailable")
  ) {
    return "server";
  }

  return "domain";
}
