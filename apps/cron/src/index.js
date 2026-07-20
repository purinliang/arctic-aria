const scheduledDiscordNotificationsPath = "/api/cron/discord-notifications";

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      runAndLogScheduledCron({
        cron: controller.cron,
        env,
        fetcher: fetch,
        scheduledTime: controller.scheduledTime,
      }),
    );
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        target: safeTargetDescription(env.ARCTIC_ARIA_WEB_BASE_URL),
      });
    }

    return Response.json({ error: "Not found." }, { status: 404 });
  },
};

async function runAndLogScheduledCron(input) {
  try {
    const result = await invokeScheduledWebCron(input);

    console.log("[cron]", "run_finished", result);
    return result;
  } catch (error) {
    console.error("[cron]", "run_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export async function invokeScheduledWebCron({
  cron = "manual",
  env,
  fetcher = fetch,
  scheduledTime = Date.now(),
}) {
  const targetUrl = buildCronTargetUrl(env.ARCTIC_ARIA_WEB_BASE_URL);
  const secret = readRequiredValue(env.CRON_SECRET, "CRON_SECRET");
  const startedAt = Date.now();
  const response = await fetcher(targetUrl, {
    headers: {
      authorization: `Bearer ${secret}`,
      "x-arctic-aria-cron": cron,
      "x-arctic-aria-scheduled-time": String(scheduledTime),
      "x-arctic-aria-scheduler": "cloudflare-worker",
    },
    method: "GET",
  });
  const elapsedMs = Date.now() - startedAt;
  const result = {
    elapsedMs,
    ok: response.ok,
    status: response.status,
    target: safeTargetDescription(targetUrl),
  };

  if (!response.ok) {
    throw new Error(`Web cron failed with status ${response.status}.`);
  }

  return result;
}

export function buildCronTargetUrl(webBaseUrl) {
  const baseUrl = readRequiredValue(
    webBaseUrl,
    "ARCTIC_ARIA_WEB_BASE_URL",
  );
  const url = new URL(baseUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("ARCTIC_ARIA_WEB_BASE_URL must be an HTTP(S) URL.");
  }

  url.pathname = joinUrlPaths(url.pathname, scheduledDiscordNotificationsPath);
  url.search = "";
  url.hash = "";

  return url.toString();
}

function joinUrlPaths(basePath, targetPath) {
  const normalizedBase = basePath.replace(/\/+$/, "");

  return `${normalizedBase}/${targetPath.replace(/^\/+/, "")}`;
}

function readRequiredValue(value, name) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    throw new Error(`${name} is not configured.`);
  }

  return trimmed;
}

function safeTargetDescription(value) {
  try {
    const url = new URL(value);

    return `${url.origin}${url.pathname}`;
  } catch {
    return "unconfigured";
  }
}
