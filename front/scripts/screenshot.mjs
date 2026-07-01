#!/usr/bin/env node
// Usage: node scripts/screenshot.mjs <path> <outFile>
// Example: node scripts/screenshot.mjs /login /tmp/login.png
import { chromium } from 'playwright';

const [, , path = '/', outFile] = process.argv;
if (!outFile) {
  console.error('Usage: node scripts/screenshot.mjs <path> <outFile>');
  process.exit(1);
}

const baseUrl = process.env.APP_URL ?? 'http://localhost:4200';
const errors = [];

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: outFile, fullPage: true });
await browser.close();

console.log(`Screenshot saved to ${outFile}`);
if (errors.length > 0) {
  console.error('Console errors:', errors);
}
