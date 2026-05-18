import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 900, height: 1200 });
await page.goto('http://localhost:3000/mapa-capilar/reporte/demo', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'reference/demo-screenshot.png', fullPage: true });
await browser.close();
console.log('screenshot saved');
