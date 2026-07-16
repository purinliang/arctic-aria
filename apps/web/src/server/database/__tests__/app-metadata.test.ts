import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveAppVersion,
  releaseVersionFromBranch,
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
