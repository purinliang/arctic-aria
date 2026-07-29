# CLI App

`apps/cli` is reserved for future local developer workflows. It is separate
from `apps/web` because generated files, local tokens, and command-line
workflows should not become web runtime concerns.

## Current State

There are no active CLI commands. The previous import templates and parse-only
helper duplicated the retired web Developer Tools import flow and were removed.
Project tree template editing now lives in the Projects web UI.

## Local Files

`apps/cli/.env.local` and `apps/cli/data/*` are ignored by Git. Use them later
for local API hosts, generated drafts, or a CLI binding token.

Do not store real binding tokens in tracked files.

## Future Binding

A future remote CLI import flow should use a dedicated CLI binding mechanism:

```text
Settings developer panel
  -> generate one-time CLI binding code
  -> CLI exchanges code for a local token
  -> CLI stores token outside Git
  -> API resolves token to an Arctic Aria account
```

This should be separate from Discord binding. Discord binding authorizes a
Discord account; CLI binding would authorize data writes.
