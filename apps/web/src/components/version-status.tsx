import {
  shouldShowDatabaseVersion,
  shouldShowExpectedDatabaseVersion,
  type DatabaseVersionStatus,
} from "./app-metadata";
import { DescriptionText, LabelText, SupportingText } from "./text";
import type { ReactNode } from "react";

export function VersionStatusSupport({
  darkMode,
  status,
}: {
  darkMode: boolean;
  status: DatabaseVersionStatus;
}) {
  return (
    <div className="grid gap-1 text-center tabular-nums">
      <SupportingText darkMode={darkMode}>
        App Version: {status.appVersionText}
      </SupportingText>
      {shouldShowDatabaseVersion(status) ? (
        <SupportingText darkMode={darkMode}>
          Database Version: {status.actualDatabaseVersionText}
          <DatabaseVersionMessage darkMode={darkMode} status={status} />
        </SupportingText>
      ) : null}
    </div>
  );
}

export function VersionStatusRows({
  darkMode,
  status,
}: {
  darkMode: boolean;
  status: DatabaseVersionStatus;
}) {
  return (
    <div className="grid gap-3">
      <VersionRow
        darkMode={darkMode}
        label="App Version"
        value={status.appVersionText}
      />
      {shouldShowDatabaseVersion(status) ? (
        <VersionRow
          darkMode={darkMode}
          label="Database Version"
          value={status.actualDatabaseVersionText}
          message={
            <DatabaseVersionMessage darkMode={darkMode} status={status} />
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
  status,
}: {
  darkMode: boolean;
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
    <span> (expected {status.expectedDatabaseVersionText})</span>
  );
}

function versionMismatchClass(darkMode: boolean) {
  return darkMode ? "text-red-300" : "text-red-600";
}
