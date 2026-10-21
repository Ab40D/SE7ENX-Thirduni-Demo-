import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await page.getByTestId('intro-skip').click();
  await expect(page.getByTestId('light-state')).toBeVisible();
}

async function send(page: Page, text: string) {
  await page.getByTestId('chat-input').fill(text);
  await page.getByTestId('chat-send').click();
  await page.waitForTimeout(600);
}

test.describe('SE7ENX simulation', () => {
  test('intro can be skipped and the lab is reachable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('intro-skip')).toBeVisible();
    await page.getByTestId('intro-skip').click();
    await expect(page.getByTestId('light-state')).toBeVisible();
    await expect(page.locator('.brand-name').first()).toHaveText('SE7ENX');
  });

  test('the light toggles and keeps the brightness level', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('light-state')).toHaveText('On');
    await expect(page.getByTestId('brightness-value')).toHaveText('70%');

    await page.locator('#light-switch').click();
    await expect(page.getByTestId('light-state')).toHaveText('Off');
    // the brightness level is preserved while the light is off
    await expect(page.getByTestId('brightness-value')).toHaveText('70%');

    await page.locator('#light-switch').click();
    await expect(page.getByTestId('light-state')).toHaveText('On');
    await expect(page.getByTestId('brightness-value')).toHaveText('70%');
  });

  test('the brightness slider drives the shared state', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('light-brightness').fill('30');
    await expect(page.getByTestId('brightness-value')).toHaveText('30%');
    await expect(page.getByTestId('light-state')).toHaveText('On');

    await page.getByTestId('light-brightness').fill('0');
    await expect(page.getByTestId('light-state')).toHaveText('Off');
  });

  test('the shutter opens, closes and stops mid-travel', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('shutter-value')).toHaveText('100%');

    await page.getByTestId('shutter-close').click();
    await expect(page.getByTestId('shutter-state')).toHaveText('Moving');
    await page.waitForTimeout(600);
    const mid = Number((await page.getByTestId('shutter-value').textContent())?.replace('%', ''));
    expect(mid).toBeLessThan(100);
    expect(mid).toBeGreaterThan(0);

    await page.getByTestId('shutter-stop').click();
    await expect(page.getByTestId('shutter-state')).toHaveText('Stopped');
    const stopped = await page.getByTestId('shutter-value').textContent();
    await page.waitForTimeout(700);
    await expect(page.getByTestId('shutter-value')).toHaveText(stopped ?? '');
  });

  test('the shutter reaches the requested position', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('shutter-position').fill('20');
    await page.waitForTimeout(2600);
    await expect(page.getByTestId('shutter-value')).toHaveText('20%');
    await expect(page.getByTestId('shutter-state')).toHaveText('Stopped');
  });

  test('activity history records every interaction with its source', async ({ page }) => {
    await openApp(page);
    await page.locator('#light-switch').click();
    await expect(page.getByTestId('history-list').locator('li')).toHaveCount(1);
    await expect(page.getByTestId('history-list')).toContainText('Light turned off');
    await expect(page.getByTestId('history-list')).toContainText('Manual');

    await send(page, 'Turn on the light.');
    await expect(page.getByTestId('history-list').locator('li')).toHaveCount(2);
    await expect(page.getByTestId('history-list')).toContainText('Text');
  });

  test('the inspector reflects the selected device', async ({ page }) => {
    await openApp(page);
    await page.selectOption('#inspector-device', 'shutter');
    await expect(page.getByTestId('inspector-device')).toHaveText('Smart shutter');
    await expect(page.getByTestId('inspector-value')).toHaveText('100%');
  });

  test('reset restores the documented initial state', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('light-brightness').fill('5');
    await page.locator('#light-switch').click();
    await page.getByRole('button', { name: 'Reset simulation' }).click();
    await expect(page.getByTestId('brightness-value')).toHaveText('70%');
    await expect(page.getByTestId('light-state')).toHaveText('On');
  });

  test('the creator photograph loads and the community credit stays honest', async ({ page }) => {
    await page.goto('/');
    // The welcome screen carries the real photograph.
    const introPhoto = page.locator('img.intro-avatar');
    await expect(introPhoto).toBeVisible();
    const introLoaded = await introPhoto.evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    );
    expect(introLoaded).toBe(true);
    await expect(introPhoto).toHaveAttribute('alt', /Abdelkhalek Mammeri/);

    await page.getByTestId('intro-skip').click();
    await page.getByRole('button', { name: 'About', exact: true }).click();

    const profile = page.getByTestId('creator-profile');
    await expect(profile).toBeVisible();
    const portrait = profile.getByTestId('creator-photo');
    const portraitLoaded = await portrait.evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    );
    expect(portraitLoaded).toBe(true);

    // The community credit always states that no endorsement is implied.
    const credit = page.getByTestId('community-credit');
    await expect(credit).toContainText('no official endorsement or partnership is implied');
    await expect(credit).toContainText('SE7ENX Simulation — Developed by Abdelkhalek Mammeri');
  });
});
