import type { NotificationMessages } from "../messages/app-messages.ts";
import {
  actionFailureCategory,
  type ActionFailureCategory,
  type CodedActionFailure,
} from "../messages/action-failure.ts";
import { localizedActionMessage } from "../messages/action-result.ts";

type ShowErrorNotification = (message: string, title?: string) => void;

type ActionNotificationMessages = Partial<
  Pick<
    NotificationMessages,
    | "databaseConnectionFailedMessage"
    | "databaseConnectionFailedTitle"
    | "databaseUpdateFailedMessage"
    | "databaseUpdateFailedTitle"
    | "invalidParameterMessage"
    | "invalidParameterTitle"
    | "missingParameterMessage"
    | "missingParameterTitle"
    | "targetNotFoundMessage"
    | "targetNotFoundTitle"
    | "serverActionFailedMessage"
    | "serverActionFailedTitle"
  >
>;

type NotifiedActionResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
    };

export async function runNotifiedServerAction<T>({
  action,
  rejectedCategory = "server",
  messages,
  showErrorNotification,
}: {
  action: () => Promise<T>;
  rejectedCategory?: Extract<
    ActionFailureCategory,
    "database_connection" | "database_update" | "server"
  >;
  messages?: ActionNotificationMessages;
  showErrorNotification: ShowErrorNotification;
}): Promise<NotifiedActionResult<T>> {
  try {
    return {
      ok: true,
      value: await action(),
    };
  } catch {
    showActionTransportFailure({
      category: rejectedCategory,
      messages,
      showErrorNotification,
    });

    return { ok: false };
  }
}

export function notifyActionFailure({
  result,
  resultMessages,
  fallbackTitle,
  notificationMessages,
  showErrorNotification,
}: {
  result: CodedActionFailure;
  resultMessages?: Record<string, string>;
  fallbackTitle?: string;
  notificationMessages?: ActionNotificationMessages;
  showErrorNotification: ShowErrorNotification;
}) {
  const category = actionFailureCategory(result);

  if (category === "database_connection") {
    showDatabaseConnectionFailure(showErrorNotification, notificationMessages);
    return;
  }

  if (category === "database_update") {
    showDatabaseUpdateFailure(showErrorNotification, notificationMessages);
    return;
  }

  if (category === "server") {
    showActionTransportFailure({
      category: "server",
      messages: notificationMessages,
      showErrorNotification,
    });
    return;
  }

  if (category === "parameter_missing") {
    const messageFromResult = localizedActionMessage(result, resultMessages);
    showErrorNotification(
      messageFromResult ??
        notificationMessages?.missingParameterMessage ??
        "A required parameter is missing.",
      notificationMessages?.missingParameterTitle ?? "Parameter missing",
    );
    return;
  }

  if (category === "parameter_invalid") {
    const messageFromResult = localizedActionMessage(result, resultMessages);
    showErrorNotification(
      messageFromResult ??
        notificationMessages?.invalidParameterMessage ??
        "A parameter is invalid.",
      notificationMessages?.invalidParameterTitle ?? "Parameter invalid",
    );
    return;
  }

  if (category === "not_found") {
    showErrorNotification(
      notificationMessages?.targetNotFoundMessage ??
        "The requested item was not found.",
      notificationMessages?.targetNotFoundTitle ?? "Target not found",
    );
    return;
  }

  const message = localizedActionMessage(result, resultMessages);
  showErrorNotification(message, fallbackTitle);
}

export function showActionTransportFailure({
  category,
  messages,
  showErrorNotification,
}: {
  category: Extract<
    ActionFailureCategory,
    "database_connection" | "database_update" | "server"
  >;
  messages?: ActionNotificationMessages;
  showErrorNotification: ShowErrorNotification;
}) {
  if (category === "server") {
    showErrorNotification(
      messages?.serverActionFailedMessage ??
        "The server hit an internal error. Please try again.",
      messages?.serverActionFailedTitle ?? "Server error",
    );
    return;
  }

  if (category === "database_update") {
    showDatabaseUpdateFailure(showErrorNotification, messages);
    return;
  }

  showDatabaseConnectionFailure(showErrorNotification, messages);
}

export function showDatabaseActionFailure(
  showErrorNotification: ShowErrorNotification,
  messages?: ActionNotificationMessages,
) {
  showDatabaseConnectionFailure(showErrorNotification, messages);
}

export function showDatabaseConnectionFailure(
  showErrorNotification: ShowErrorNotification,
  messages?: ActionNotificationMessages,
) {
  showErrorNotification(
    messages?.databaseConnectionFailedMessage ??
      "Database connection failed. Please try again.",
    messages?.databaseConnectionFailedTitle ?? "Database connection failed",
  );
}

export function showDatabaseUpdateFailure(
  showErrorNotification: ShowErrorNotification,
  messages?: ActionNotificationMessages,
) {
  showErrorNotification(
    messages?.databaseUpdateFailedMessage ??
      "Database update failed. Please try again.",
    messages?.databaseUpdateFailedTitle ?? "Database update failed",
  );
}
