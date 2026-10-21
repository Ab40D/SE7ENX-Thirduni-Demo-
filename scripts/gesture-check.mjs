import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://localhost:4173/';
const browser = await chromium.launch({
  args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
  ],
});
const context = await browser.newContext({ permissions: ['camera'], viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0, 200)); });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.getByTestId('intro-skip').click();
await page.getByTestId('mode-gesture').click();
await page.getByTestId('gesture-start').click();
await page.waitForTimeout(12000);
const status = await page.getByTestId('gesture-status').textContent();
console.log('GESTURE STATUS:', status);
const video = await page.getByTestId('gesture-video').count();
console.log('video preview elements:', video);
await page.screenshot({ path: '/home/user/shots/09-gesture-live.png' });
await browser.close();
