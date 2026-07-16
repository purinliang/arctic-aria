import type { DatabaseVersionStatus } from "./app-metadata";
import { DescriptionText, LabelText, SupportingText } from "./text";

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
      <SupportingText darkMode={darkMode}>
        Database Version: {status.actualDatabaseVersionText}
        {status.aligned ? null : (
          <span className={versionMismatchClass(darkMode)}>
            {" "}
            ({status.message})
          </span>
        )}
      </SupportingText>
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
      <VersionRow
        darkMode={darkMode}
        label="Database Version"
        value={status.actualDatabaseVersionText}
        message={status.aligned ? "" : status.message}
      />
    </div>
  );
}

function VersionRow({
  darkMode,
  label,
  value,
  message = "",
}: {
  darkMode: boolean;
  label: string;
  value: string;
  message?: string;
}) {
  return (
    <div>
      <LabelText darkMode={darkMode}>{label}</LabelText>
      <DescriptionText darkMode={darkMode} className="mt-1 tabular-nums">
        {value}
        {message ? (
          <span className={versionMismatchClass(darkMode)}> ({message})</span>
        ) : null}
      </DescriptionText>
    </div>
  );
}

function versionMismatchClass(darkMode: boolean) {
  return darkMode ? "text-red-300" : "text-red-600";
}
