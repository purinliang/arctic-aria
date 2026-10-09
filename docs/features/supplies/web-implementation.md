# Supplies Web Implementation

Feature code lives in `apps/web/src/features/supplies`. `stock-level.ts` owns
neutral-scale compatibility, absolute save inputs and the initial/update ordering
comparator. StockLevelSlider, compact RecordCard and Disclosure are shared UI.
Native range input provides integer snapping, pointer and keyboard semantics;
the visual track uses existing design tokens.

`useSupplies.setLevel` updates optimistically and submits the existing authenticated
`saveSupply` action with expected version. Only that item locks. Duplicate submits
are rejected, failures roll back, and only confirmed values enter the account
cache. Refresh merging protects pending rows and newer versions. Old receipt-based
quantity/replacement commands remain unchanged but are not used by this UI.

Cache format remains v2. Neutral integer 0–5 configurations use sliders; other
quantities remain read-only. Metadata edits preserve existing configuration.
Travel purchases retain independent optimistic commands. No schema changes or
new migrations are needed.

Run focused tests and `./scripts/verify-web.sh`. The existing disposable schema
check remains `bash scripts/check-personal-tools-schema.sh`. Against a matching
production build, run `node apps/web/scripts/check-personal-tools.mjs`.

The mocked eight-context browser matrix covers Money, keyboard zero/refill,
optimistic rollback, per-row locking, one-write drag completion, frozen ordering
during interaction, legacy quantities, confirmed-only caches, failed refreshes,
travel isolation and responsive overflow. Screenshots are stored in
`/tmp/arctic-aria-personal-tools`.

For a local server and explicitly selected development database, from `apps/web`:

```bash
node --env-file=.env.local scripts/check-personal-tools-live.mjs --confirm-development
```

This uses real server actions and an isolated account with fixture cleanup in
`finally`. It checks expenses, default level five, empty/refill saves, reload and
non-destructive legacy metadata editing. Never target production.
