// Temporaire : vérifie au clavier les corrections ESLint de la table (palette, recherche des coulisses, jet manuel, Échap sur les dés).
import {chromium} from 'playwright';

const base = 'http://localhost:4402';
const shots = '/tmp/claude-1000/-home-lionel-IdeaProjects-diceway/190e7017-c09a-4664-a6d7-a2931953d03d/scratchpad/lint/clavier';
const browser = await chromium.launch({args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
const page = await (await browser.newContext({viewport: {width: 1600, height: 1000}})).newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
const ok = (cond, message) => console.log(cond ? 'OK    ' : 'ÉCHEC ', message);
const active = () => page.evaluate(() => {
  const el = document.activeElement;
  return el ? `${el.tagName.toLowerCase()}#${el.id}.${typeof el.className === 'string' ? el.className.split(' ').join('.') : ''}` : 'aucun';
});
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
// Les dés 3D posés sur la toile : nombre de pixels non transparents (lu dans une capture de la toile).
const diceInk = async (scope) => {
  const canvas = page.locator(`${scope} canvas`).first();
  if (!(await canvas.count())) return -1;
  const buf = await canvas.screenshot({omitBackground: true});
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  }, buf.toString('base64'));
};

await page.goto(base + '/login', {waitUntil: 'networkidle'});
await page.evaluate(async () => {
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email: 'claude-test@example.com', password: 'ClaudeTest123!'})}).then((r) => r.json());
  sessionStorage.setItem('diceway-session', JSON.stringify({token: login.token ?? login.access_token, user: login.user ?? login}));
});

