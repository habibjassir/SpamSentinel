import { expect, test } from './extension.ts';

test('the options page opens in English by default', async ({ optionsPage: page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'SpamSentinel' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Keyword rules', exact: true })).toBeVisible();
  // Starter rules are there on first run.
  await expect(page.getByRole('row', { name: /presale/ })).toBeVisible();
});

test('a new rule is saved and survives a reload', async ({ optionsPage: page }) => {
  await page.getByRole('button', { name: 'Add rule' }).click();
  await page.getByLabel('Pattern').fill('giveaway');
  await page.getByLabel('Category').fill('scam');
  await page.getByRole('button', { name: 'Save rule' }).click();
  await expect(page.getByRole('row', { name: /giveaway/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('row', { name: /giveaway/ })).toBeVisible();
});

test('an invalid regex shows an error and is not saved', async ({ optionsPage: page }) => {
  await page.getByRole('button', { name: 'Add rule' }).click();
  await page.getByLabel('Type').selectOption('regex');
  await page.getByLabel('Pattern').fill('pre(sale');
  await page.getByRole('button', { name: 'Save rule' }).click();
  await expect(page.getByRole('alert')).toContainText('not a valid regular expression');

  await page.reload();
  await expect(page.getByRole('row', { name: /pre\(sale/ })).toHaveCount(0);
});

test('turning a detector off survives a reload', async ({ optionsPage: page }) => {
  const keywords = page.getByRole('checkbox', { name: 'Keyword rules' });
  await expect(keywords).toBeChecked();
  await keywords.uncheck();
  await expect(page.getByText('finds nothing while keyword rules are off')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Keyword rules' })).not.toBeChecked();
});

test('switching the language changes the page and survives a reload', async ({
  optionsPage: page,
}) => {
  await page.getByLabel('Language').selectOption('es');
  await expect(page.getByRole('heading', { name: 'Reglas de palabras clave' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Reglas de palabras clave' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('the scan delay is saved when valid and rejected when out of range', async ({
  optionsPage: page,
}) => {
  const delay = page.getByLabel('Wait before scanning (milliseconds)');
  await expect(delay).toHaveValue('500');

  await delay.fill('100');
  await delay.press('Enter');
  await expect(page.getByRole('alert')).toContainText('from 250 to 5000');

  await delay.fill('1000');
  await delay.press('Enter');
  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel('Wait before scanning (milliseconds)')).toHaveValue('1000');
});
