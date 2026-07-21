# Routine Internal Parse

This document describes the internal routine parser. It is a developer tool for
checking LLM- or human-prepared routine text before any routine is saved.

## Flow

```text
Markdown template
  -> canonical JSON
  -> typed routine command
  -> developer-only parse API
```

The routine parse API does not insert, update, or delete database rows.

## Files

- `apps/web/templates/routine-import.md`: human-readable template.
- `apps/web/templates/routine-import.json`: canonical JSON template.
- `apps/web/scripts/parse-routine-import.ts`: Markdown or JSON parser command.
- `apps/web/src/app/api/developer/routines/parse/route.ts`: developer-only
  parse endpoint.

Run the parser locally with:

```sh
pnpm --dir apps/web routine:parse -- --file templates/routine-import.md
```

## Naming

Use `parse` for validation and canonical command conversion. Use `import` only
when an API writes data to the database.

The routine API is named `parse` because it does not create or update a routine:

```text
POST /api/developer/routines/parse
```

If routine database insertion is added later, use a separate
`POST /api/developer/routines/import` endpoint.

## Testing

Local parse test:

```sh
pnpm --dir apps/web routine:parse -- --file templates/routine-import.md
pnpm --dir apps/web routine:parse -- --file templates/routine-import.json
```

Developer API parse test:

1. Run the web app locally.
2. Sign in with a developer account.
3. Open browser developer tools on the app page.
4. Paste a canonical JSON object from `templates/routine-import.json` into this
   snippet:

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