let sessionId = null;
try {
  const heros = await api('GET', 'bol/heros');
  const list = Array.isArray(heros) ? heros : (heros.data ?? []);
  sessionId = (await api('POST', 'bol/fight-session/create', {titre: 'TMP lint clavier', heros: [{heroId: list[0].id, camp: 'heros'}]})).id;
  await api('POST', `bol/fight-session/${sessionId}/combatant`, {kind: 'pnj', sourceId: '2', camp: 'adversaires', qty: 1});
  await page.goto(`${base}/session/${sessionId}/play`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(1500);

  // 1. Palette : la saisie garde le focus, les options ne sont pas des arrêts de Tab, Entrée lance l'option active.
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#pal-input');
  await page.waitForTimeout(600);
  console.log('      focus à l’ouverture :', await active());
  await page.keyboard.type('ouvrir les coulisses');
  await page.waitForTimeout(300);
  const options = await page.locator('.pal-option').count();
  ok(options > 0, `palette : la saisie au clavier filtre (${options} options pour « ouvrir les coulisses »)`);
  console.log('      valeur :', await page.locator('#pal-input').inputValue());
  ok((await page.locator('#pal-input').inputValue()) === 'ouvrir les coulisses', 'palette : la saisie arrive dans le champ (setQuery sans $any)');
  await page.keyboard.press('Tab');
  ok(!(await active()).includes('pal-option'), `palette : Tab ne s'arrête pas sur une option (focus : ${await active()})`);
  await page.locator('#pal-input').focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  console.log('      option active :', await page.locator('.pal-option--active .pal-label').innerText());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  ok((await page.locator('#pal-input').count()) === 0, 'palette : Entrée dans le champ lance l’option active et ferme la palette');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  // Une option qui reçoit le focus (clic, lecteur d'écran) se lance aussi à Entrée.
  await page.keyboard.press('Control+k');
  await page.waitForSelector('#pal-input');
  await page.waitForTimeout(600);
  console.log('      focus à l’ouverture :', await active());
  await page.keyboard.type('fermer les coulisses');
  await page.waitForTimeout(300);
  console.log('      option focalisée :', await page.locator('.pal-option .pal-label').first().innerText());
  await page.locator('.pal-option').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  ok((await page.locator('#pal-input').count()) === 0, 'palette : Entrée sur une option focalisée la lance');
  await page.screenshot({path: `${shots}-1-palette-option.png`});

  // 2. Coulisses : la recherche, tapée au clavier, filtre la liste.
  if (!(await page.locator('#rsv-search-input').isVisible().catch(() => false))) {
    await page.getByRole('button', {name: 'Coulisses', exact: true}).click();
    await page.waitForTimeout(600);
  }
  await page.locator('.rsv-tabs mat-button-toggle').nth(1).locator('button').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const avant = await page.locator('.rsv-row').count();
  await page.locator('#rsv-search-input').focus();
  await page.keyboard.type('zzzz');
  await page.waitForTimeout(400);
  const apres = await page.locator('.rsv-row').count();
  ok(avant > 0 && apres < avant, `coulisses : la recherche au clavier filtre (${avant} → ${apres})`);
  await page.getByRole('button', {name: 'Coulisses', exact: true}).click();
  await page.waitForTimeout(600);

  // 3. Carte d'un héros : le total saisi à table, au clavier ; puis un lancer 3D au clavier, et Échap.
  await page.locator('bol-compagnie .cmp-portrait').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#ard-manual-total');
  await page.waitForTimeout(800);
  await page.locator('#ard-manual-total').focus();
  await page.keyboard.type('9');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  ok((await page.locator('.ard-die--total').innerText().catch(() => '')).trim() === '9', 'carte : le total tapé (onManualTotalInput sans $any) donne le dé « 9 »');
  await page.locator('.ard-go').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4500);
  const inkCard = await diceInk('.ard-dice-layer');
  await page.locator('.ard-go').focus();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  console.log(`      carte : pixels de dés avant Échap ${inkCard} (la carte se ferme à Échap, comme avant)`);
  await page.waitForTimeout(500);

  // 4. Démarrer le combat : un jet 3D lancé au clavier, puis Échap dégage les dés.
  await page.getByRole('button', {name: /Démarrer un combat/}).click();
  await page.waitForSelector('.scd-total');
  await page.waitForTimeout(3000);
  const roller = page.getByRole('button', {name: /Lancer les dés à l’écran pour/}).first();
  await roller.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  const inkStart = await diceInk('.scd-dice-layer');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  const inkStartAfter = await diceInk('.scd-dice-layer');
  ok(inkStart > 0 && inkStartAfter < inkStart, `démarrer le combat : Échap dégage les dés (${inkStart} → ${inkStartAfter} pixels)`);
  await page.screenshot({path: `${shots}-2-start-apres-echap.png`});

  // 5. Combat : le jet d'attaque lancé au clavier, puis Échap dégage les dés.
  for (const input of await page.locator('.scd-total').all()) {
    if (!(await input.inputValue())) {
      await input.click();
      await input.pressSequentially('10');
    }
  }
  await page.getByRole('button', {name: /Commencer le combat/}).click();
  await page.waitForTimeout(2500);
  await page.locator('.tas-cible button').first().click();
  await page.waitForSelector('.tas-dice-btn');
  await page.waitForTimeout(800);
  await page.locator('.tas-dice-btn').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  const inkCombat = await diceInk('.cb-dice');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  const inkCombatAfter = await diceInk('.cb-dice');
  ok(inkCombat > 0 && inkCombatAfter < inkCombat, `combat : Échap dégage les dés (${inkCombat} → ${inkCombatAfter} pixels)`);
  await page.screenshot({path: `${shots}-3-combat-apres-echap.png`});
  // Le clic, lui, les dégage toujours.
  await page.locator('.tas-dice-btn').first().click();
  await page.waitForTimeout(5000);
  const inkClick = await diceInk('.cb-dice');
  await page.mouse.click(800, 900);
  await page.waitForTimeout(800);
  ok(inkClick > 0 && (await diceInk('.cb-dice')) < inkClick, 'combat : un clic dégage toujours les dés');
} finally {
  if (sessionId) await api('DELETE', `bol/fight-session/delete/${sessionId}`).catch(() => undefined);
}
console.log('ERREURS :', JSON.stringify(errors));
await browser.close();
