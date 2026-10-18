// Scénario : le théâtre du mode libre. Une scène préparée se charge rideau fermé, son cartouche et son secret s'affichent, un
// personnage entre depuis les coulisses ; une scène bondée ne fait pas défiler la page en largeur ; une illustration cassée
// retombe sur la carte de la région.
// Lancer son propre `npx ng serve --port 4400` d'abord ; ne jamais utiliser le port 4200 (serveur IntelliJ de Lionel).
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';

const base = process.env.DICEWAY_BASE_URL ?? 'http://localhost:4400';
// Compte de test (voir la mémoire du projet) ; surchargeable par l'environnement.
const email = process.env.DICEWAY_TEST_EMAIL ?? 'claude-test@example.com';
const password = process.env.DICEWAY_TEST_PASSWORD ?? 'ClaudeTest123!';
const shots = process.env.DICEWAY_SHOTS ?? tmpdir();
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: {width: 1440, height: 900}})).newPage();

const errors = [];
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
page.on('pageerror', (err) => errors.push(String(err)));

const fail = (message) => {
  console.error('ÉCHEC :', message);
  process.exitCode = 1;
};

/** Appel de l'API depuis la page, avec le jeton de la session de test. */
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

/** Débordements mesurés là où ils peuvent se produire (la page elle-même masque tout débordement) : la scène du plateau
 * (ce qui défile devant le décor) en largeur et en hauteur, la piste de la troupe et la lecture, qui doivent défiler
 * chacune dans sa zone. */
const debordements = () =>
  page.evaluate(() => {
    const el = (sel) => document.querySelector(sel);
    const plateau = el('.thr-scene');
    const piste = el('bol-troupe .dws-track');
    const lecture = el('bol-scene-lecture');
    return {
      plateauLargeur: plateau.scrollWidth - plateau.clientWidth,
      plateauHauteur: plateau.scrollHeight - plateau.clientHeight,
      pisteTroupe: piste ? piste.scrollWidth - piste.clientWidth : 0,
      lecture: lecture ? lecture.scrollHeight - lecture.clientHeight : 0,
    };
  });
const troupeCount = () => page.locator('bol-troupe .trp-slot').count();

await page.goto(base + '/login', {waitUntil: 'domcontentloaded'});
await page.evaluate(async ({email, password}) => {
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email, password})}).then((r) => r.json());
  sessionStorage.setItem('diceway-session', JSON.stringify({token: login.token ?? login.access_token, user: login.user ?? login}));
}, {email, password});

