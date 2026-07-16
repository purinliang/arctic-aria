export function projectDatabaseErrorMessage(error: unknown) {
  if (isMissingProjectTableError(error)) {
    return "Project database tables are missing. Run pnpm --dir apps/web db:migrate before using Projects.";
  }

  if (isInvalidDateError(error)) {
    return "Dates must be real calendar dates in YYYY-MM-DD format.";
  }

  if (isProjectSidebarPinConflict(error)) {
    return "Pinned projects changed. Refresh and try again.";
  }

  return "Project database update failed.";
}

export function projectDatabaseErrorCode(error: unknown) {
  if (isMissingProjectTableError(error)) {
    return "project_database_tables_missing";
  }

  if (isInvalidDateError(error)) {
    return "project_dates_invalid";
  }

  if (isProjectSidebarPinConflict(error)) {
    return "project_sidebar_pin_conflict";
  }

  return "project_database_update_failed";
}

function isMissingProjectTableError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";

  return (
    code === "42P01" ||
    [
      "projects",
      "project_milestones",
      "project_tasks",
    ].some((tableName) =>
      message.includes(`relation "${tableName}" does not exist`),
    )
  );
}

function isInvalidDateError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message =
    "message" in error ? String(error.message).toLowerCase() : "";

  return (
    (code === "22007" || code === "22008") &&
    (message.includes("date") || message.includes("datetime"))
  );
}

function isProjectSidebarPinConflict(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message =
    "message" in error ? String(error.message).toLowerCase() : "";
  const constraint =
    "constraint" in error ? String(error.constraint).toLowerCase() : "";

  return (
    code === "23505" &&
    (constraint.includes("projects_sidebar_pin_order_unique") ||
      message.includes("projects_sidebar_pin_order_unique"))
  );
}
