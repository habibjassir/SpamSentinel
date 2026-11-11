import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BrowserContext, Page } from '@playwright/test';

export const VIDEO_URL = 'https://www.youtube.com/watch?v=WkKhJx0Rz1I';

const sample = readFileSync(
  fileURLToPath(new URL('../../fixtures/page-WkKhJx0Rz1I.html', import.meta.url)),
  'utf8',
);

/**
 * Serves the captured sample page at the real video URL and blocks every other
 * web request, so tests never touch real YouTube (or anything else).
 */
export async function serveSampleVideo(context: BrowserContext): Promise<void> {
  await context.route(/^https?:\/\//, (route) => {
    const url = route.request().url();
    return url.startsWith(VIDEO_URL)
      ? route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: sample })
      : route.abort();
  });
}

export async function openSampleVideo(context: BrowserContext): Promise<Page> {
  await serveSampleVideo(context);
  const page = await context.newPage();
  await page.goto(VIDEO_URL);
  return page;
}
