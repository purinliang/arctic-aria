import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCronTargetUrl,
  invokeScheduledWebCron,
} from "./index.js";

test("buildCronTargetUrl appends the scheduled web cron path", () => {
  assert.equal(
    buildCronTargetUrl("https://arctic-aria.vercel.app"),
    "https://arctic-aria.vercel.app/api/cron/discord-notifications",
  );
  assert.equal(
    buildCronTargetUrl("http://localhost:3000/"),
    "http://localhost:3000/api/cron/discord-notifications",
  );
});

test("buildCronTargetUrl rejects missing or unsupported base urls", () => {
  assert.throws(
    () => buildCronTargetUrl(""),
    /ARCTIC_ARIA_WEB_BASE_URL is not configured/,
  );
  assert.throws(
    () => buildCronTargetUrl("ftp://example.com"),
    /must be an HTTP\(S\) URL/,
  );
});

test("invokeScheduledWebCron calls the web cron route with the cron secret", async () => {
  const calls = [];
  const result = await invokeScheduledWebCron({
    cron: "*/15 * * * *",
    env: {
      ARCTIC_ARIA_WEB_BASE_URL: "https://example.com",
      CRON_SECRET: "test-secret",
    },
    fetcher: async (url, init) => {
      calls.push({ init, url });
      return new Response("{}", { status: 200 });
    },
    scheduledTime: 123,
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    "https://example.com/api/cron/discord-notifications",
  );
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.headers.authorization, "Bearer test-secret");
  assert.equal(calls[0].init.headers["x-arctic-aria-cron"], "*/15 * * * *");
  assert.equal(calls[0].init.headers["x-arctic-aria-scheduled-time"], "123");
  assert.equal(
    calls[0].init.headers["x-arctic-aria-scheduler"],
    "cloudflare-worker",
  );
});

test("invokeScheduledWebCron fails when the web route fails", async () => {
  await assert.rejects(
    invokeScheduledWebCron({
      env: {
        ARCTIC_ARIA_WEB_BASE_URL: "https://example.com",
        CRON_SECRET: "test-secret",
      },
      fetcher: async () => new Response("failed", { status: 502 }),
    }),
    /Web cron failed with status 502/,
  );
});
