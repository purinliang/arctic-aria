# Web App Agent Guide

This file applies to work under `apps/web`. Read the root `AGENTS.md` first;
this file adds web-specific source, UI, TypeScript, and verification rules.

## Required References

For web UI changes, read the relevant feature UI doc and these shared docs when
they apply:

- `docs/ui.md`
- `docs/web/ui-components.md`
- `docs/web/theme.md`
- `docs/web/sidebar.md`
- `docs/web/sidebar-ui.md`

## Source Organization

- Keep reusable web UI primitives and theme helpers in
  `apps/web/src/components/`. This includes buttons, cards, panels, dialogs,
  notifications, inputs, text, tags, lists, switches, color helpers, and
  app-shell theme helpers.
- Keep authenticated app-shell files in `apps/web/src/app-shell/`, not inside a
  product feature. App shell owns sidebar, page switching, root page title bar,
  theme mode, route guards, and app-level notifications.
- Keep product feature code under its own feature directory, such as
  `features/auth`, `features/memories`, `features/routines`, and
  `features/projects`.
- Feature pages, feature dialogs, feature panels, feature actions, feature
  repositories, and feature tests should live with that feature unless they are
  truly shared by multiple features.
- Feature component files should include one short location comment near the
  top, such as `// Memories Page - Memories Panel`, so the visible page area is
  clear during later UI refactors. If the file needs `"use client"`, keep that
  directive first and place the location comment immediately after it.
- The dashboard feature should own dashboard composition. Dashboard panels that
  summarize another feature should delegate row rendering, commands, and
  reusable panel content to that feature when practical.
- Do not create feature-local shared primitive folders. Add missing primitives
  to `apps/web/src/components/` instead.
- Do not keep dummy data after matching real feature data is available.
  Temporary dummy data must be clearly scoped to prototype-only surfaces and
  removed during the feature refactor.
- Optimistic update helpers belong near the feature whose command semantics
  they encode. Keep them in `features/dashboard` only when they are purely
  dashboard interaction helpers; move them to the product feature when they
  describe project, routine, memory, or other domain command behavior.

## TypeScript Style

- Use `import type` for imports that are used only as TypeScript types. The web
  ESLint config enforces this with separate type imports.
- Keep value imports and type imports separate. Do not mix runtime imports and
  inline `type` specifiers in the same import list when a separate type import
  is possible.
- Prefer named imports and exports. Use namespace or compatibility imports only
  when a dependency API requires them.
- Keep function signatures readable. When a parameter list wraps, put each
  parameter on its own line with a trailing comma.
- Prefer a named input object when a function needs more than three parameters,
  or when several parameters share the same primitive type. Keep positional
  parameters only when matching an existing interface or when the call remains
  clearer than an object.

## UI Component Rules

- Web UI must use the shared components under `apps/web/src/components/`.
  Creating one-off styled buttons, panels, inputs, dialogs, notifications,
  lists, cards, text, or tags inside feature pages is prohibited. If the shared
  component is missing a needed pattern, extend or add a shared UI component
  first, then use it from the feature page.
- Feature UI docs must specify both visual structure and interaction behavior:
  layout, labels, icons, responsive behavior, click/change results, pending
  state, blocking versus optimistic flow, rollback, refresh, disabled controls,
  notifications, dialogs, and what must not happen.
- Static field labels must use the shared `LabelText` style. Descriptive body
  copy must use the shared `DescriptionText` style. Supporting metadata must use
  the shared `SupportingText` style: same muted visual family as descriptions,
  one size smaller, and usually a single `A · B · C` line. Do not hand-code
  label, description, or metadata font size, line height, or muted color in
  feature rows.
- Card and panel title actions must be placed by the shared `CardHeader`.
  Feature code should pass an action component and must not hand-align header
  button top/right padding locally.
- Visible page sections should usually be named as `*Panel.tsx` components
  when they own one complete panel.
- For desktop left-right page layouts, use the shared split pattern: flexible
  left content panel and fixed `24rem` right metadata/action panel. If the
  available width cannot keep the left panel at least 20% wider than the right
  panel, stack the panels vertically. Use `aa-split-container`,
  `aa-split-panel`, and `aa-split-panel-sidebar` for this width behavior. The
  split must not equalize panel heights; left and right panels keep independent
  content-driven heights.
