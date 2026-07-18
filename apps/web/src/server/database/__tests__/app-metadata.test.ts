import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveAppVersion,
  releaseVersionFromBranch,
  resolveSourceState,
} from "../../../../scripts/app-metadata.mjs";

test("app metadata uses the version in a hotfix branch name", () => {
  const branch = "agent/hotfix-v0.5.1";
  const branchVersion = releaseVersionFromBranch(branch);

  assert.equal(branchVersion, "v0.5.1");
  assert.equal(
    deriveAppVersion({
      branch,
      commit: "abc123def456",
      releaseVersion: "unknown",
      baseVersion: branchVersion,
    }),
    "v0.5.1-hotfix-v0-5-1",
  );
});

test("app metadata uses an exact release tag without a branch suffix", () => {
  assert.equal(
    deriveAppVersion({
      branch: "main",
      commit: "abc123def456",
      releaseVersion: "v0.5.1",
      baseVersion: "v0.6.0",
    }),
    "v0.5.1",
  );
});

test("app metadata treats Vercel Git deployments as clean source", () => {
  withEnv(
    {
      VERCEL_GIT_COMMIT_SHA: "abc123def456",
    },
    () => {
      assert.equal(resolveSourceState("/path/that/does/not/exist"), "clean");
    },
  );
});

test("app metadata source state override wins over Vercel metadata", () => {
  withEnv(
    {
      APP_SOURCE_STATE: "dirty",
      VERCEL_GIT_COMMIT_SHA: "abc123def456",
    },
    () => {
      assert.equal(resolveSourceState("/path/that/does/not/exist"), "dirty");
    },
  );
});

function withEnv(values: Record<string, string>, callback: () => void) {
  const previous = new Map(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );

  try {
    for (const [key, value] of Object.entries(values)) {
      process.env[key] = value;
    }

    callback();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
