#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

git diff --check
pnpm --dir apps/web test
pnpm --dir apps/web lint
pnpm --dir apps/web build
