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

The parse API validates without writing. The import API writes one or more
routines to the signed-in developer account.

## Files

- `apps/cli/templates/routine-import.md`: human-readable template kept for
  future CLI work and checked against the web copy-template text.
- `apps/cli/templates/routine-import.json`: canonical JSON example kept for
  future CLI work.
- `apps/web/src/features/developer/components/DeveloperImportToolItems.tsx`:
  developer Settings tool rows for copy-template, paste-to-parse, and
  paste-to-import tests.
- `apps/web/src/features/developer/import-template-prompts.ts`: prompt wrapper
  and template text copied into an LLM.
- `apps/web/src/app/api/developer/routines/parse/route.ts`: developer-only
  parse endpoint.
- `apps/web/src/app/api/developer/routines/import/route.ts`: developer-only
  insert endpoint.

## Naming

Use `parse` for validation and canonical command conversion. Use `import` only
when an API writes data to the database.

The routine APIs follow the same naming rule as project import:

```text
POST /api/developer/routines/parse
POST /api/developer/routines/import
```

`parse` returns the canonical document(s) and normalized command(s). `import`
writes routine(s) to the signed-in administrator session account.

## Testing

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
  "routineId": "...",
  "routineIds": ["..."],
  "importedCount": 1
}
```

## Structure

One `Routine:` block describes one routine. Repeat the `Routine:` heading to
import multiple routines. A line with `---` is optional and only acts as a
visual separator.

Legal recurrence values are:

- `once`
- `daily`
- `weekly`
- `monthly`
- `yearly`
- `every_14_days`
- `every_30_days`
- `fixed_days`

`fixedIntervalDays` is only meaningful when recurrence is `fixed_days`. The
normalizer uses the same validation helper as the routine editor.
