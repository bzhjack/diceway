// Script temporaire : captures avant/après de la zone `bol/` (hors session). À supprimer.
import {chromium} from 'playwright';

const base = 'http://localhost:4403';
const out = process.argv[2];
const prefix = process.argv[3];
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: {width: 1500, height: 1000}})).newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

let ids;
for (let i = 0; i < 5 && !ids; i++) {
  await page.goto(base + '/login', {waitUntil: 'networkidle'});
  ids = await page.evaluate(async () => {
  const json = (r) => r.json();
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email: 'claude-test@example.com', password: 'ClaudeTest123!'})}).then(json);
  const token = login.token ?? login.access_token;
  sessionStorage.setItem('diceway-session', JSON.stringify({token, user: login.user ?? login}));
  const headers = {Accept: 'application/json', Authorization: 'Bearer ' + token};
  const first = async (url, pred = () => true) => {
    const r = await fetch(url, {headers}).then(json);
    const list = Array.isArray(r) ? r : (r.data ?? []);
    return (list.find(pred) ?? list[0])?.id;
  };
  return {
    hero: await first('/api/bol/heros'),
    pnj: await first('/api/bol/pnj'),
    creature: await first('/api/bol/creature'),
    demon: await first('/api/bol/demon'),
  };
}).catch(() => null);
}
console.log('ids', JSON.stringify(ids));

const shot = async (name) => {
  await page.waitForTimeout(900);
  await page.screenshot({path: `${out}/${prefix}-${name}.png`, fullPage: true});
};
const go = async (path) => {
  await page.goto(base + path, {waitUntil: 'networkidle'});
  await page.waitForTimeout(1200);
};

for (const [name, path] of [['lib-heros', '/library/heroes'], ['lib-pnj', '/library/pnjs'], ['lib-creatures', '/library/creatures'], ['lib-demons', '/library/demons'], ['intendance', '/intendance']]) {
  await go(path);
  await shot(name);
}

// Statblocs en dialogue, depuis les bibliothèques.
for (const [name, path] of [['sb-heros', '/library/heroes'], ['sb-pnj', '/library/pnjs'], ['sb-creature', '/library/creatures'], ['sb-demon', '/library/demons']]) {
  await go(path);
  const portrait = page.locator('.entity-card__portrait').first();
  if (await portrait.count()) {
    await portrait.click();
    await page.waitForSelector('mat-dialog-container', {timeout: 5000}).catch(() => null);
    await page.waitForTimeout(800);
    await page.screenshot({path: `${out}/${prefix}-${name}.png`});
    await page.keyboard.press('Escape');
  }
}

const forms = [
  ['form-heros', `/create/hero/${ids.hero}`],
  ['form-heros-new', '/create/hero'],
  ['form-heros-avance', '/create/hero-advanced'],
  ['form-pnj', `/create/pnj/${ids.pnj}`],
  ['form-creature', `/create/creature/${ids.creature}`],
  ['form-demon', `/create/demon/${ids.demon}`],
];
for (const [name, path] of forms) {
  await go(path);
  await shot(name);
}

// Menus d'ajout (overlay) : ouverts depuis le formulaire du héros.
await go(`/create/hero/${ids.hero}`);
const triggers = page.locator('.dw-add-trigger');
const n = await triggers.count();
console.log('triggers', n);
for (let i = 0; i < n; i++) {
  await triggers.nth(i).scrollIntoViewIfNeeded();
  await triggers.nth(i).click();
  await page.waitForSelector('.mat-mdc-menu-panel', {timeout: 3000}).catch(() => null);
  await page.waitForTimeout(500);
  const panel = page.locator('.mat-mdc-menu-panel').first();
  const box = await panel.boundingBox();
  console.log('menu', i, JSON.stringify(box));
  await page.screenshot({path: `${out}/${prefix}-menu-${i}.png`});
  // Ouvre le select du menu pour voir les options.
  const select = panel.locator('mat-select').first();
  if (await select.count()) {
    await select.click();
    await page.waitForTimeout(500);
    await page.screenshot({path: `${out}/${prefix}-menu-${i}-options.png`});
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

// Création avancée d'un héros existant, puis le dialogue des régions (épingles).
await go(`/create/hero-advanced/${ids.hero}`);
await shot('form-heros-avance-id');
await page.locator('.hap-region-input').click();
await page.waitForSelector('.hrg-pin', {timeout: 5000}).catch(() => null);
await page.waitForTimeout(800);
await page.screenshot({path: `${out}/${prefix}-region.png`});
const pin = page.locator('.hrg-pin').nth(3);
if (await pin.count()) {
  await pin.hover();
  await page.waitForTimeout(500);
  await page.screenshot({path: `${out}/${prefix}-region-pin-hover.png`});
  await pin.click();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(800);
  await page.screenshot({path: `${out}/${prefix}-region-pin-active.png`});
}

console.log('ERRORS', JSON.stringify(errors));
await browser.close();
