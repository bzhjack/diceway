import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(String(err)));

await page.route('**/api/**', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
);

await page.addInitScript(() => {
  window.sessionStorage.setItem('diceway-session', JSON.stringify({
    token: 'fake-token',
    user: { id: 1, name: 'Test MJ', email: 't@t.com' },
  }));
});

await page.goto('http://localhost:4200/create/pnj', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/claude-1000/-home-lionel-IdeaProjects-diceway/356e70ed-9615-40f8-a7ec-ad449edc85f6/scratchpad/pnj-res-centered.png', fullPage: true });

await page.goto('http://localhost:4200/create/hero', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/claude-1000/-home-lionel-IdeaProjects-diceway/356e70ed-9615-40f8-a7ec-ad449edc85f6/scratchpad/hero-res-unaffected.png', fullPage: true });

console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
await browser.close();
