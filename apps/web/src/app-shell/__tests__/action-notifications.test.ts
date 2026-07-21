import assert from "node:assert/strict";
import test from "node:test";
import {
  notifyActionFailure,
  runNotifiedServerAction,
} from "../action-notifications.ts";

test("notified server actions return resolved values without notifications", async () => {
  const notifications: Array<{ message: string; title?: string }> = [];
  const result = await runNotifiedServerAction({
    action: async () => "saved",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(result, {
    ok: true,
    value: "saved",
  });
  assert.deepEqual(notifications, []);
});

test("notified server actions show a server notification when rejected", async () => {
  const notifications: Array<{ message: string; title?: string }> = [];
  const result = await runNotifiedServerAction({
    action: async () => {
      throw new Error("connection refused");
    },
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(result, { ok: false });
  assert.deepEqual(notifications, [
    {
      message: "The server hit an internal error. Please try again.",
      title: "Server error",
    },
  ]);
});

test("notified server actions can report localized database transport failures", async () => {
  const notifications: Array<{ message: string; title?: string }> = [];
  const result = await runNotifiedServerAction({
    action: async () => {
      throw new Error("connection refused");
    },
    rejectedCategory: "database_connection",
    messages: {
      databaseConnectionFailedMessage: "数据库连接失败，请稍后再试。",
      databaseConnectionFailedTitle: "数据库连接失败",
    },
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(result, { ok: false });
  assert.deepEqual(notifications, [
    {
      message: "数据库连接失败，请稍后再试。",
      title: "数据库连接失败",
    },
  ]);
});

test("notified server actions can report server transport failures", async () => {
  const notifications: Array<{ message: string; title?: string }> = [];
  const result = await runNotifiedServerAction({
    action: async () => {
      throw new Error("fetch failed");
    },
    rejectedCategory: "server",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(result, { ok: false });
  assert.deepEqual(notifications, [
    {
      message: "The server hit an internal error. Please try again.",
      title: "Server error",
    },
  ]);
});

test("database update failures use the shared database update notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "project_database_update_failed",
      message: "Database update failed.",
      category: "database_update",
    },
    resultMessages: {
      project_database_update_failed: "Database update failed.",
    },
    fallbackTitle: "Project save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "Database update failed. Please try again.",
      title: "Database update failed",
    },
  ]);
});

test("database connection failures use the shared database connection notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "auth_database_failed",
      message: "Account data could not be checked. Please try again.",
      category: "database_connection",
    },
    resultMessages: {
      auth_database_failed:
        "Account data could not be checked. Please try again.",
    },
    fallbackTitle: "Sign in failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "Database connection failed. Please try again.",
      title: "Database connection failed",
    },
  ]);
});

test("server failures use the shared server notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "auth_request_failed",
      message: "Authentication could not be completed. Please try again.",
      category: "server",
    },
    resultMessages: {
      auth_request_failed:
        "Authentication could not be completed. Please try again.",
    },
    fallbackTitle: "Sign in failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "The server hit an internal error. Please try again.",
      title: "Server error",
    },
  ]);
});

test("structured missing parameters use shared titles and field-specific messages", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "project_start_date_missing",
      message: "Start date is missing.",
      category: "missing_parameter",
      field: "start_date",
      reason: "required",
    },
    fallbackTitle: "Project save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "Select a start date.",
      title: "Parameter missing",
    },
  ]);
});

test("structured invalid parameters use field, reason, and limit messages", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "task_description_invalid",
      message: "Task description is invalid.",
      category: "invalid_parameter",
      subject: "task",
      field: "description",
      reason: "too_long",
      limit: 2000,
    },
    fallbackTitle: "Task save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });
  notifyActionFailure({
    result: {
      code: "project_deadline_invalid",
      message: "Deadline is invalid.",
      category: "invalid_parameter",
      field: "deadline",
      reason: "invalid_format",
    },
    fallbackTitle: "Project save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });
  notifyActionFailure({
    result: {
      code: "project_deadline_before_start",
      message: "Deadline is invalid.",
      category: "invalid_parameter",
      field: "deadline",
      reason: "before_start",
    },
    fallbackTitle: "Project save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "Task description must be 2000 characters or fewer.",
      title: "Parameter invalid",
    },
    {
      message: "Deadline must be a real date in YYYY-MM-DD format.",
      title: "Parameter invalid",
    },
    {
      message: "Deadline cannot be before start date.",
      title: "Parameter invalid",
    },
  ]);
});

test("domain failures can use structured action titles and reason messages", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "memory_category_duplicate",
      message: "Category already exists.",
      category: "domain",
      action: "save",
      subject: "category",
      reason: "duplicate",
    },
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });
  notifyActionFailure({
    result: {
      code: "project_pin_limit",
      message: "Too many pinned projects.",
      category: "domain",
      action: "pin",
      subject: "project",
      reason: "limit_reached",
      limit: 3,
    },
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "A category with that name already exists.",
      title: "Save category failed",
    },
    {
      message: "You can pin up to 3 projects.",
      title: "Pin project failed",
    },
  ]);
});

test("not-found failures use the shared target notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "task_not_found",
      message: "Task was not found.",
      category: "not_found",
      subject: "task",
    },
    fallbackTitle: "Task delete failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "The requested item was not found.",
      title: "Target not found",
    },
  ]);
});

test("legacy-looking codes do not classify failures without structured categories", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "project_database_update_failed",
      message: "Project-specific backend message.",
      category: "domain",
    },
    fallbackTitle: "Project save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "Project-specific backend message.",
      title: "Project save failed",
    },
  ]);
});
