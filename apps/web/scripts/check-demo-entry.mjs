import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

// Mock auth and metadata: no credentials reach a backend or database.
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3004";
const manifest = JSON.parse(await readFile(
  new URL("../.next/server/server-reference-manifest.json", import.meta.url),
  "utf8",
));
const names = new Map(Object.entries(manifest.node).map(([id, action]) => [id, action.exportedName]));
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) {
    for (const language of ["en", "zh-CN"]) {
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({ viewport: { width, height: 844 } });
        await context.addInitScript(({ language, theme }) => {
          localStorage.setItem("arctic-aria.language-preference", language);
          localStorage.setItem("arctic-aria.theme-preference", theme);
          window.authFormMounted = false;
          window.watchAuthForm = true;
          new MutationObserver((records) => {
            if (!window.watchAuthForm) return;
            for (const record of records) for (const node of record.addedNodes) {
              if (node instanceof Element && (
                node.matches('input[type="password"]') ||
                node.querySelector('input[type="password"]')
              )) window.authFormMounted = true;
            }
          }).observe(document, { childList: true, subtree: true });
        }, { language, theme });
        const failures = [];
        let attempts = 0;
        await context.route("**/*", async (route) => {
          const request = route.request();
          if (new URL(request.url()).pathname === "/api/auth/login") {
            attempts++;
            await route.fulfill({ json: {
              ok: false, code: "auth_request_failed", category: "server", message: "Unavailable",
            } });
            return;
          }
          const id = request.headers()["next-action"];
          if (!id) return route.continue();
          const name = names.get(id);
          let result;
          if (name === "getCurrentUser") {
            await new Promise((resolve) => setTimeout(resolve, 150));
            result = null;
          } else if (name === "getPublicVersionStatus") {
            result = { appVersionText: "test", actualDatabaseVersionText: "test", expectedDatabaseVersionText: "test", aligned: true, message: "" };
          } else {
            failures.push(`Unexpected action: ${name}`);
            result = null;
          }
          await route.fulfill({ contentType: "text/x-component", body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
        });
        const page = await context.newPage();
        page.on("pageerror", (error) => failures.push(error.message));
        await page.goto(`${baseUrl}/?demo=true&source=portfolio#preview`);
        await page.waitForFunction(() => !new URL(location.href).searchParams.has("demo"));
        await page.getByRole("status").filter({ hasText: language === "en" ? "Trying demo" : "正在体验" }).waitFor();
        assert.equal(await page.evaluate(() => window.authFormMounted), false, "no credential form between session and demo loading");
        assert.equal(attempts, 0, "demo delay precedes login request");
        await page.waitForTimeout(500);
        assert.equal(await page.evaluate(() => window.authFormMounted), false);
        await page.evaluate(() => { window.watchAuthForm = false; });
        await page.locator('input[type="password"]').waitFor();
        assert.equal(attempts, 1, "failure returns to normal sign-in");
        assert.equal(new URL(page.url()).searchParams.get("source"), "portfolio");
        assert.equal(new URL(page.url()).hash, "#preview");
        await page.waitForTimeout(2200);
        assert.equal(attempts, 1, "consumed parameter must not retry");
        assert.deepEqual(failures, []);
        await context.close();
        console.log(`Demo entry passed: ${width}, ${language}, ${theme}`);
      }
    }
  }
} finally {
  await browser.close();
}
