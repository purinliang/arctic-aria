# Daily Web Implementation

- Page and dialogs: `apps/web/src/features/daily-life/components/`.
- Feature hooks: `apps/web/src/features/daily-life/hooks/`.
- Actions: `apps/web/src/features/daily-life/actions.ts`.
- Services/repositories: `apps/web/src/features/daily-life/server/`.
- Calendar helpers and validation: `life-calendar.ts`, `life-validation.ts`.
- Shared clickable cards: `apps/web/src/components/action-card.tsx`.
- Localized copy: `apps/web/src/messages/daily-life-messages.ts`.
- Navigation: app-shell route map, Sidebar, and Next.js rewrite for `/daily`.

The feature loads only when its page is mounted. Entries do not share the
dashboard browser cache. Feature hooks protect concurrent quick captures and
keep local mutations when a refresh response arrives later. Chat capture is
blocking and replay-safe; it uses no model or external AI SDK.

Focused verification:

```bash
pnpm --dir apps/web exec node --test src/features/daily-life/__tests__/*.test.ts
```

Run `./scripts/verify-web.sh` for full integration verification. Migration 0035
must be applied to the intended database before using persisted capture or chat.
Do not silently migrate the configured app database while previewing UI changes.

Repeatable isolated schema and browser checks:

```bash
bash scripts/check-daily-life-schema.sh
pnpm --dir apps/web build
pnpm --dir apps/web exec next start -p 3001
node apps/web/scripts/check-daily-life.mjs
```

The schema check creates and removes a temporary PostgreSQL 18 Docker container
without publishing a port or contacting the app database. The browser check uses
the production action manifest and mocks all server actions; it must target a
preview of the matching build. It covers desktop/mobile, both themes/languages,
capture, placeholder chat, editing, reload, and rollback. Screenshots default to
`/tmp/arctic-aria-daily`; `BASE_URL` and `SCREENSHOT_DIR` can override these.
