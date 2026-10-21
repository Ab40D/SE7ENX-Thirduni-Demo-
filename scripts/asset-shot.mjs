import { chromium } from 'playwright';
const URL = process.env.APP_URL || 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/home/user/shots/11-intro-photo.png' });
await page.getByTestId('intro-skip').click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/home/user/shots/12-app-photo.png' });
// About section
await page.getByRole('button', { name: 'About', exact: true }).click();
await page.waitForTimeout(1200);
await page.locator('.about').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.locator('.about').screenshot({ path: '/home/user/shots/13-about-photo.png' });
const broken = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img')).map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })));
console.log('IMAGES', JSON.stringify(broken, null, 1));
await browser.close();