- Page-level minimum height and bottom breathing room belong in the app shell,
  not feature pages. Keep the authenticated content column at least `110vh`
  tall with shared bottom padding so all pages scroll consistently.
- Full route/page bodies should usually be named as `*Page.tsx` components.

## UI Interaction Defaults

- For dashboard panels and lightweight product commands, command actions should
  normally resolve the active surface immediately. Dashboard rows should stay
  lightweight and avoid edit/detail management actions unless a feature spec
  explicitly allows them.
- Checkbox-style commands are important examples of optimistic updates.
- Modal-based CRUD save/delete flows are different: close dialogs only after a
  successful backend response, and keep the dialog open when validation or
  database updates fail.
- Do not collapse multi-step detail surfaces while the user is still editing
  several controls, such as checking multiple items.
- Normal product commands should use optimistic interaction flow: the frontend
  responds immediately after click, sends the backend request, keeps a
  successful database write silent, and shows a visible error only if the
  backend or database fails.
- Lightweight product commands should allow concurrent updates when each action
  can be tracked independently. Examples include `Done`, checklist toggles, and
  `Replace` when a cached replacement candidate exists. Track pending state per
  item instead of blocking the whole panel list.
- Heavyweight flows may remain blocking when rollback would be unclear or
  closing the surface early would lose user context. Examples include login,
  registration, and save/add/edit dialog submissions.
- Failed optimistic commands should show the shared notification component, not
  a duplicated inline section error. Use a red notification at the bottom-right
  on desktop and at the bottom-center on mobile or tablet-sized viewports.
- Username/password login and registration are excluded from optimistic UI.
  Auth flows should wait for strong backend confirmation before showing success
  or opening the dashboard.
- Dashboard-visible data that is expensive or visually prominent may use a
  browser cache with stale-while-refresh behavior. Show the cached snapshot
  immediately for the signed-in user, refresh from the backend in the
  background, keep cached content visible on refresh failure, and surface the
  failure through the shared notification stack. Keep the cache keyed by Arctic
  Aria user id so different accounts do not share dashboard/sidebar snapshots.

## Localization

- English is the default language. Browser/system language may be used only
  when the user explicitly chooses the system language setting.
- Simplified Chinese is opt-in while the translation is incomplete. Label it as
  machine-translated and incomplete in the UI.
- Do not hard-code user-facing feature text in components. Add or update the
  typed message catalogs under `apps/web/src/messages/`, then pass the active
  messages into feature components.
- Shared form controls, including date and time pickers, must receive their
  labels, empty text, aria labels, and value formatting from the active form
  message catalog. Do not rely on native browser date/time picker language for
  primary UI.
- Backend actions may keep English diagnostic messages, but expected failures
  that reach the UI should include a stable result `code`. Frontend code should
  translate that code with `localizedActionMessage` and fall back to the backend
  English message only when no localized code is available.

## Environment And Generated Files

- The web app and migration runner use `NEON_POSTGRES_URL` as the database URL
  environment variable. Do not add fallback aliases for local or production
  database URLs.
- Keep `logging.serverFunctions` disabled in `next.config.ts`. Next.js
  development Server Function logs can include raw action arguments, and Arctic
  Aria actions may receive user-authored product content.
- Do not inspect, edit, restore, or report changes to
  `apps/web/next-env.d.ts`. It is generated by Next.js and intentionally
  ignored by Git.

## Verification

- Follow the root `AGENTS.md` Validation Workflow.
- During normal feature/fix/refactor branch work, run the relevant focused
  tests for the touched feature or shared area when they exist.
- Before merging back into `develop`, or when the developer asks for full
  validation, run `git diff --check`, `pnpm --dir apps/web test`,
  `pnpm --dir apps/web lint`, and `pnpm --dir apps/web build`.
- Also run the full web checks earlier when focused tests do not cover the risk
  of a shared component, app shell, server action, metadata, or runtime change.
- For docs-only changes under the web app, run at least `git diff --check`.
