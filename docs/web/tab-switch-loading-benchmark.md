# Web Tab Switch Loading Benchmark

This document archives focused tab switch loading benchmark runs. It measures
the user-visible delay after clicking a sidebar tab until the target page
heading is visible.

This is not a generic web performance summary. Full route loading, direct URL
entry, refresh behavior, backend command latency, and visual polish are
separate concerns.

## Benchmark Files

The benchmark is intentionally small and focused.

- `apps/web/scripts/measure-switches.mjs`
  - Playwright-based tab switch benchmark.
  - Opens the app in a browser context.
  - Signs in or creates the neutral measurement account.
  - Clicks visible sidebar tabs.
  - Measures from click start to target page heading visibility.
  - Prints per-view `OK`, `Failed`, `Average`, `Min`, `P50`, `P90`, and `Max`.
  - Supports English and Simplified Chinese sidebar labels so localization does
    not break the measurement.
- `apps/web/package.json`
  - Exposes the benchmark as `switch:measure`.
  - Keep this as the documented entry point.

```bash
pnpm --dir apps/web switch:measure
```

## Benchmark Method

The script measures the real in-app interaction:

```text
open app
  -> sign in or create the neutral Playwright account
  -> click a visible sidebar tab
  -> wait for the page heading to update
```

The benchmark uses this neutral account by default:

```text
username: playwrightuser
password: playwrightpassword
```

When evaluating route-backed navigation, always compare against a no-route
single-`/` baseline. Comparing only one `/route` implementation against another
misses the core product question: whether refresh-safe paths are worth any tab
switch loading cost compared with the original no-route workspace.

Do not commit local environment files or benchmark-created local sessions.

## A/B/C Comparison

Status: recorded on 2026-07-19.

Each version was measured with `RUNS=20` per view.

| Label | Commit | Commit message | Navigation model |
| --- | --- | --- | --- |
| A | `28cf7dae90ec10d5be37640779a7ef6b49b194fd` | `Release v0.8.1: harden database migration deployment` | No-route single-`/` workspace |
| B | `253554390f919e30bae5e2e479eee91f56668434` | `feat: add route-backed web navigation` | First route-backed App Router pages |
| C | `395c37d637b9a055bfa0c05cf956e13f3b43634b` | `chore: merge web performance benchmarks` | Current rewrite-backed route navigation |

### Solution A: No-Route Single-`/` Workspace

Solution A keeps the authenticated workspace behind the single `/` route. The
sidebar changes an internal selected view state instead of navigating to a
different browser path.

Strengths:

- Fastest raw tab switch in both measured environments.
- No extra App Router page compilation during local tab switches.
- Simple app-shell state because every workspace tab is rendered under the same
  route.

Weaknesses:

- Refresh does not preserve the selected workspace page.
- Direct entry into `/projects`, `/memories`, `/settings`, and similar paths is
  not supported as a first-class product behavior.
- Browser history and URL state do not describe the current workspace tab.

This is the performance control group. It is useful for deciding whether route
support has introduced a real user-visible cost.

### Solution B: First Route-Backed App Router Pages

Solution B gives each workspace tab a real route, such as `/today`,
`/projects`, `/routines`, `/memories`, `/ideas`, and `/settings`. The app uses
separate App Router page files for these workspace surfaces.

Strengths:

- Refresh and direct entry preserve the selected workspace page.
- Browser history and visible URLs match the current workspace tab.
- The mental model is straightforward: each page has its own route.

Weaknesses:

- Slowest measured option in both `next dev` and production.
- `next dev` pays separate route compilation costs, which created the visible
  local lag.
- Production tab switches were also slower than the no-route baseline.

This solution should not be restored. It solved refresh-safe paths, but the
implementation cost was too high compared with A and C.

### Solution C: Rewrite-Backed Route Navigation

Solution C keeps refresh-safe workspace URLs while avoiding separate workspace
route files for normal tab rendering. The route is preserved for the browser,
but the app shell still behaves closer to the single-workspace model.

Strengths:

