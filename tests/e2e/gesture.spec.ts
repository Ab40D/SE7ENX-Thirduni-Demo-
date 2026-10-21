import { expect, test } from '@playwright/test';

/**
 * Runs against a synthetic camera (Chromium's fake media device) so the
 * whole camera pipeline — permission, `srcObject`, playback, first frames,
 * MediaPipe model, overlay — is exercised for real.
 *
 * The fake device shows a rolling pattern, never a hand, so no gesture is
 * expected to fire. The assertions are about the *camera feed itself*:
 * the preview must contain actual picture data, not a black rectangle.
 */
test.describe('camera preview', () => {
  test('the preview shows real frames instead of a black rectangle', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    await page.getByTestId('mode-gesture').click();
    await page.getByTestId('gesture-start').click();

    // The status may only claim "camera ready" once frames are arriving.
    await expect(page.getByTestId('gesture-status')).toContainText('Camera ready', {
      timeout: 45_000,
    });

    const video = page.getByTestId('gesture-video');
    await expect(video).toBeVisible();

    const box = await video.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(50);
    expect(box?.height ?? 0).toBeGreaterThan(50);

    // The element really is playing a picture of a usable size.
    const stream = await page.evaluate(() => {
      const element = document.querySelector<HTMLVideoElement>('[data-testid="gesture-video"]');
      if (!element) return null;
      return {
        readyState: element.readyState,
        videoWidth: element.videoWidth,
        videoHeight: element.videoHeight,
        hasStream: Boolean(element.srcObject),
        paused: element.paused,
      };
    });
    expect(stream?.hasStream).toBe(true);
    expect(stream?.readyState ?? 0).toBeGreaterThanOrEqual(2);
    expect(stream?.videoWidth ?? 0).toBeGreaterThan(0);
    expect(stream?.videoHeight ?? 0).toBeGreaterThan(0);

    // Draw one frame and prove it is not black.
    const frame = await page.evaluate(() => {
      const element = document.querySelector<HTMLVideoElement>('[data-testid="gesture-video"]');
      if (!element) return null;
      const canvas = document.createElement('canvas');
      canvas.width = element.videoWidth;
      canvas.height = element.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(element, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      let brightest = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const luminance = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        total += luminance;
        if (luminance > brightest) brightest = luminance;
      }
      return { average: total / (pixels.length / 4), brightest };
    });
    expect(frame).not.toBeNull();
    expect(frame?.average ?? 0).toBeGreaterThan(3);
    expect(frame?.brightest ?? 0).toBeGreaterThan(40);
  });

  test('the camera feed survives a hand-tracking model that cannot be loaded', async ({ page }) => {
    // Break the model download only — the camera must keep working.
    await page.route('**/hand_landmarker.task', (route) => route.abort());
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    await page.getByTestId('mode-gesture').click();
    await page.getByTestId('gesture-start').click();

    await expect(page.getByTestId('gesture-status')).toContainText('Camera ready', {
      timeout: 45_000,
    });
    await expect(page.getByTestId('gesture-tracker-status')).toContainText('could not be loaded', {
      timeout: 60_000,
    });

    const stream = await page.evaluate(() => {
      const element = document.querySelector<HTMLVideoElement>('[data-testid="gesture-video"]');
      return {
        hasStream: Boolean(element?.srcObject),
        videoWidth: element?.videoWidth ?? 0,
      };
    });
    expect(stream.hasStream).toBe(true);
    expect(stream.videoWidth).toBeGreaterThan(0);
  });

  test('stopping the camera releases the stream and the element', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    await page.getByTestId('mode-gesture').click();
    await page.getByTestId('gesture-start').click();

    await expect(page.getByTestId('gesture-status')).toContainText('Camera ready', {
      timeout: 45_000,
    });

    await page.getByTestId('gesture-stop').click();
    await expect(page.getByTestId('gesture-status')).toContainText('Camera off');

    const released = await page.evaluate(() => {
      const element = document.querySelector<HTMLVideoElement>('[data-testid="gesture-video"]');
      return {
        hasStream: Boolean(element?.srcObject),
        paused: element?.paused ?? true,
      };
    });
    expect(released.hasStream).toBe(false);
    expect(released.paused).toBe(true);
  });

  test('the camera is never requested before the user asks for it', async ({ page }) => {
    let requested = false;
    await page.addInitScript(() => {
      const original = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
      if (original) {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
          value: (...args: unknown[]) => {
            (window as unknown as { __se7enxCameraRequested: boolean }).__se7enxCameraRequested = true;
            return original(...(args as Parameters<typeof original>));
          },
          configurable: true,
        });
      }
    });
    await page.goto('/');
    await page.getByTestId('intro-skip').click();
    await page.getByTestId('mode-gesture').click();
    await page.waitForTimeout(1500);
    requested = await page.evaluate(
      () => (window as unknown as { __se7enxCameraRequested?: boolean }).__se7enxCameraRequested === true,
    );
    expect(requested).toBe(false);
  });
});
