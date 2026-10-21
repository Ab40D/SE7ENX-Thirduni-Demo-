import { chromium } from 'playwright';

const OUT = process.env.OUT_DIR || '/home/user/shots';
const URL = process.env.APP_URL || 'http://localhost:5173/';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/01-intro.png` });

await page.waitForTimeout(6200);
await page.screenshot({ path: `${OUT}/02-intro-end.png` });

await page.getByTestId('intro-explore').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/03-app.png` });
await page.screenshot({ path: `${OUT}/03-app-full.png`, fullPage: true });

// guided tour
await page.getByRole('button', { name: 'Guided tour', exact: true }).click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/04-tour.png` });
await page.getByRole('button', { name: 'Skip tour' }).click();

// gesture panel
await page.getByTestId('mode-gesture').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/05-gesture-panel.png` });

// arabic RTL
await page.selectOption('#language-select', 'ar');
await page.getByTestId('mode-manual').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/06-arabic.png` });

// french
await page.selectOption('#language-select', 'fr');
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/07-french.png` });

// mobile
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(URL, { waitUntil: 'networkidle' });
await mobile.getByTestId('intro-skip').click();
await mobile.waitForTimeout(2000);
await mobile.screenshot({ path: `${OUT}/08-mobile.png` });
await mobile.screenshot({ path: `${OUT}/08-mobile-full.png`, fullPage: true });

await browser.close();
console.log('done');
