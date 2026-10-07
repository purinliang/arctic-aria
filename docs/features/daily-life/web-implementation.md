# Progress Web Implementation

- Page and dialogs: `apps/web/src/features/daily-life/components/`.
- Feature hooks: `apps/web/src/features/daily-life/hooks/`.
- Actions: `apps/web/src/features/daily-life/actions.ts`.
- Services/repositories: `apps/web/src/features/daily-life/server/`.
- Calendar helpers, duration totals, and validation: `life-calendar.ts`, `life-validation.ts`.
- Seven-day chart: `components/DurationChart.tsx` (CSS bars with accessible day buttons).
- Shared clickable cards: `apps/web/src/components/action-card.tsx`.
- Localized copy: `apps/web/src/messages/daily-life-messages.ts`.
- Navigation: app-shell route map, Sidebar, and Next.js rewrite for `/progress`.
  The former `/daily` route redirects to `/progress`.

The feature loads only when its page is mounted. Entries do not share the
dashboard browser cache. Feature hooks keep local mutations when a refresh
response arrives later. Duration saves are blocking and replay-safe. Chat capture is
blocking and replay-safe; it uses no model or external AI SDK. The frontend does
not currently mount the chat panel or request its history.

Focused verification:

```bash
pnpm --dir apps/web exec node --test src/features/daily-life/__tests__/*.test.ts
```

Run `./scripts/verify-web.sh` for full integration verification. Migrations 0035 and 0036
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
duration recording, chart totals/day selection, chat absence with no requests,
editing, reload, failed-save retry, and no horizontal overflow. Screenshots default to
`/tmp/arctic-aria-daily`; `BASE_URL` and `SCREENSHOT_DIR` can override these.
