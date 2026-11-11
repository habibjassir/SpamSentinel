import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test as base, chromium, expect, type BrowserContext, type Page } from '@playwright/test';

// Loads the production build into Chromium the same way a user loads it unpacked.
const extensionPath = fileURLToPath(new URL('../../.output/chrome-mv3', import.meta.url));

interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  /** The options page, opened on clean storage. */
  optionsPage: Page;
}

export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    if (!existsSync(extensionPath)) {
      throw new Error(`No build found at ${extensionPath}. Run "pnpm build" first.`);
    }
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      locale: 'en-US',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },

  // The extension has no background service worker, so its ID is read from the
  // chrome://extensions page (Playwright CSS locators pierce its shadow DOM).
  extensionId: async ({ context }, use) => {
    const page = await context.newPage();
    await page.goto('chrome://extensions');
    const item = page.locator('extensions-item').first();
    await expect(item).toBeAttached();
    const id = await item.getAttribute('id');
    await page.close();
    if (!id) throw new Error('Extension ID not found on chrome://extensions');
    await use(id);
  },

  optionsPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    // Runs inside the extension page, where the `chrome` API exists.
    await page.evaluate(() =>
      (
        globalThis as unknown as { chrome: { storage: { local: { clear(): Promise<void> } } } }
      ).chrome.storage.local.clear(),
    );
    await page.reload();
    await use(page);
  },
});

export { expect };
