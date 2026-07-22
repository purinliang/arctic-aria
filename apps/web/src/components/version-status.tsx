import {
  shouldShowExpectedDatabaseVersion,
  type DatabaseVersionStatus,
} from "./app-metadata";
import { ListItemDescription, ListItemTitle } from "./list";
import { SupportingText } from "./text";
import type { VersionStatusMessages } from "@/messages/app-messages";
import type { ReactNode } from "react";

const defaultVersionStatusMessages: VersionStatusMessages = {
  appVersion: "App Version",
  databaseVersion: "Database Version",
  expected: "expected",
  checking: "Checking...",
  unavailable: "Unavailable",
  databaseUnavailable: "Database version unavailable.",
};

export function VersionStatusSupport({
  darkMode,
  messages = defaultVersionStatusMessages,
  showDatabaseVersion = false,
  status,
}: {
  darkMode: boolean;
  messages?: VersionStatusMessages;
  showDatabaseVersion?: boolean;
  status: DatabaseVersionStatus;
}) {
  return (
    <div className="grid gap-1 text-center tabular-nums">
      <SupportingText darkMode={darkMode}>
        {messages.appVersion}: {status.appVersionText}
      </SupportingText>
      <span
        className={showDatabaseVersion ? undefined : "hidden"}
        aria-hidden={!showDatabaseVersion}
        data-version-row="database"
      >
        <SupportingText darkMode={darkMode}>
          {messages.databaseVersion}: {status.actualDatabaseVersionText}
          <DatabaseVersionMessage
            darkMode={darkMode}
            messages={messages}
            status={status}
          />
        </SupportingText>
      </span>
    </div>
  );
}

export function VersionStatusRows({
  darkMode,
  messages = defaultVersionStatusMessages,
  showDatabaseVersion = false,
  status,
}: {
  darkMode: boolean;
  messages?: VersionStatusMessages;
  showDatabaseVersion?: boolean;
  status: DatabaseVersionStatus;
}) {
  return (
    <div className="grid gap-3">
      <VersionRow
        label={messages.appVersion}
        value={status.appVersionText}
      />
      <VersionRow
        label={messages.databaseVersion}
        rowId="database"
        value={status.actualDatabaseVersionText}
        visible={showDatabaseVersion}
        message={
          <DatabaseVersionMessage
            darkMode={darkMode}
            messages={messages}
            status={status}
          />
        }
      />
    </div>
  );
}

function VersionRow({
  label,
  rowId,
  visible = true,
  value,
  message = null,
}: {
  label: string;
  rowId?: string;
  visible?: boolean;
  value: string;
  message?: ReactNode;
}) {
  return (
    <div
      className={visible ? undefined : "hidden"}
      aria-hidden={!visible}
      data-version-row={rowId ?? label.toLowerCase().replace(/\s+/g, "-")}
    >
      <ListItemTitle>{label}</ListItemTitle>
      <ListItemDescription className="tabular-nums">
        {value}
        {message}
      </ListItemDescription>
    </div>
  );
}

function DatabaseVersionMessage({
  darkMode,
  messages,
  status,
}: {
  darkMode: boolean;
  messages: VersionStatusMessages;
  status: DatabaseVersionStatus;
}) {
  if (!status.aligned) {
    return (
      <span className={versionMismatchClass(darkMode)}> ({status.message})</span>
    );
  }

  if (!shouldShowExpectedDatabaseVersion(status)) {
    return null;
  }

  return (
    <span> ({messages.expected} {status.expectedDatabaseVersionText})</span>
  );
}

function versionMismatchClass(darkMode: boolean) {
  return darkMode ? "text-red-300" : "text-red-600";
}
