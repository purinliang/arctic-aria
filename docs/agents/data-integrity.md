# Agent Data Integrity Guide

Read this guide when changing backend validation, persistence, migrations, or
database-backed commands. The root `AGENTS.md` still applies.

## Backend Behavior

- Normalize form-shaped input before persistence. Empty optional relation ids
  must become `null`, not empty strings.
- Treat empty strings, `null`, blank-only strings, unsupported characters, and
  malformed identifiers as separate validation cases. Trim only when field
  semantics allow it, and reject unsupported characters with a clear message.
- Parameterize SQL. Never interpolate user-provided values, identifiers,
  filters, sort keys, or raw search text. Whitelist dynamic SQL fragments.
- Distinguish expected business failures from database or infrastructure
  defects. Return specific messages for validation, ownership, not-found, and
  constraint cases; keep unexpected defects identifiable.
- For unexpected errors, prefer structured server logs with feature, command,
  error code, and safe identifiers. Never log secrets, auth cookies, full
  database URLs, or raw user-authored product content.

## Persistence Rules

- Inspect migration history and repository tests for related constraints,
  nullable fields, foreign keys, and delete/archive behavior before changing
  persistence.
- Feature overviews own hierarchy, ownership, cross-feature interaction,
  dashboard behavior, and code ownership. Feature `data-model.md` files own
  persistent entities, schema direction, backend validation, and constraints.
- Use frontend validation for guidance, backend validation for trusted
  user-facing rules, and database constraints for final consistency.
- Protect cross-row invariants in the database where practical: foreign keys,
  unique constraints, check constraints, and transactions for multi-row writes.
  Preflight reads alone cannot prevent concurrent uniqueness or reference bugs.
- Prefer archive or soft-delete for parent-child product data. If hard delete
  is needed, refuse deletion of non-empty parents by default unless an explicit
  cascade cleanup is documented.
- Document delete lifecycle in feature `data-model.md`: archive, soft delete,
  hard delete, refused delete, and whether hidden rows remain queryable.
- Translate known database constraint failures into clear user-facing messages.
- Redis or another cache may accelerate checks, but the database is the source
  of truth for product integrity.
- Document credential behavior in auth and infrastructure docs. Hashes cannot
  be decrypted. Do not store secrets in product tables without a dedicated
  secret-storage design.
