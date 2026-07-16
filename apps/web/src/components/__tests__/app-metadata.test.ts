import assert from "node:assert/strict";
import test from "node:test";
import {
  appMetadataVersionText,
  defaultDatabaseVersionStatus,
  shouldShowDatabaseVersion,
  shouldShowExpectedDatabaseVersion,
  type AppMetadata,
} from "../app-metadata.ts";

function metadata(overrides: Partial<AppMetadata>): AppMetadata {
  return {
    version: "v0.6.0-dev",
    commit: "abc123def456",
    sourceState: "clean",
    branch: "develop",
    expectedDatabase: {
      migrationCount: 9,
      latestMigrationName: "0009_add_project_sidebar_pins.sql",
      schemaHash: "4b4173a36c56",
    },
    ...overrides,
  };
}

test("app metadata hides the commit for exact release versions", () => {
  assert.equal(
    appMetadataVersionText(
      metadata({
        version: "v0.5.0",
        commit: "0c09000a26a6",
        branch: "main",
      }),
    ),
    "v0.5.0",
  );
});

test("app metadata appends the commit for non-release versions", () => {
  assert.equal(
    appMetadataVersionText(
      metadata({
        version: "v0.6.0-dev",
        commit: "abc123def456",
        branch: "develop",
      }),
    ),
    "v0.6.0-dev-abc123def456",
  );
});

test("database version is silent for aligned exact release versions", () => {
  const status = defaultDatabaseVersionStatus(
    metadata({
      version: "v0.5.0",
      commit: "0c09000a26a6",
      branch: "main",
    }),
  );

  assert.equal(shouldShowDatabaseVersion(status), false);
  assert.equal(shouldShowExpectedDatabaseVersion(status), false);
});

test("database version shows expected hash for aligned development versions", () => {
  const status = defaultDatabaseVersionStatus();

  assert.equal(shouldShowDatabaseVersion(status), true);
  assert.equal(shouldShowExpectedDatabaseVersion(status), true);
});

test("database version shows mismatches for exact release versions", () => {
  const status = {
    ...defaultDatabaseVersionStatus(
      metadata({
        version: "v0.5.0",
        commit: "0c09000a26a6",
        branch: "main",
      }),
    ),
    aligned: false,
    message: "expected 4b4173a36c56; database schema is behind",
  };

  assert.equal(shouldShowDatabaseVersion(status), true);
  assert.equal(shouldShowExpectedDatabaseVersion(status), false);
});
