import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 4 });
await page.goto(process.env.APP_URL || 'http://localhost:5173/', { waitUntil: 'networkidle' });
await page.getByTestId('intro-skip').click();
await page.waitForTimeout(1000);
await page.addStyleTag({ content: '.guide-figure { width: 260px !important; }' });
await page.waitForTimeout(300);
const guide = page.locator('.guide-figure').first();
await guide.screenshot({ path: '/home/user/shots/guide.png' });
await browser.close();
console.log('ok');
