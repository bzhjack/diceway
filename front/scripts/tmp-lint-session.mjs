// Temporaire : captures et relevés de styles calculés de la table de jeu, avant/après la résorption de la dette de lint.
// Usage : node scripts/tmp-lint-session.mjs <libellé>   (serveur sur le port 4402)
import {writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const label = process.argv[2] ?? 'x';
const base = 'http://localhost:4402';
const out = '/tmp/claude-1000/-home-lionel-IdeaProjects-diceway/190e7017-c09a-4664-a6d7-a2931953d03d/scratchpad/lint/' + label;
const browser = await chromium.launch({args: ['--no-sandbox']});
const context = await browser.newContext({viewport: {width: 1600, height: 1000}, reducedMotion: 'reduce'});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

const PROPS = [
  'color', 'background-color', 'background-image', 'border-top-color', 'border-left-color', 'border-top-width', 'border-left-width',
  'border-top-style', 'border-top-left-radius', 'border-top-right-radius', 'box-shadow', 'text-shadow', 'padding-left', 'padding-top',
  'font-size', 'font-weight', 'line-height', 'letter-spacing', 'display', 'visibility', 'position', 'top', 'left', 'min-width',
  'min-height', 'max-width', 'width', 'height', 'mask-image', 'stroke', 'fill', 'opacity', 'outline-color',
];
const dumps = {};
const dump = async (name) => {
  dumps[name] = await page.evaluate((props) => {
    const result = {};
    const path = (el) => {
      const parts = [];
      for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
        let i = 0;
        for (let s = e.previousElementSibling; s; s = s.previousElementSibling) i++;
        parts.unshift(`${e.tagName.toLowerCase()}:${i}`);
      }
      return parts.join('>');
    };
    for (const el of document.querySelectorAll('body *')) {
      if (['SCRIPT', 'STYLE', 'LINK', 'svg', 'path', 'CANVAS'].includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      const ps = [cs, getComputedStyle(el, '::before'), getComputedStyle(el, '::after')];
      const v = {};
      ['', '::before', '::after'].forEach((pseudo, k) => {
        if (pseudo && ps[k].content === 'none') return;
        for (const p of props) v[pseudo + p] = ps[k].getPropertyValue(p);
      });
      v.cls = typeof el.className === 'string' ? el.className.replace(/ng-\S+|cdk-\S+|mat-focus-indicator|mat-ripple\S*/g, '').trim() : '';
      result[path(el)] = v;
    }
    return result;
  }, PROPS);
};
const shot = async (name) => {
  await page.waitForTimeout(400);
  await page.screenshot({path: `${out}-${name}.png`});
  await dump(name);
};
const api = (method, path, body) =>
  page.evaluate(
    async ({method, path, body}) => {
      const {token} = JSON.parse(sessionStorage.getItem('diceway-session') ?? '{}');
      const headers = {'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + token};
      const res = await fetch('/api/' + path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
      return res.status === 204 ? null : res.json();
    },
    {method, path, body},
  );
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    console.log(`ÉTAPE ${name} : ${String(e).split('\n')[0]}`);
  }
};

await page.goto(base + '/login', {waitUntil: 'domcontentloaded'});
await page.evaluate(async () => {
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email: 'claude-test@example.com', password: 'ClaudeTest123!'})}).then((r) => r.json());
  sessionStorage.setItem('diceway-session', JSON.stringify({token: login.token ?? login.access_token, user: login.user ?? login}));
});
// Les dés 3D tirent au hasard : on fige Math.random pour des captures comparables.
await context.addInitScript(() => {
  let seed = 42;
  Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
});

