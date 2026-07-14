export function projectDatabaseErrorMessage(error: unknown) {
  if (isMissingProjectTableError(error)) {
    return "Project database tables are missing. Run pnpm --dir apps/web db:migrate before using Projects.";
  }

  return "Project database update failed.";
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
      "project_subtasks",
    ].some((tableName) =>
      message.includes(`relation "${tableName}" does not exist`),
    )
  );
}
