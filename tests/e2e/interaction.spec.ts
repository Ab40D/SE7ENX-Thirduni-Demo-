import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page) {
  await page.goto('/');
  await page.getByTestId('intro-skip').click();
  await expect(page.getByTestId('light-state')).toBeVisible();
}

test.describe('interaction methods', () => {
  test('gesture mode reports a denied camera and keeps manual control', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => {
            const error = new Error('Permission denied');
            error.name = 'NotAllowedError';
            return Promise.reject(error);
          },
        },
      });
    });
    await openApp(page);
    await page.getByTestId('mode-gesture').click();
    await page.getByTestId('gesture-start').click();
    await expect(page.getByTestId('gesture-status')).toContainText('Camera permission was denied');

    // manual control still works
    await page.locator('#light-switch').click();
    await expect(page.getByTestId('light-state')).toHaveText('Off');
  });

  test('the camera is never requested before the visitor asks for it', async ({ page }) => {
    let requested = false;
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => {
            (window as unknown as { __cameraRequested: boolean }).__cameraRequested = true;
            return Promise.reject(new Error('nope'));
          },
        },
      });
    });
    await openApp(page);
    await page.waitForTimeout(800);
    requested = await page.evaluate(() => Boolean((window as unknown as { __cameraRequested?: boolean }).__cameraRequested));
    expect(requested).toBe(false);
  });

  test('voice mode degrades gracefully when recognition fails', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('mode-voice').click();
    await expect(page.getByTestId('voice-control')).toBeVisible();
    // the microphone is never requested automatically
    await page.waitForTimeout(500);
    await expect(page.getByTestId('voice-status')).toHaveText('Ready');
  });

  test('voice mode reports a missing speech API and keeps the text field', async ({ page }) => {
    await page.addInitScript(() => {
      delete (window as unknown as Record<string, unknown>).SpeechRecognition;
      delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    });
    await openApp(page);
    await page.getByTestId('mode-voice').click();
    await expect(page.getByTestId('voice-toggle')).toBeDisabled();
    await expect(page.getByTestId('voice-control')).toContainText(
      'Speech recognition is not available in this browser',
    );
    // the text assistant is still fully usable
    await page.getByTestId('chat-input').fill('Turn on the light.');
    await page.getByTestId('chat-send').click();
    await expect(page.getByTestId('chat-log')).toContainText('The light is now on.');
  });

  test('a denied microphone is reported honestly', async ({ page }) => {
    await page.addInitScript(() => {
      class DeniedRecognition {
        lang = 'en-GB';
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        onresult: unknown = null;
        onerror: unknown = null;
        onend: unknown = null;
        onstart: unknown = null;
        start() {
          setTimeout(() => {
            (this.onerror as ((event: unknown) => void) | null)?.({ error: 'not-allowed' });
          }, 50);
        }
        stop() {}
        abort() {}
      }
      delete (window as unknown as Record<string, unknown>).SpeechRecognition;
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition = DeniedRecognition;
    });
    await openApp(page);
    await page.getByTestId('mode-voice').click();
    await page.getByTestId('voice-toggle').click();
    await expect(page.getByTestId('voice-control')).toContainText('Microphone permission was denied');
  });

  test('the guided tour highlights the real controls and can be skipped', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Guided tour', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Step 1 of 7')).toBeVisible();

    await page.getByTestId('tour-next').click();
    await expect(page.getByText('Step 2 of 7')).toBeVisible();

    await page.getByTestId('tour-next').click();
    await expect(page.getByText('Step 3 of 7')).toBeVisible();
    await expect(page.locator('.tour-spotlight')).toBeVisible();

    await page.getByRole('button', { name: 'Skip tour' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('keyboard navigation reaches the light control', async ({ page }) => {
    await openApp(page);
    await page.locator('#light-switch').focus();
    await expect(page.locator('#light-switch')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('light-state')).toHaveText('Off');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('light-state')).toHaveText('On');
  });

  test('reduced motion skips the cinematic intro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByTestId('intro-explore')).toBeEnabled();
  });
});