let sessionId = null;
let sceneId = null;
try {
  // Préparation : une session avec un héros et un PNJ, enregistrée comme scène préparée ; puis dix créatures à la place du PNJ.
  const heros = await api('GET', 'bol/heros');
  const firstHero = (Array.isArray(heros) ? heros : (heros.data ?? []))[0];
  const session = await api('POST', 'bol/fight-session/create', {titre: 'TMP théâtre', heros: [{heroId: firstHero.id, camp: 'heros'}], pnjs: [], creatures: [], demons: []});
  sessionId = session.id;
  await api('POST', `bol/fight-session/${sessionId}/combatant`, {kind: 'pnj', sourceId: '2', camp: 'adversaires', qty: 1});
  const scene = await api('POST', 'bol/scene/create', {titre: 'TMP Gué', scenario_id: null, session_id: sessionId});
  sceneId = scene.id;
  await api('POST', 'bol/scene/update', {
    id: sceneId,
    region_id: 5,
    lieu: 'Gué du Tyr',
    moment: 'crepuscule',
    meteo: 'pluie',
    danger: 3,
    lecture: 'La pluie chaude martèle les fougères géantes. '.repeat(60),
    notes: 'Le sceau est dans la sacoche du chef.',
    pistes: [{texte: 'Suivre les traces vers le nord', scene_id: null}],
  });
  const withPnj = await api('GET', `bol/fight-session/${sessionId}`);
  await api('DELETE', `bol/fight-session/${sessionId}/combatant/pnj/${withPnj.pnjs[0].id}`);
  const creatures = await api('GET', 'bol/creature');
  const firstCreature = (Array.isArray(creatures) ? creatures : (creatures.data ?? []))[0];
  const addCrowd = () => api('POST', `bol/fight-session/${sessionId}/combatant`, {kind: 'creature', sourceId: String(firstCreature.id), camp: 'adversaires', qty: 10});
  await addCrowd();

  // 1-2. Lever le rideau sur la scène : il se ferme puis se rouvre, le cartouche montre son titre.
  await page.goto(`${base}/session/${sessionId}/play`, {waitUntil: 'networkidle'});
  await page.getByRole('button', {name: /TMP Gué/}).click();
  await page.getByRole('menuitem', {name: 'Lever le rideau'}).click();
  await page.waitForSelector('bol-rideau.rdo--ferme', {timeout: 3000}).catch(() => fail('le rideau ne s’est pas fermé'));
  await page.waitForSelector('bol-rideau:not(.rdo--ferme)', {timeout: 8000}).catch(() => fail('le rideau ne s’est pas rouvert'));
  await page.waitForTimeout(800);
  const titre = (await page.locator('bol-scene-cartouche h2').innerText()).trim();
  if (titre !== 'TMP Gué') fail(`le cartouche montre « ${titre} » au lieu de « TMP Gué »`);
  await page.screenshot({path: `${shots}/theatre-1-scene.png`});

  // 3. Le chargement en remplacement a retiré les dix créatures et ramené le PNJ.
  if ((await troupeCount()) !== 1) fail(`la troupe compte ${await troupeCount()} cartes au lieu d’une`);

  // 4. Le secret s'affiche à la demande.
  await page.getByRole('button', {name: 'Afficher le secret'}).click();
  const pressed = await page.getByRole('button', {name: 'Masquer le secret'}).getAttribute('aria-pressed');
  if (pressed !== 'true') fail('le bouton du secret n’est pas pressé');

  // 5. Un PNJ glissé des coulisses sur la troupe entre en scène (zone de dépôt `adversaires`).
  const avant = await troupeCount();
  await page.getByRole('button', {name: 'Coulisses', exact: true}).click();
  await page.getByRole('radio', {name: 'PNJ'}).or(page.getByRole('button', {name: 'PNJ', exact: true})).first().click();
  await page.waitForTimeout(500);
  const ligne = await page.locator('.rsv-row:not(.rsv-row--on-table)').first().boundingBox();
  const rampe = await page.locator('bol-troupe .trp').boundingBox();
  await page.mouse.move(ligne.x + 40, ligne.y + ligne.height / 2);
  await page.mouse.down();
  await page.mouse.move(ligne.x + 30, ligne.y + ligne.height / 2 + 10, {steps: 3});
  await page.mouse.move(rampe.x + rampe.width / 2, rampe.y + rampe.height / 2, {steps: 15});
  await page.mouse.up();
  await page.waitForTimeout(1500);
  if ((await troupeCount()) !== avant + 1) fail('le PNJ glissé depuis les coulisses n’est pas entré en scène');
  await page.screenshot({path: `${shots}/theatre-2-coulisses.png`});

  // 6. Scène bondée, texte à lire très long : le plateau ne déborde pas en largeur ; la troupe et la lecture défilent
  // chacune dans leur zone (à 1440 × 900, le plateau tient sans défiler).
  await addCrowd();
  // Les coulisses, ouvertes à l'étape 5, sont refermées : le plateau est mesuré dans toute sa largeur.
  await page.getByRole('button', {name: 'Coulisses', exact: true}).click();
  for (const [width, height] of [[1440, 900], [1024, 768]]) {
    await page.setViewportSize({width, height});
    await page.reload({waitUntil: 'networkidle'});
    await page.waitForTimeout(800);
    const d = await debordements();
    console.log(`Débordements à ${width}px :`, JSON.stringify(d));
    if (d.plateauLargeur > 1) fail(`le plateau déborde en largeur à ${width}px (${d.plateauLargeur}px)`);
    if (d.pisteTroupe <= 0) fail(`la troupe bondée ne défile pas dans sa piste à ${width}px`);
    if (width === 1440 && d.plateauHauteur > 1) fail(`le plateau défile en hauteur à 1440 × 900 (${d.plateauHauteur}px)`);
    if (width === 1440 && d.lecture <= 0) fail('le long texte à lire ne défile pas dans sa colonne');
    await page.screenshot({path: `${shots}/theatre-3-bondee-${width}.png`});
  }

  // 7. Une illustration qui ne se charge pas retombe sur la carte de la région.
  await api('POST', 'bol/scene/update', {id: sceneId, image: '/assets/bol/nexiste-pas.jpg'});
  await page.reload({waitUntil: 'networkidle'});
  await page.waitForTimeout(800);
  const decor = (await page.locator('bol-scene-decor').getAttribute('class')) ?? '';
  if (!decor.includes('dcr--carte')) fail(`le décor ne retombe pas sur la carte (classes : ${decor})`);

  // 8. Aucune erreur dans la console, hormis l'illustration absente voulue.
  const unexpected = errors.filter((error) => !error.includes('404'));
  if (unexpected.length) fail('erreurs dans la console : ' + unexpected.join(' | '));
} finally {
  if (sceneId) await api('DELETE', `bol/scene/delete/${sceneId}`).catch(() => undefined);
  if (sessionId) await api('DELETE', `bol/fight-session/delete/${sessionId}`).catch(() => undefined);
}

console.log(process.exitCode ? 'Scénario en échec.' : `Scénario du théâtre : OK (captures dans ${shots}).`);
await browser.close();
