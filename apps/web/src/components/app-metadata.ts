export type AppMetadata = {
  version: string;
  commit: string;
  sourceState: string;
};

export function getAppMetadata(): AppMetadata {
  return {
    version: readMetadata("NEXT_PUBLIC_APP_VERSION"),
    commit: readMetadata("NEXT_PUBLIC_APP_COMMIT"),
    sourceState: readMetadata("NEXT_PUBLIC_APP_SOURCE_STATE"),
  };
}

export function appMetadataLabel(metadata: AppMetadata) {
  return [
    metadata.version === "unknown" ? "" : metadata.version,
    metadata.commit === "unknown" ? "" : metadata.commit,
    metadata.sourceState === "unknown" ? "" : metadata.sourceState,
  ]
    .filter(Boolean)
    .join(" · ");
}

function readMetadata(key: string) {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : "unknown";
}
