import { execFileSync } from "node:child_process";
import path from "node:path";
import { resolveExpectedDatabaseMetadata } from "../../database/scripts/migration-metadata.mjs";

export function resolveAppMetadata(appRoot = process.cwd()) {
  const repoRoot = path.resolve(appRoot, "..", "..");
  const commit = shortCommit(
    firstDefined(
      process.env.APP_COMMIT,
      process.env.NEXT_PUBLIC_APP_COMMIT,
      process.env.VERCEL_GIT_COMMIT_SHA,
      process.env.GIT_COMMIT,
      readGitCommit(repoRoot),
    ),
  );
  const branch = firstDefined(
    process.env.APP_BRANCH,
    process.env.NEXT_PUBLIC_APP_BRANCH,
    process.env.VERCEL_GIT_COMMIT_REF,
    process.env.GIT_BRANCH,
    readGitBranch(repoRoot),
  );
  const releaseVersion = firstDefined(
    process.env.APP_RELEASE_VERSION,
    readExactReleaseTag(repoRoot),
    readHeadReleaseVersion(repoRoot),
  );
  const branchVersion = releaseVersionFromBranch(branch);
  const baseVersion = firstDefined(
    process.env.APP_BASE_VERSION,
    releaseVersion,
    branchVersion,
    nextDevelopmentVersion(branch, readLatestReleaseVersion(repoRoot)),
    "v0.0.0",
  );
  const expectedDatabase = resolveExpectedDatabaseMetadata(appRoot);

  return {
    version: firstDefined(
      process.env.APP_VERSION,
      process.env.NEXT_PUBLIC_APP_VERSION,
      deriveAppVersion({ branch, commit, releaseVersion, baseVersion }),
    ),
    commit,
    sourceState: resolveSourceState(repoRoot),
    branch,
    expectedDatabase,
  };
}

function firstDefined(...values) {
  return (
    values
      .map((value) => value?.trim())
      .find((value) => value && value.length > 0 && value !== "unknown") ??
    "unknown"
  );
}

function shortCommit(commit) {
  return commit === "unknown" ? commit : commit.slice(0, 12);
}

function readGitCommit(repoRoot) {
  return readGit(["rev-parse", "HEAD"], repoRoot);
}

function readGitBranch(repoRoot) {
  return readGit(["branch", "--show-current"], repoRoot);
}

function readExactReleaseTag(repoRoot) {
  const tag = readGit(["describe", "--tags", "--exact-match", "HEAD"], repoRoot);

  return isReleaseVersion(tag) ? tag : "unknown";
}

function readHeadReleaseVersion(repoRoot) {
  const subject = readGit(["log", "-1", "--format=%s"], repoRoot);

  return releaseVersionFromText(subject);
}

function readLatestReleaseVersion(repoRoot) {
  const taggedVersion = readGit(
    ["tag", "--merged", "HEAD", "--list", "v*", "--sort=-v:refname"],
    repoRoot,
  )
    .split(/\r?\n/)
    .find(isReleaseVersion);

  const releaseSubject = readGit(
    ["log", "--extended-regexp", "--grep=^(Release|Hotfix) v", "--format=%s", "-1"],
    repoRoot,
  );

  return latestReleaseVersion(taggedVersion, releaseVersionFromText(releaseSubject));
}

export function latestReleaseVersion(...versions) {
  return versions.filter(isReleaseVersion).sort((left, right) => {
    const leftParts = left.slice(1).split(".").map(Number);
    const rightParts = right.slice(1).split(".").map(Number);
    for (let index = 0; index < 3; index += 1) {
      if (leftParts[index] !== rightParts[index]) {
        return rightParts[index] - leftParts[index];
      }
    }
    return 0;
  })[0] ?? "unknown";
}

function readGitSourceState(repoRoot) {
  const status = readGit(["status", "--porcelain"], repoRoot);

  if (status === "unknown") {
    return "unknown";
  }

  return status.length > 0 ? "dirty" : "clean";
}

export function resolveSourceState(repoRoot) {
  return firstDefined(
    process.env.APP_SOURCE_STATE,
    process.env.NEXT_PUBLIC_APP_SOURCE_STATE,
    readVercelSourceState(),
    readGitSourceState(repoRoot),
  );
}

function readVercelSourceState() {
  if (process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.VERCEL === "1") {
    return "clean";
  }

  return "unknown";
}

function readGit(args, repoRoot) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export function deriveAppVersion({
  branch,
  commit,
  releaseVersion,
  baseVersion,
}) {
  if (isReleaseVersion(releaseVersion)) {
    return releaseVersion;
  }

  const suffix = versionBranchSuffix(branch);
  const version = suffix ? `${baseVersion}-${suffix}` : `${baseVersion}-dev`;

  return commit === "unknown" ? version : version;
}

export function releaseVersionFromBranch(branch) {
  return releaseVersionFromText(branch);
}

function versionBranchSuffix(branch) {
  if (!branch || branch === "unknown" || branch === "main") {
    return "";
  }

  if (branch === "develop") {
    return "dev";
  }

  return branch
    .replace(/^agent\//, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function releaseVersionFromText(text) {
  const match = text.match(/\bv\d+\.\d+\.\d+\b/);
  const version = match?.[0];

  return version && isReleaseVersion(version) ? version : "unknown";
}

function isReleaseVersion(version) {
  return /^v\d+\.\d+\.\d+$/.test(version);
}

export function nextDevelopmentVersion(branch, version) {
  if (!isReleaseVersion(version)) {
    return "unknown";
  }

  const [, major, minor, patch] = version.match(/^v(\d+)\.(\d+)\.(\d+)$/) ?? [];

  if (major === undefined || minor === undefined) {
    return "unknown";
  }

  return branch.startsWith("hotfix/")
    ? `v${major}.${minor}.${Number(patch) + 1}`
    : `v${major}.${Number(minor) + 1}.0`;
}
