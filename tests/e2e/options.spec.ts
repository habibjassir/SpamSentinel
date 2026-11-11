import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium, expect, test, type BrowserContext } from '@playwright/test';

// Loads the production build into Chromium the same way a user loads it
// unpacked, then opens the options page.
const extensionPath = fileURLToPath(new URL('../../.output/chrome-mv3', import.meta.url));

let context: BrowserContext;

test.beforeAll(async () => {
  if (!existsSync(extensionPath)) {
    throw new Error(`No build found at ${extensionPath}. Run "pnpm build" first.`);
  }
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
});

test.afterAll(async () => {
  await context?.close();
});

// The extension has no background service worker, so its ID is read from the
// chrome://extensions page (Playwright CSS locators pierce its shadow DOM).
async function getExtensionId(): Promise<string> {
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  const item = page.locator('extensions-item').first();
  await expect(item).toBeAttached();
  const id = await item.getAttribute('id');
  await page.close();
  if (!id) throw new Error('Extension ID not found on chrome://extensions');
  return id;
}

test('the options page opens', async () => {
  const id = await getExtensionId();
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/options.html`);
  await expect(page.getByRole('heading', { name: 'SpamSentinel' })).toBeVisible();
});
