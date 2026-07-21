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

test("database update failure codes use the shared database update notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "project_database_update_failed",
      message: "Database update failed.",
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

test("database connection failure codes use the shared database connection notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "auth_database_failed",
      message: "Account data could not be checked. Please try again.",
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

test("server failure codes use the shared server notification", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "auth_request_failed",
      message: "Authentication could not be completed. Please try again.",
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

test("parameter codes use localized feature messages; not-found falls back to shared", () => {
  const notifications: Array<{ message: string; title?: string }> = [];

  notifyActionFailure({
    result: {
      code: "project_deadline_missing",
      message: "Select a deadline date.",
    },
    resultMessages: {
      project_deadline_missing: "Select a deadline date.",
      task_title_invalid: "Task title must be 1-120 characters.",
    },
    fallbackTitle: "Project save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });
  notifyActionFailure({
    result: {
      code: "task_title_invalid",
      message: "Task title must be 1-120 characters.",
    },
    resultMessages: {
      task_title_invalid: "Task title must be 1-120 characters.",
    },
    fallbackTitle: "Task save failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });
  notifyActionFailure({
    result: {
      code: "task_not_found",
      message: "Task was not found.",
    },
    fallbackTitle: "Task delete failed",
    showErrorNotification: (message, title) => {
      notifications.push({ message, title });
    },
  });

  assert.deepEqual(notifications, [
    {
      message: "Select a deadline date.",
      title: "Parameter missing",
    },
    {
      message: "Task title must be 1-120 characters.",
      title: "Parameter invalid",
    },
    {
      message: "The requested item was not found.",
      title: "Target not found",
    },
  ]);
});
