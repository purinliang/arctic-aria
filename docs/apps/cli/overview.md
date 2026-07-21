# CLI App

`apps/cli` is reserved for local developer workflows and future remote import
commands. It is separate from `apps/web` because generated files, local tokens,
and command-line workflows should not become web runtime concerns.

## Current State

There are no active CLI commands. The previous parse-only helper duplicated the
web Developer Tools import flow and was removed.

The current project and routine import workflow lives in the web Settings
Developer Tools panel and the protected developer APIs.

The `templates/` directory keeps Markdown and JSON examples for future CLI
work. The Markdown templates are checked against the web copy-template text, so
they should stay aligned.

## Local Files

`apps/cli/.env.local` and `apps/cli/data/*` are ignored by Git. Use them later
for local API hosts, generated template drafts, or a CLI binding token.

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
