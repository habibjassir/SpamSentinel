import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BrowserContext, Page } from '@playwright/test';

export const VIDEO_URL = 'https://www.youtube.com/watch?v=WkKhJx0Rz1I';
export const HOME_URL = 'https://www.youtube.com/';

const HOME_PAGE =
  '<!doctype html><html><head><title>YouTube</title></head><body><main id="home">Home</main></body></html>';

const sample = readFileSync(
  fileURLToPath(new URL('../../fixtures/page-WkKhJx0Rz1I.html', import.meta.url)),
  'utf8',
);

/** The sample page's body, for tests that swap the page content in place like YouTube does. */
export const sampleBody = sample.slice(
  sample.indexOf('<body>') + '<body>'.length,
  sample.lastIndexOf('</body>'),
);

/**
 * Serves the captured sample page at the real video URL and a bare home page,
 * and blocks every other web request, so tests never touch real YouTube.
 */
export async function serveSampleVideo(context: BrowserContext): Promise<void> {
  await context.route(/^https?:\/\//, (route) => {
    const url = route.request().url();
    if (url.startsWith(VIDEO_URL)) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: sample });
    }
    if (url === HOME_URL) {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: HOME_PAGE,
      });
    }
    return route.abort();
  });
}

export async function openSampleVideo(context: BrowserContext): Promise<Page> {
  await serveSampleVideo(context);
  const page = await context.newPage();
  await page.goto(VIDEO_URL);
  return page;
}
