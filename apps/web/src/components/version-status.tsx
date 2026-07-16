import {
  shouldShowDatabaseVersion,
  shouldShowExpectedDatabaseVersion,
  type DatabaseVersionStatus,
} from "./app-metadata";
import { DescriptionText, LabelText, SupportingText } from "./text";
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
  status,
}: {
  darkMode: boolean;
  messages?: VersionStatusMessages;
  status: DatabaseVersionStatus;
}) {
  return (
    <div className="grid gap-1 text-center tabular-nums">
      <SupportingText darkMode={darkMode}>
        {messages.appVersion}: {status.appVersionText}
      </SupportingText>
      {shouldShowDatabaseVersion(status) ? (
        <SupportingText darkMode={darkMode}>
          {messages.databaseVersion}: {status.actualDatabaseVersionText}
          <DatabaseVersionMessage
            darkMode={darkMode}
            messages={messages}
            status={status}
          />
        </SupportingText>
      ) : null}
    </div>
  );
}

export function VersionStatusRows({
  darkMode,
  messages = defaultVersionStatusMessages,
  status,
}: {
  darkMode: boolean;
  messages?: VersionStatusMessages;
  status: DatabaseVersionStatus;
}) {
  return (
    <div className="grid gap-3">
      <VersionRow
        darkMode={darkMode}
        label={messages.appVersion}
        value={status.appVersionText}
      />
      {shouldShowDatabaseVersion(status) ? (
        <VersionRow
          darkMode={darkMode}
          label={messages.databaseVersion}
          value={status.actualDatabaseVersionText}
          message={
            <DatabaseVersionMessage
              darkMode={darkMode}
              messages={messages}
              status={status}
            />
          }
        />
      ) : null}
    </div>
  );
}

function VersionRow({
  darkMode,
  label,
  value,
  message = null,
}: {
  darkMode: boolean;
  label: string;
  value: string;
  message?: ReactNode;
}) {
  return (
    <div>
      <LabelText darkMode={darkMode}>{label}</LabelText>
      <DescriptionText darkMode={darkMode} className="mt-1 tabular-nums">
        {value}
        {message}
      </DescriptionText>
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
