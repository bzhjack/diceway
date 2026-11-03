import {chromium} from 'playwright';
const base = 'http://localhost:4403';
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: {width: 1500, height: 1000}})).newPage();
let hero;
for (let i = 0; i < 5 && !hero; i++) {
  await page.goto(base + '/login', {waitUntil: 'networkidle'});
  hero = await page.evaluate(async () => {
  const json = (r) => r.json();
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email: 'claude-test@example.com', password: 'ClaudeTest123!'})}).then(json);
  sessionStorage.setItem('diceway-session', JSON.stringify({token: login.token ?? login.access_token, user: login.user ?? login}));
  const r = await fetch('/api/bol/heros', {headers: {Accept: 'application/json', Authorization: 'Bearer ' + (login.token ?? login.access_token)}}).then(json);
  return (Array.isArray(r) ? r : r.data)[0].id;
}).catch(() => null);
}
await page.goto(`${base}/create/hero/${hero}`, {waitUntil: 'networkidle'});
await page.waitForTimeout(1000);
await page.evaluate(() => { window.__log = []; document.addEventListener('focusin', (e) => window.__log.push('in ' + e.target.tagName + '.' + String(e.target.className).split(' ')[0])); });
await page.locator('bol-add-menu .dw-add-trigger').first().focus();
await page.keyboard.press(process.argv[2] ?? 'Enter');
await page.waitForTimeout(800);
console.log(await page.evaluate(() => window.__log.join('\n')));
console.log('panel', await page.locator('.mat-mdc-menu-panel').count());
await browser.close();
