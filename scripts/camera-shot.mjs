import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});
const context = await browser.newContext({ permissions: ['camera'], viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.getByTestId('intro-skip').click();
await page.getByTestId('mode-gesture').click();
await page.getByTestId('gesture-start').click();
await page.waitForFunction(() => {
  const v = document.querySelector('[data-testid="gesture-video"]');
  return v && v.videoWidth > 0 && v.readyState >= 2;
}, { timeout: 45000 });
await page.waitForTimeout(2500);
await page.locator('.sidebar').screenshot({ path: '/home/user/shots/10-camera-live.png' });
const stats = await page.evaluate(() => {
  const v = document.querySelector('[data-testid="gesture-video"]');
  const c = document.createElement('canvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(v, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0, max = 0;
  for (let i = 0; i < d.length; i += 4) { const l = (d[i]+d[i+1]+d[i+2])/3; sum += l; if (l>max) max=l; }
  return { avg: sum/(d.length/4), max, w: v.videoWidth, h: v.videoHeight };
});
console.log('FRAME STATS', stats);
await browser.close();