let sessionId = null;
try {
  const heros = await api('GET', 'bol/heros');
  const list = Array.isArray(heros) ? heros : (heros.data ?? []);
  const session = await api('POST', 'bol/fight-session/create', {titre: 'TMP lint table', heros: list.slice(0, 2).map((h) => ({heroId: h.id, camp: 'heros'}))});
  sessionId = session.id;
  await api('POST', `bol/fight-session/${sessionId}/combatant`, {kind: 'pnj', sourceId: '2', camp: 'adversaires', qty: 1});
  const creatures = await api('GET', 'bol/creature');
  const firstCreature = (Array.isArray(creatures) ? creatures : (creatures.data ?? []))[0];
  await api('POST', `bol/fight-session/${sessionId}/combatant`, {kind: 'creature', sourceId: String(firstCreature.id), camp: 'adversaires', qty: 1});

  await page.goto(`${base}/session/${sessionId}/play`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(1500);
  await shot('01-theatre');

  await step('coulisses', async () => {
    await page.getByRole('button', {name: 'Coulisses', exact: true}).click();
    await page.waitForTimeout(600);
    await shot('02-coulisses');
    await page.locator('.rsv-tabs mat-button-toggle').nth(1).click();
    await page.locator('#rsv-search-input').focus();
    await shot('03-coulisses-pnj');
    await page.locator('#rsv-search-input').fill('a');
    await shot('03b-coulisses-recherche');
    await page.getByRole('button', {name: 'Coulisses', exact: true}).click();
    await page.waitForTimeout(600);
  });

  await step('palette', async () => {
    await page.keyboard.press('Control+k');
    await page.waitForSelector('.pal-shell');
    await page.locator('#pal-input').fill('a');
    await shot('04-palette');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  await step('carte héros', async () => {
    await page.locator('bol-compagnie .cmp-portrait').first().click();
    await page.waitForTimeout(1200);
    await shot('05-carte-heros');
    const manual = page.locator('.ard-manual-input');
    if (await manual.count()) {
      await manual.first().fill('9');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      await shot('07-jet-manuel');
    }
    const menuBtn = page.locator('bol-hero-details [aria-haspopup]').first();
    await menuBtn.click();
    await page.waitForTimeout(500);
    await shot('06-hd-menu');
    await page.mouse.click(5, 990);
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  });

  await step('combat', async () => {
    await page.getByRole('button', {name: /Démarrer un combat/}).click();
    await page.waitForSelector('.scd-total');
    await page.waitForTimeout(3000);
    await shot('08-start-combat');
    for (const input of await page.locator('.scd-total').all()) {
      await input.click();
      await input.pressSequentially('10');
      await page.waitForTimeout(300);
    }
    await shot('08b-start-combat-saisi');
    await page.getByRole('button', {name: /Commencer le combat/}).click();
    await page.waitForTimeout(2500);
    await shot('09-combat');
    await page.locator('.tas-cible button').first().click();
    await page.waitForSelector('.tas-total');
    await page.waitForTimeout(800);
    await shot('10-combat-cible');
    await page.locator('.tas-total').first().fill('11');
    await page.waitForTimeout(2000);
    await shot('11-combat-attaque');
    const pops = page.locator('.tas-scope [aria-haspopup], .tas-scope [aria-expanded]');
    const n = await pops.count();
    for (let i = 0; i < Math.min(n, 4); i++) {
      await step('popover ' + i, async () => {
        await pops.nth(i).click({timeout: 2000});
        await page.waitForTimeout(500);
        await shot(`12-popover-${i}`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      });
    }
    await step('fin du combat', async () => {
      await page.getByRole('button', {name: /Terminer/}).first().click();
      await page.waitForTimeout(1200);
      await shot('13-terminer');
      const confirm = page.locator('mat-dialog-container button.mat-mdc-unelevated-button, mat-dialog-container [mat-flat-button]');
      if (await confirm.count()) {
        await confirm.first().click();
        await page.waitForTimeout(1500);
        await shot('14-apres-combat');
      }
    });
  });
} finally {
  if (sessionId) await api('DELETE', `bol/fight-session/delete/${sessionId}`).catch(() => undefined);
}
writeFileSync(`${out}-dumps.json`, JSON.stringify(dumps));
console.log('ERREURS :', JSON.stringify(errors));
await browser.close();
