// Script temporaire : menus d'ajout au clavier, clic dans le contenu, zone de clic des clous de carte. À supprimer.
import {chromium} from 'playwright';

const base = 'http://localhost:4403';
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: {width: 1500, height: 1000}})).newPage();
const fail = (m) => { console.error('ÉCHEC :', m); process.exitCode = 1; };

let hero;
for (let i = 0; i < 5 && !hero; i++) {
  await page.goto(base + '/login', {waitUntil: 'networkidle'});
  hero = await page.evaluate(async () => {
  const json = (r) => r.json();
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email: 'claude-test@example.com', password: 'ClaudeTest123!'})}).then(json);
  const token = login.token ?? login.access_token;
  sessionStorage.setItem('diceway-session', JSON.stringify({token, user: login.user ?? login}));
  const r = await fetch('/api/bol/heros', {headers: {Accept: 'application/json', Authorization: 'Bearer ' + token}}).then(json);
  return (Array.isArray(r) ? r : r.data)[0].id;
}).catch(() => null);
}

await page.goto(`${base}/create/hero/${hero}`, {waitUntil: 'networkidle'});
await page.waitForTimeout(1000);

const actif = () => page.evaluate(() => {
  const el = document.activeElement;
  return `${el?.tagName} ${el?.getAttribute('role') ?? ''} « ${(el?.textContent ?? '').trim().slice(0, 30)} » dansMenu=${!!el?.closest('.mat-mdc-menu-panel')}`;
});
for (const [nom, selector, rowSel] of [['traits', 'bol-trait-add-menu .dw-add-trigger', 'bol-trait-list'], ['menu générique', 'bol-add-menu .dw-add-trigger', null]]) {
  // Tout au clavier : Entrée sur « + », Tab jusqu'au select, Entrée l'ouvre, flèche bas + Entrée choisit, Tab jusqu'à « Ajouter », Entrée.
  await page.locator(selector).first().focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.mat-mdc-menu-panel');
  await page.waitForTimeout(600);
  console.log(nom, ': focus après Entrée sur +', await actif());
  let surSelect = false;
  for (let i = 0; i < 4 && !surSelect; i++) {
    surSelect = await page.evaluate(() => document.activeElement?.getAttribute('role') === 'combobox');
    if (!surSelect) await page.keyboard.press('Tab');
  }
  if (!surSelect) { fail(`${nom} : le select ne se joint pas au clavier (${await actif()})`); await page.keyboard.press('Escape'); continue; }
  await page.keyboard.press('Enter');
  await page.waitForSelector('mat-option');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  console.log(nom, ': option choisie =', JSON.stringify((await page.locator('.mat-mdc-menu-panel mat-select').first().innerText()).trim()));
  const ordre = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await actif());
  }
  console.log(nom, ': ordre du Tab\n   ' + ordre.join('\n   '));
  if (!(await page.locator('.mat-mdc-menu-panel').count())) fail(`${nom} : Tab ferme le menu`);
  let surAjouter = false;
  for (let i = 0; i < 6 && !surAjouter; i++) {
    surAjouter = await page.evaluate(() => (document.activeElement?.textContent ?? '').includes('Ajouter'));
    if (!surAjouter) await page.keyboard.press('Shift+Tab');
  }
  if (!surAjouter) fail(`${nom} : « Ajouter » ne se joint pas au clavier`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  if (await page.locator('.mat-mdc-menu-panel').count()) fail(`${nom} : Entrée sur « Ajouter » ne ferme pas le menu`);
  console.log(nom, ': focus rendu à', await actif());
  if (rowSel) console.log(nom, ': lignes après ajout =', await page.locator(`${rowSel} .dw-row-toggle`).count());
  // Souris : le focus reste où mat-menu le met (pas dans un champ), et un clic dans le contenu garde le menu ouvert.
  await page.locator(selector).first().click();
  await page.waitForTimeout(600);
  console.log(nom, ': focus après clic sur +', await actif());
  const box = await page.locator('.mat-mdc-menu-panel [role="presentation"]').first().boundingBox();
  await page.mouse.click(box.x + 4, box.y + box.height - 4);
  await page.waitForTimeout(300);
  if (!(await page.locator('.mat-mdc-menu-panel').count())) fail(`${nom} : un clic dans le contenu ferme le menu`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  if (await page.locator('.mat-mdc-menu-panel').count()) fail(`${nom} : Échap ne ferme pas le menu`);
}

// Zone de clic des clous d'une carte de bibliothèque : 26 px, comme avant.
await page.goto(`${base}/library/demons`, {waitUntil: 'networkidle'});
await page.waitForTimeout(800);
const size = await page.locator('.entity-card__action-btn .mat-mdc-button-touch-target').first().evaluate((el) => {
  const s = getComputedStyle(el);
  return `${s.width} x ${s.height}`;
});
console.log('zone de clic du clou :', size);
if (size !== '26px x 26px') fail('zone de clic du clou ≠ 26 px');

// Grille de stats : taille des compteurs.
await page.goto(`${base}/create/hero/${hero}`, {waitUntil: 'networkidle'});
await page.waitForTimeout(800);
const vs = await page.locator('.hs-cell .vs__value').first().evaluate((el) => {
  const s = getComputedStyle(el);
  return `${s.fontSize} ${s.width} ${s.height}`;
});
const btn = await page.locator('.hs-cell .vs__btn').first().evaluate((el) => {
  const s = getComputedStyle(el);
  return `${s.fontSize} ${s.width} ${s.height}`;
});
console.log('compteur de la grille :', vs, '| bouton :', btn);
await browser.close();
