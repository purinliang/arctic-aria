import { execFileSync } from "node:child_process";
import path from "node:path";

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

  return {
    version: firstDefined(
      process.env.APP_VERSION,
      process.env.NEXT_PUBLIC_APP_VERSION,
      "development",
    ),
    commit,
    sourceState: firstDefined(
      process.env.APP_SOURCE_STATE,
      process.env.NEXT_PUBLIC_APP_SOURCE_STATE,
      readGitSourceState(repoRoot),
    ),
  };
}

function firstDefined(...values) {
  return (
    values
      .map((value) => value?.trim())
      .find((value) => value && value.length > 0) ?? "unknown"
  );
}

function shortCommit(commit) {
  return commit === "unknown" ? commit : commit.slice(0, 12);
}

function readGitCommit(repoRoot) {
  return readGit(["rev-parse", "HEAD"], repoRoot);
}

function readGitSourceState(repoRoot) {
  const status = readGit(["status", "--porcelain"], repoRoot);

  if (status === "unknown") {
    return "unknown";
  }

  return status.length > 0 ? "dirty" : "clean";
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
