const defaultRoutes = [
  "/",
  "/today",
  "/projects",
  "/projects/test-project-id",
  // "/routines",
  // "/memories",
  // "/ideas",
  // "/settings",
];

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const runs = readPositiveInteger(process.env.RUNS, 20, "RUNS");
const routes = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultRoutes;

let chromium;

try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is required for browser route measurement.");
  console.error("Install it first with: pnpm --dir apps/web add -D playwright");
  process.exit(1);
}

let browser;

try {
  browser = await chromium.launch({
    args: ["--no-sandbox"],
    headless: true,
  });
} catch (error) {
  const message = errorMessage(error);

  if (message.includes("Executable doesn't exist")) {
    console.error("Playwright Chromium is required for browser route measurement.");
    console.error("Install it first with: pnpm --dir apps/web exec playwright install chromium");
  } else {
    console.error("Playwright Chromium could not launch in this environment.");
    console.error("Run this script from a normal local terminal.");
  }

  console.error(`Failure: ${firstErrorLine(message)}`);
  process.exit(1);
}

const context = await browser.newContext();
const page = await context.newPage();

try {
  await assertReachable(page);

  console.log(`Measuring ${runs} browser navigations per route against ${baseUrl}`);
  console.log(
    "This measures full browser page navigation, not in-app History API page switching.",
  );
  console.log("");
  console.log(
    formatRow(["Route", "OK", "Failed", "Average", "Min", "P50", "P90", "Max"]),
  );

  for (const route of routes) {
    const measurements = [];
    let failed = 0;

    for (let index = 0; index < runs; index += 1) {
      const result = await measureRoute(page, route);

      if (result.ok) {
        measurements.push(result.durationMs);
      } else {
        failed += 1;
      }
    }

    console.log(formatMeasurement(route, measurements, failed));
  }
} finally {
  await browser.close();
}

function readPositiveInteger(rawValue, fallback, name) {
  if (rawValue === undefined) {
    return fallback;
  }

  if (!/^[1-9][0-9]*$/.test(rawValue)) {
    console.error(`${name} must be a positive integer.`);
    process.exit(1);
  }

  return Number(rawValue);
}

async function assertReachable(page) {
  try {
    const response = await page.goto(urlForRoute("/"), {
      waitUntil: "load",
      timeout: 30_000,
    });

    if (!response?.ok()) {
      const status = response ? response.status() : "no response";

      throw new Error(`status ${status}`);
    }
  } catch (error) {
    console.error(`Cannot reach ${baseUrl}.`);
    console.error("Start the web dev server first: pnpm --dir apps/web dev");
    console.error(`Failure: ${error instanceof Error ? error.message : "unknown"}`);
    process.exit(1);
  }
}

async function measureRoute(page, route) {
  const startedAt = performance.now();

  try {
    const response = await page.goto(urlForRoute(route), {
      waitUntil: "load",
      timeout: 30_000,
    });

    const durationMs = performance.now() - startedAt;

    return {
      ok: Boolean(response?.ok()),
      durationMs,
    };
  } catch {
    return {
      ok: false,
      durationMs: 0,
    };
  }
}

function urlForRoute(route) {
  const trimmedBaseUrl = baseUrl.replace(/\/$/, "");

  if (route === "/") {
    return `${trimmedBaseUrl}/`;
  }

  return `${trimmedBaseUrl}${route}`;
}

function formatMeasurement(route, measurements, failed) {
  if (measurements.length === 0) {
    return formatRow([route, "0", String(failed), "-", "-", "-", "-", "-"]);
  }

  const sorted = [...measurements].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return formatRow([
    route,
    String(measurements.length),
    String(failed),
    formatMs(total / sorted.length),
    formatMs(sorted[0]),
    formatMs(percentile(sorted, 50)),
    formatMs(percentile(sorted, 90)),
    formatMs(sorted.at(-1)),
  ]);
}

function percentile(sortedValues, percentileValue) {
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  const safeIndex = Math.max(0, Math.min(sortedValues.length - 1, index));

  return sortedValues[safeIndex];
}

function formatMs(value) {
  return `${Math.round(value)}ms`;
}

function formatRow(values) {
  const widths = [28, 5, 7, 9, 8, 8, 8, 8];

  return values
    .map((value, index) => {
      if (index === 0) {
        return value.padEnd(widths[index]);
      }

      return value.padStart(widths[index]);
    })
    .join(" ");
}

function errorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown";
}

function firstErrorLine(message) {
  return message.split("\n")[0] ?? "unknown";
}