- Keeps refresh-safe paths.
- Keeps direct route entry for normal workspace tabs.
- Much closer to A than B in development mode.
- Nearly equal to A in production tab switch timing.

Weaknesses:

- Still not the fastest raw option; A remains the speed baseline.
- The routing design is less obvious than either pure single-route or pure
  App Router page routing, so it must stay documented.

This is the preferred current tradeoff. It keeps the user-facing route behavior
we wanted while avoiding the worst lag from B.

### Development Mode

Development mode used `next dev`.

```text
A: 28cf7da no-route baseline

View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0     135ms     99ms    132ms    164ms    220ms
projects            20       0     125ms     78ms    119ms    173ms    202ms
routines            20       0     109ms     78ms    104ms    133ms    152ms
memories            20       0     103ms     82ms    103ms    114ms    132ms
ideas               20       0     100ms     82ms    100ms    116ms    120ms
settings            20       0     117ms     91ms    110ms    134ms    186ms
```

```text
B: 2535543 first route-backed implementation

View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0     265ms    111ms    190ms    326ms   1447ms
projects            20       0     220ms    174ms    197ms    311ms    314ms
routines            20       0     346ms    161ms    213ms    338ms   2503ms
memories            20       0     279ms    115ms    182ms    400ms   1421ms
ideas               20       0     356ms    194ms    258ms    356ms   1991ms
settings            20       0     343ms    168ms    201ms    323ms   2457ms
```

```text
C: 395c37d current rewrite-backed route navigation

View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0     171ms    127ms    154ms    213ms    303ms
projects            20       0     143ms     82ms    141ms    185ms    298ms
routines            20       0     142ms    115ms    137ms    165ms    201ms
memories            20       0     127ms     84ms    126ms    145ms    212ms
ideas               20       0     127ms     79ms    122ms    167ms    206ms
settings            20       0     143ms    111ms    140ms    169ms    189ms
```

Development conclusion:

- Fastest: A, the no-route single-`/` workspace.
- Slowest: B, the first route-backed App Router implementation.
- C is much closer to A than B in dev mode. It keeps refresh-safe paths while
  avoiding the worst first-route implementation lag.
- B showed route compilation outliers above one second, with a max around
  `2.5s`. That was the visible local lag the developer noticed.

### Production Build/Start

Production mode used `next build` followed by `next start`.

```text
A: 28cf7da no-route baseline

View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0      89ms     61ms     85ms    100ms    178ms
projects            20       0      81ms     64ms     80ms     93ms    102ms
routines            20       0      83ms     65ms     78ms    109ms    137ms
memories            20       0      77ms     66ms     73ms     90ms    102ms
ideas               20       0      75ms     61ms     76ms     84ms     93ms
settings            20       0      84ms     66ms     82ms     94ms    112ms
```

```text
B: 2535543 first route-backed implementation

View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0     123ms     95ms    115ms    159ms    186ms
projects            20       0     106ms     78ms    106ms    120ms    131ms
routines            20       0     107ms     76ms    104ms    122ms    142ms
memories            20       0     111ms     90ms    109ms    126ms    137ms
ideas               20       0     103ms     81ms    103ms    116ms    130ms
settings            20       0     116ms     86ms    117ms    129ms    137ms
```

```text
C: 395c37d current rewrite-backed route navigation

View                OK  Failed   Average      Min      P50      P90      Max
dashboard           20       0      89ms     69ms     83ms    103ms    114ms
projects            20       0      77ms     64ms     76ms     85ms     92ms
routines            20       0      85ms     74ms     85ms     92ms    104ms
memories            20       0      85ms     67ms     82ms    102ms    106ms
ideas               20       0      81ms     63ms     81ms     90ms    108ms
settings            20       0      93ms     75ms     88ms    109ms    121ms
```

Production conclusion:

- Fastest raw tab switch: A, the no-route single-`/` workspace.
- Best current tradeoff: C, the rewrite-backed route navigation. It is very
  close to A in production while preserving refresh-safe workspace paths.
- B should not be restored. It is slower in both dev and production.

## How To Reproduce

Run the benchmark against the already-started target web server:

```bash
pnpm --dir apps/web switch:measure
```
