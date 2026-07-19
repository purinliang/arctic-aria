const visibleViews = [
  {
    key: "dashboard",
    labels: ["Today", "今日"],
  },
  {
    key: "projects",
    labels: ["Projects", "项目"],
  },
  {
    key: "routines",
    labels: ["Routines", "日常"],
  },
  {
    key: "memories",
    labels: ["Memories", "回忆"],
  },
  {
    key: "ideas",
    labels: ["Ideas", "想法"],
  },
  {
    key: "settings",
    labels: ["Settings", "设置"],
  },
];

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const runs = readPositiveInteger(process.env.RUNS, 20, "RUNS");
const requestedKeys = process.argv.slice(2);
const targets =
  requestedKeys.length > 0
    ? requestedKeys.map((key) => findView(key))
    : visibleViews;
const measureUser = {
  username: process.env.AA_MEASURE_USERNAME ?? "playwrightuser",
  displayName: process.env.AA_MEASURE_DISPLAY_NAME ?? "Playwright User",
  password: process.env.AA_MEASURE_PASSWORD ?? "playwrightpassword",
};

let chromium;

try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is required for app switch measurement.");
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
    console.error("Playwright Chromium is required for app switch measurement.");
    console.error("Install it first with: pnpm --dir apps/web exec playwright install chromium");
  } else {
    console.error("Playwright Chromium could not launch in this environment.");
    console.error("Run this script from a normal local terminal.");
  }

  console.error(`Failure: ${firstErrorLine(message)}`);
  process.exit(1);
}

const contextOptions = {
  viewport: {
    width: readPositiveInteger(process.env.VIEWPORT_WIDTH, 1280, "VIEWPORT_WIDTH"),
    height: readPositiveInteger(process.env.VIEWPORT_HEIGHT, 900, "VIEWPORT_HEIGHT"),
  },
};

if (process.env.STORAGE_STATE) {
  contextOptions.storageState = process.env.STORAGE_STATE;
}

const context = await browser.newContext(contextOptions);
const page = await context.newPage();

try {
  await openApp(page);
  await ensureSignedIn(page);

  if (process.env.SAVE_STORAGE_STATE) {
    await context.storageState({ path: process.env.SAVE_STORAGE_STATE });
  }

  console.log(`Measuring ${runs} in-app sidebar switches against ${baseUrl}`);
  console.log(
    "This measures visible sidebar button click to page heading update.",
  );
  console.log("");
  console.log(
    formatRow(["View", "OK", "Failed", "Average", "Min", "P50", "P90", "Max"]),
  );

  for (const target of targets) {
    const measurements = [];
    let failed = 0;

    for (let index = 0; index < runs; index += 1) {
      const setupView = setupViewFor(target);

      await switchToView(page, setupView);

      const startedAt = performance.now();
      const result = await switchToView(page, target);

      if (result.ok) {
        measurements.push(performance.now() - startedAt);
      } else {
        failed += 1;
      }
    }

    console.log(formatMeasurement(target.key, measurements, failed));
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

function findView(key) {
  const view = visibleViews.find((item) => item.key === key);

  if (!view) {
    console.error(
      `Unknown view "${key}". Use one of: ${visibleViews
        .map((item) => item.key)
        .join(", ")}.`,
    );
    process.exit(1);
  }

  return view;
}

async function openApp(page) {
  try {
    const response = await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    if (!response?.ok()) {
      const status = response ? response.status() : "no response";

      throw new Error(`status ${status}`);
    }
  } catch (error) {
    console.error(`Cannot reach ${baseUrl}.`);
    console.error("Start the web dev server first: pnpm --dir apps/web dev");
    console.error(`Failure: ${firstErrorLine(errorMessage(error))}`);
    process.exit(1);
  }
}

async function ensureSignedIn(page) {
  if (await isAppShellVisible(page)) {
    return;
  }

  const loginResult = await submitAuthRequest(page, "login");

  if (!loginResult.ok) {
    const registerResult = await submitAuthRequest(page, "register");

    if (!registerResult.ok) {
      console.error("Could not create or sign in the Playwright measurement account.");
      console.error(`Login result: ${loginResult.code ?? "unknown"}`);
      console.error(`Register result: ${registerResult.code ?? "unknown"}`);
      process.exit(1);
    }
  }

  await page.goto(baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await waitForAppShell(page);
}

async function submitAuthRequest(page, mode) {
  const body =
    mode === "register"
      ? {
          username: measureUser.username,
          displayName: measureUser.displayName,
          password: measureUser.password,
          repeatPassword: measureUser.password,
        }
      : {
          username: measureUser.username,
          password: measureUser.password,
        };

  try {
    const response = await page.context().request.post(urlForPath(`/api/auth/${mode}`), {
      data: body,
      timeout: 30_000,
    });

    return (await response.json());
  } catch (error) {
    return {
      ok: false,
      code: firstErrorLine(errorMessage(error)),
    };
  }
}

async function isAppShellVisible(page) {
  try {
    await visibleSidebarButton(page, visibleViews[0]).waitFor({
      state: "visible",
      timeout: 1_000,
    });

    return true;
  } catch {
    return false;
  }
}

async function waitForAppShell(page) {
  try {
    await visibleSidebarButton(page, visibleViews[0]).waitFor({
      state: "visible",
      timeout: 30_000,
    });
  } catch (error) {
    console.error("Sign in did not reach the app shell.");
    console.error(`Failure: ${firstErrorLine(errorMessage(error))}`);
    process.exit(1);
  }
}

function setupViewFor(target) {
  return target.key === visibleViews[0].key ? visibleViews[1] : visibleViews[0];
}

async function switchToView(page, view) {
  try {
    await visibleSidebarButton(page, view).click({ timeout: 30_000 });
    await visibleHeading(page, view).waitFor({
      state: "visible",
      timeout: 30_000,
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function visibleSidebarButton(page, view) {
  return page.locator("nav:visible").getByRole("button", {
    name: exactLabelPattern(view.labels),
  });
}

function visibleHeading(page, view) {
  return page.getByRole("heading", {
    level: 1,
    name: exactLabelPattern(view.labels),
  });
}

function exactLabelPattern(labels) {
  return new RegExp(`^(?:${labels.map(escapeRegExp).join("|")})$`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function urlForPath(path) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function formatMeasurement(view, measurements, failed) {
  if (measurements.length === 0) {
    return formatRow([view, "0", String(failed), "-", "-", "-", "-", "-"]);
  }

  const sorted = [...measurements].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return formatRow([
    view,
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
  const widths = [16, 5, 7, 9, 8, 8, 8, 8];

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
