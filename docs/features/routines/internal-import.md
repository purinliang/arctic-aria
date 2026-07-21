# Routine Internal Import

This document describes the internal routine import helper. It is a developer
tool for checking and saving LLM- or human-prepared routine text.

## Flow

```text
Markdown template
  -> canonical JSON
  -> typed routine command
  -> developer-only API
  -> optional database insert
```

The parse API validates without writing. The import API writes one routine to
the signed-in developer account.

## Files

- `apps/cli/templates/routine-import.md`: human-readable template.
- `apps/cli/templates/routine-import.json`: canonical JSON template.
- `apps/cli/src/parse-routine-import.ts`: Markdown or JSON parser command.
- `apps/web/src/features/developer/components/DeveloperImportToolItems.tsx`:
  developer Settings tool rows for copy-template, paste-to-parse, and
  paste-to-import tests.
- `apps/web/src/features/developer/import-template-prompts.ts`: prompt wrapper
  for copying the CLI template into an LLM.
- `apps/web/src/app/api/developer/routines/parse/route.ts`: developer-only
  parse endpoint.
- `apps/web/src/app/api/developer/routines/import/route.ts`: developer-only
  insert endpoint.

Run the parser locally with:

```sh
pnpm --dir apps/cli routine:parse -- --file templates/routine-import.md
```

## Naming

Use `parse` for validation and canonical command conversion. Use `import` only
when an API writes data to the database.

The routine APIs follow the same naming rule as project import:

```text
POST /api/developer/routines/parse
POST /api/developer/routines/import
```

`parse` returns the canonical document and normalized command. `import` writes
one routine to the signed-in administrator session account.

## Testing

Local parse test:

```sh
pnpm --dir apps/cli routine:parse -- --file templates/routine-import.md
pnpm --dir apps/cli routine:parse -- --file templates/routine-import.json
```

Developer API parse test:

1. Run the web app locally.
2. Sign in with a developer account.
3. Open Settings.
4. Use the developer-only Developer Tools panel.
5. Select Routine.
6. Click Copy Template when asking an LLM to prepare the import Markdown.
7. Paste Markdown or canonical JSON, then click Parse.

The browser developer console can also call the API directly:

```js
await fetch("/api/developer/routines/parse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(ROUTINE_IMPORT_JSON),
}).then((response) => response.json());
```

Expected success shape:

```json
{
  "ok": true,
  "routine": {
    "title": "...",
    "description": null,
    "firstStartDate": "YYYY-MM-DD",
    "endDate": null,
    "rule": {}
  }
}
```

Developer API import test:

Use the same Developer Tools panel, select Routine, paste Markdown or
canonical JSON, then click Import. The import writes to the signed-in
developer account.

The browser developer console can also call the API directly:

```js
await fetch("/api/developer/routines/import", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(ROUTINE_IMPORT_JSON),
}).then((response) => response.json());
```

Expected success shape:

```json
{
  "ok": true,
  "routineId": "..."
}
```

## Structure

One template describes one routine. Legal recurrence values are:

- `daily`
- `weekly`
- `monthly`
- `every_14_days`
- `every_30_days`
- `fixed_days`

`fixedIntervalDays` is only meaningful when recurrence is `fixed_days`. The
normalizer uses the same validation helper as the routine editor.
