import { expect, test } from './extension.ts';
import { openSampleVideo } from './youtube.ts';

test('pressing "Scan for spam" highlights 16 of 68 comments with reasons', async ({
  context,
  optionsPage,
}) => {
  await optionsPage.close(); // starts the test on clean storage (default settings)
  const page = await openSampleVideo(context);

  const scan = page.getByRole('button', { name: 'Scan for spam' });
  await expect(scan).toBeVisible();
  await scan.click();

  await expect(page.getByRole('status')).toHaveText('16 of 68 comments');
  await expect(page.locator('[data-spam-sentinel-label]')).toHaveCount(16);
  await expect(page.locator('[data-spam-sentinel-label]').first()).toContainText('Possible spam:');
});

test('with keyword rules off, a new scan flags nothing', async ({ context, optionsPage }) => {
  await optionsPage.getByRole('checkbox', { name: 'Keyword rules' }).uncheck();
  await expect(optionsPage.getByRole('checkbox', { name: 'Keyword rules' })).not.toBeChecked();

  const page = await openSampleVideo(context);
  await page.getByRole('button', { name: 'Scan for spam' }).click();

  await expect(page.getByRole('status')).toHaveText('0 of 68 comments');
  await expect(page.locator('[data-spam-sentinel-label]')).toHaveCount(0);
});
