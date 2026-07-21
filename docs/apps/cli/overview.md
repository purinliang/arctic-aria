# CLI App

`apps/cli` contains command-line tooling for local developer workflows. It is
separate from `apps/web` because parsing templates, storing local generated
files, and future remote import commands are CLI concerns, not web runtime
concerns.

## Current Commands

```sh
pnpm --dir apps/cli project:parse -- --file templates/project-import.md
pnpm --dir apps/cli routine:parse -- --file templates/routine-import.md
```

The current commands parse Markdown or JSON templates and print canonical JSON.
They do not call the web API.

## Local Files

`apps/cli/.env.local` and `apps/cli/data/*` are ignored by Git. Use them later
for local API hosts, generated template drafts, or a CLI binding token.

Do not store real binding tokens in tracked template files.

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
