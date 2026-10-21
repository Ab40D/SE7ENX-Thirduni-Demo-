import { expect, test } from '@playwright/test';

test.describe('responsive layout', () => {
  test('the mobile layout has no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    await expect(page.getByTestId('light-state')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('every essential control is reachable on a phone', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    await page.getByTestId('mode-voice').click();
    await expect(page.getByTestId('voice-control')).toBeVisible();
    await page.getByTestId('mode-gesture').click();
    await expect(page.getByTestId('gesture-control')).toBeVisible();
    await page.getByTestId('mode-manual').click();
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await expect(page.getByTestId('light-switch')).toBeVisible();
  });

  test('the room viewer keeps a usable size on a phone', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    const stage = page.locator('.stage');
    const box = await stage.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(280);
    expect(box?.height ?? 0).toBeGreaterThan(200);
  });
});
