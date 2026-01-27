import { test, expect, chromium, type BrowserContext } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, "../dist");

async function launchWithExtension(): Promise<BrowserContext> {
  return chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      "--no-first-run",
      "--disable-gpu",
    ],
  });
}

test.describe("Magnacat Extension E2E", () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await launchWithExtension();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("extension loads without errors", async () => {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("about:blank");
    await page.waitForTimeout(1000);
    // No critical load errors expected
    expect(errors.length).toBe(0);
    await page.close();
  });

  test("popup opens and has expected UI elements", async () => {
    // Find the extension's service worker to get extension ID
    let extensionId = "";
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      const url = serviceWorkers[0].url();
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) extensionId = match[1];
    }

    // Wait for service worker if not available yet
    if (!extensionId) {
      const sw = await context.waitForEvent("serviceworker");
      const url = sw.url();
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) extensionId = match[1];
    }

    expect(extensionId).toBeTruthy();

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    // Verify popup UI elements exist
    const apiKeyInput = popupPage.locator("[data-testid='api-key-input']");
    await expect(apiKeyInput).toBeVisible();

    const saveBtn = popupPage.locator("[data-testid='save-btn']");
    await expect(saveBtn).toBeVisible();

    const sourceLang = popupPage.locator("[data-testid='source-lang']");
    await expect(sourceLang).toBeVisible();

    const targetLang = popupPage.locator("[data-testid='target-lang']");
    await expect(targetLang).toBeVisible();

    const swapBtn = popupPage.locator("[data-testid='swap-btn']");
    await expect(swapBtn).toBeVisible();

    await popupPage.close();
  });

  test("API key can be entered in popup", async () => {
    const serviceWorkers = context.serviceWorkers();
    let extensionId = "";
    if (serviceWorkers.length > 0) {
      const url = serviceWorkers[0].url();
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) extensionId = match[1];
    }

    if (!extensionId) {
      const sw = await context.waitForEvent("serviceworker");
      const url = sw.url();
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) extensionId = match[1];
    }

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);

    const apiKeyInput = popupPage.locator("[data-testid='api-key-input']");
    await apiKeyInput.fill("test-api-key-12345");
    await expect(apiKeyInput).toHaveValue("test-api-key-12345");

    await popupPage.close();
  });

  test("content script injects without errors on a page", async () => {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.setContent(`
      <html>
        <body>
          <h1>Test Page</h1>
          <p>Some English text for testing translation features.</p>
          <input type="text" id="test-input" value="test input" />
        </body>
      </html>
    `);

    await page.waitForTimeout(500);

    // Content script should load without errors
    expect(errors.filter((e) => e.includes("magnacat"))).toHaveLength(0);
    await page.close();
  });
});
