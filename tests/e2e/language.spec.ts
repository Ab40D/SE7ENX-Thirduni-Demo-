import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page, language = 'en') {
  await page.goto('/');
  await page.getByTestId('intro-skip').click();
  if (language !== 'en') {
    await page.selectOption('#language-select', language);
  }
  await expect(page.getByTestId('light-state')).toBeVisible();
}

async function send(page: Page, text: string) {
  await page.getByTestId('chat-input').fill(text);
  await page.getByTestId('chat-send').click();
  await page.waitForTimeout(700);
}

test.describe('multilingual commands', () => {
  test('english commands control the light', async ({ page }) => {
    await openApp(page);
    await send(page, 'Turn off the light.');
    await expect(page.getByTestId('light-state')).toHaveText('Off');
    await send(page, 'Turn on the light.');
    await expect(page.getByTestId('light-state')).toHaveText('On');
    await send(page, 'Set brightness to 45 percent.');
    await expect(page.getByTestId('brightness-value')).toHaveText('45%');
  });

  test('french commands control the light', async ({ page }) => {
    await openApp(page, 'fr');
    await send(page, 'Éteins la lumière.');
    await expect(page.getByTestId('light-state')).toHaveText('Éteint');
    await send(page, 'Allume la lumière.');
    await expect(page.getByTestId('light-state')).toHaveText('Allumé');
    await send(page, 'Règle la luminosité à 45 pour cent.');
    await expect(page.getByTestId('brightness-value')).toHaveText('45%');
  });

  test('arabic commands control the light', async ({ page }) => {
    await openApp(page, 'ar');
    await send(page, 'طفي الضوء.');
    await expect(page.getByTestId('light-state')).toHaveText('مطفأ');
    await send(page, 'شعل الضوء.');
    await expect(page.getByTestId('light-state')).toHaveText('مضاء');
    await send(page, 'خلي الإضاءة 45 بالمئة.');
    await expect(page.getByTestId('brightness-value')).toHaveText('45%');
  });

  test('darija commands control the light', async ({ page }) => {
    await openApp(page, 'dz');
    await send(page, 'طفي الضو.');
    await expect(page.getByTestId('light-state')).toHaveText('مطفي');
    await send(page, 'شعل الضو.');
    await expect(page.getByTestId('light-state')).toHaveText('مولع');
    await send(page, 'نقص الضو لـ 45 بالمية.');
    await expect(page.getByTestId('brightness-value')).toHaveText('45%');
  });

  test('darija controls the shutter', async ({ page }) => {
    await openApp(page, 'dz');
    await send(page, 'سدّ الفولي.');
    await page.waitForTimeout(1500);
    const value = Number((await page.getByTestId('shutter-value').textContent())?.replace('%', ''));
    expect(value).toBeLessThan(100);
  });

  test('the layout switches to right-to-left for arabic', async ({ page }) => {
    await openApp(page, 'ar');
    const dir = await page.locator('.app-shell').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('a question is answered instead of triggering an action', async ({ page }) => {
    await openApp(page);
    await send(page, 'What is the current light status?');
    await expect(page.getByTestId('chat-log')).toContainText('The light is On');
    // the state must not have changed
    await expect(page.getByTestId('light-state')).toHaveText('On');
  });

  test('unknown commands fail honestly', async ({ page }) => {
    await openApp(page);
    await send(page, 'please make me a sandwich');
    await expect(page.getByTestId('chat-log')).toContainText('I did not catch a supported command');
    await expect(page.getByTestId('chat-log')).toContainText('Not recognised');
  });

  test('out-of-range values are rejected', async ({ page }) => {
    await openApp(page);
    await send(page, 'set brightness to 150 percent');
    await expect(page.getByTestId('chat-log')).toContainText('out of range');
    await expect(page.getByTestId('brightness-value')).toHaveText('70%');
  });

  test('the assistant answers knowledge questions', async ({ page }) => {
    await openApp(page);
    await send(page, 'Is this connected to a real building?');
    await expect(page.getByTestId('chat-log')).toContainText('No. This is a browser simulation only');
  });
});
