import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 700 } });
page.on('pageerror', () => {});

await page.route('**/api/**', (route) => {
  route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
await page.route('**/api/bol/langues', (route) => {
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
    { id: 1, langue: 'Festreli', description: 'Langue commerciale des cotes.', est_lemurienne: false },
  ]) });
});

await page.goto('http://localhost:4220/login', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  sessionStorage.setItem('diceway-session', JSON.stringify({
    token: 'fake-token-for-visual-check',
    user: { id: 1, name: 'Test', email: 'test@test.com' }
  }));
});
await page.goto('http://localhost:4220/create/hero', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

await page.locator('bol-langue-add-menu button', { hasText: 'Ajouter' }).click();
await page.waitForTimeout(200);
await page.locator('.mat-mdc-menu-panel mat-select').click();
await page.waitForTimeout(200);
await page.locator('mat-option', { hasText: 'Festreli' }).click();
await page.waitForTimeout(150);
await page.locator('.mat-mdc-menu-panel button[mat-flat-button]').last().click();
await page.waitForTimeout(300);

await page.screenshot({ path: '/tmp/claude-1000/-home-lionel-IdeaProjects-diceway/356e70ed-9615-40f8-a7ec-ad449edc85f6/scratchpad/height-fixed.png' });

const generalHeight = await page.locator('bol-hero-general').evaluate(el => el.closest('.dw-section--form').getBoundingClientRect().height);
const langueHeight = await page.locator('bol-langue-list').evaluate(el => el.closest('.dw-section--form').getBoundingClientRect().height);
console.log('general height:', generalHeight, 'langue card height:', langueHeight);

await browser.close();
