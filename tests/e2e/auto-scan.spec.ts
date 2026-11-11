import { expect, test } from './extension.ts';
import { HOME_URL, openSampleVideo, sampleBody, serveSampleVideo } from './youtube.ts';

const panel = (page: import('@playwright/test').Page) => page.locator('#spam-sentinel-panel');
const labels = (page: import('@playwright/test').Page) =>
  page.locator('[data-spam-sentinel-label]');

test('comments are scanned automatically, without pressing the button', async ({
  context,
  optionsPage,
}) => {
  await optionsPage.close();
  const page = await openSampleVideo(context);
  await expect(page.getByRole('status')).toHaveText('16 of 68 comments');
  await expect(labels(page)).toHaveCount(16);
});

test('a new spam comment loaded later is highlighted and counted', async ({
  context,
  optionsPage,
}) => {
  await optionsPage.close();
  const page = await openSampleVideo(context);
  await expect(page.getByRole('status')).toHaveText('16 of 68 comments');

  // Copy a top-level comment, as YouTube would render a newly loaded one.
  await page.evaluate(() => {
    const source = [...document.querySelectorAll('ytd-comment-thread-renderer')].find(
      (t) => t.querySelector(':scope > #comment-container #content-text')?.textContent === 'Prueba',
    )!;
    const copy = source.cloneNode(true) as Element;
    copy.querySelector('#author-text')!.setAttribute('href', '/@autor99');
    copy.querySelector('#content-text')!.textContent =
      'The Altorum presale is live, easy 100x before the bull run.';
    document.querySelector('ytd-comments #contents')!.append(copy);
  });

  await expect(page.getByRole('status')).toHaveText('17 of 69 comments');
  await expect(labels(page)).toHaveCount(17);
});

test('moving to a video without a reload shows the panel; leaving hides it', async ({
  context,
  optionsPage,
}) => {
  await optionsPage.close();
  await serveSampleVideo(context);
  const page = await context.newPage();
  await page.goto(HOME_URL);
  await expect(page.locator('#home')).toBeVisible();
  await expect(panel(page)).toHaveCount(0);

  // YouTube changes the URL first, then renders the new page inside its app,
  // without replacing the whole <body>.
  await page.evaluate((body) => {
    history.pushState({}, '', '/watch?v=WkKhJx0Rz1I');
    const app = document.createElement('div');
    app.innerHTML = body;
    document.getElementById('home')!.replaceWith(...app.childNodes);
  }, sampleBody);
  await expect(page.getByRole('status')).toHaveText('16 of 68 comments');

  await page.evaluate(() => history.pushState({}, '', '/'));
  await expect(panel(page)).toHaveCount(0);
  await expect(labels(page)).toHaveCount(0);
});

test('with automatic scan off, nothing is highlighted until the button is pressed', async ({
  context,
  optionsPage,
}) => {
  await optionsPage.getByRole('checkbox', { name: 'Automatic scan' }).uncheck();
  await expect(optionsPage.getByRole('checkbox', { name: 'Automatic scan' })).not.toBeChecked();

  const page = await openSampleVideo(context);
  await expect(page.getByRole('button', { name: 'Scan for spam' })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(labels(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'Scan for spam' }).click();
  await expect(page.getByRole('status')).toHaveText('16 of 68 comments');
});
