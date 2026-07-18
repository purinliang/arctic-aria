# Web Performance Notes

This document archives focused web performance investigations. It is an
engineering note, not a product behavior spec.

## Route Navigation Benchmark

Status: recorded on 2026-07-19.

The route-backed workspace navigation was compared with the previous single
`/` workspace version to check whether route support caused visible page-switch
lag.

Compared commits:

- Current route-backed workspace navigation:
  `3587bfe feat: merge route-backed workspace navigation`
- Previous single-`/` workspace baseline:
  `28cf7da Release v0.8.1: harden database migration deployment`

The baseline was tested from a separate worktree:

```bash
git worktree add /home/purinliang/arctic-aria-route-baseline 28cf7da
```

The local ignored web `.env.local` file was copied into the baseline worktree
without printing its contents. The baseline app was built and served separately
from the current app so both versions could be measured with the same
Playwright scripts.

### Scripts

The benchmark scripts live under `apps/web/scripts/`:

- `measure-routes.mjs`: full browser navigation with `page.goto(...)`.
- `measure-switches.mjs`: in-app sidebar switching with Playwright clicks.
- `measure-routes.sh`: compatibility wrapper for `measure-routes.mjs`.

Package commands:

```bash
pnpm --dir apps/web route:measure
pnpm --dir apps/web switch:measure
```

The route benchmark measures a full browser document navigation. It is useful
for direct URL entry and refresh behavior, but it does not represent normal
sidebar switching inside the authenticated app.

The switch benchmark measures the actual in-app interaction:

```text
open app
  -> sign in or create the neutral Playwright account
  -> click a visible sidebar button
  -> wait for the page heading to update
```

The benchmark uses this neutral account by default:

```text
username: playwrightuser
password: playwrightpassword
```

Override it only when a different local test account is needed:

```bash
AA_MEASURE_USERNAME=testusername AA_MEASURE_PASSWORD=testpassword pnpm --dir apps/web switch:measure
```

### Development Mode Result

Development mode was useful for explaining the perceived lag, but it was not a
fair production-performance signal because Turbopack dev compilation and route
payload behavior dominate the timing.

Current route-backed version, full browser navigation in `next dev`:

```text
Route                           OK  Failed   Average      Min      P50      P90      Max
/                               20       0     363ms    292ms    344ms    426ms    490ms
/today                          20       0     434ms    283ms    359ms    507ms   1448ms
/projects                       20       0     361ms    298ms    347ms    410ms    443ms
/projects/test-project-id       20       0     329ms    239ms    326ms    387ms    410ms
```

Current route-backed version, in-app sidebar switching in `next dev`:

```text
View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0     171ms    122ms    160ms    207ms    258ms
projects            20       0     137ms     98ms    117ms    198ms    324ms
routines            20       0     120ms    102ms    119ms    130ms    141ms
memories            20       0     122ms     81ms    124ms    137ms    167ms
ideas               20       0     208ms     96ms    199ms    292ms    331ms
settings            20       0     215ms    123ms    195ms    311ms    331ms
```

Previous single-`/` baseline, in-app sidebar switching in `next dev`:

```text
View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0     124ms     98ms    118ms    138ms    188ms
projects            20       0     122ms     80ms    108ms    140ms    333ms
routines            20       0     113ms     86ms    106ms    134ms    207ms
memories            20       0     103ms     83ms    100ms    121ms    165ms
ideas               20       0     104ms     85ms    100ms    123ms    144ms
settings            20       0     116ms     89ms    103ms    155ms    188ms
```

In development mode, the old single-`/` version switched faster. This explained
why the route-backed version felt suspicious in local development.

### Production Mode Result

Production mode used `next build` and `next start`. Only the switch benchmark
was considered important because normal product usage is sidebar/page switching,
not repeatedly refreshing direct URLs.

Current route-backed version:

```text
View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0      85ms     67ms     83ms     96ms    118ms
projects            20       0      88ms     76ms     85ms    101ms    110ms
routines            20       0      70ms     65ms     70ms     76ms     80ms
memories            20       0     103ms     78ms     89ms    153ms    178ms
ideas               20       0      81ms     64ms     79ms     91ms    115ms
settings            20       0      85ms     66ms     84ms     97ms    108ms
```

Previous single-`/` baseline:

```text
View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0      79ms     65ms     82ms     88ms    104ms
projects            20       0      82ms     65ms     81ms     89ms    117ms
routines            20       0      73ms     61ms     68ms     87ms     92ms
memories            20       0      80ms     66ms     79ms     89ms     93ms
ideas               20       0      79ms     61ms     73ms    103ms    107ms
settings            20       0      93ms     67ms     89ms    110ms    170ms
```

Production conclusion:

- Route-backed navigation did not create a meaningful production switching
  regression.
- The local lag was mostly a development-mode effect.
- Route-backed paths should stay because refresh and direct entry now preserve
  the selected workspace page.
- Future route or app-shell performance checks should use the production
  `switch:measure` benchmark before deciding to revert a navigation design.

### How To Reproduce

Build and start the current app:

```bash
pnpm --dir apps/web build
pnpm --dir apps/web exec next start --hostname 127.0.0.1 --port 3002
BASE_URL=http://127.0.0.1:3002 RUNS=20 pnpm --dir apps/web switch:measure
```

Build and start a baseline worktree:

```bash
git worktree add /home/purinliang/arctic-aria-route-baseline 28cf7da
cp apps/web/.env.local /home/purinliang/arctic-aria-route-baseline/apps/web/.env.local
pnpm --dir /home/purinliang/arctic-aria-route-baseline/apps/web install --offline
pnpm --dir /home/purinliang/arctic-aria-route-baseline/apps/web build
pnpm --dir /home/purinliang/arctic-aria-route-baseline/apps/web exec next start --hostname 127.0.0.1 --port 3003
BASE_URL=http://127.0.0.1:3003 RUNS=20 pnpm --dir apps/web switch:measure
```

Do not commit copied `.env.local` files or benchmark-created local sessions.
