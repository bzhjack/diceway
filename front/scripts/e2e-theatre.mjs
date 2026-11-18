// Scénario : la table en mode libre (le théâtre), puis l'ajout de personnages en combat.
// Un scénario jetable « TMP Théâtre » (un chapitre, deux scènes) et une table « TMP théâtre » sont créés par l'API, puis supprimés à la fin.
// On vérifie : la première scène chargée d'office, son bandeau et sa carte ; « En face » (les exemplaires d'une fiche en paquet, la pastille
// de l'attitude) ; les onglets du carnet, un jet lancé pour un héros ; une piste et la frise qui chargent une scène, rideau fermé ;
// « Préparer la scène » aller-retour ; « Ajouter un personnage » par le casting ; une scène bondée qui tient à l'écran de référence ; une
// illustration cassée qui retombe sur le décor par défaut ; le « + » de l'ordre d'action qui ouvre le casting en combat.
// Lancer son propre `npx ng serve --port 4400` d'abord ; ne jamais utiliser le port 4200 (serveur IntelliJ de Lionel).
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';

const base = process.env.DICEWAY_BASE_URL ?? 'http://localhost:4400';
// Compte de test (voir la mémoire du projet) ; surchargeable par l'environnement.
const email = process.env.DICEWAY_TEST_EMAIL ?? 'claude-test@example.com';
const password = process.env.DICEWAY_TEST_PASSWORD ?? 'ClaudeTest123!';
const shots = process.env.DICEWAY_SHOTS ?? tmpdir();
// L'écran de référence de Diceway (CLAUDE.md) : ce que la table montre doit y tenir sans défiler.
const ECRAN = {width: 1440, height: 704};
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: ECRAN})).newPage();

const errors = [];
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
page.on('pageerror', (err) => errors.push(String(err)));

const fail = (message) => {
  console.error('ÉCHEC :', message);
  process.exitCode = 1;
};
const etape = (titre) => console.log('—', titre);

/** Appel de l'API depuis la page, avec le jeton de la session de test. */
const api = (method, path, body) =>
  page.evaluate(
    async ({method, path, body}) => {
      const {token} = JSON.parse(sessionStorage.getItem('diceway-session') ?? '{}');
      const headers = {'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + token};
      const res = await fetch('/api/' + path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
      if (!res.ok) throw new Error(`${method} ${path} : ${res.status} ${await res.text()}`);
      return res.status === 204 ? null : res.json();
    },
    {method, path, body},
  );
const liste = (reponse) => (Array.isArray(reponse) ? reponse : (reponse.data ?? []));

/** Les personnages non héros de la table, d'après l'API (les tuiles regroupent les exemplaires d'une fiche). */
const nonHeros = async () => {
  const session = await api('GET', `bol/fight-session/${sessionId}`);
  return (session.pnjs?.length ?? 0) + (session.creatures?.length ?? 0) + (session.demons?.length ?? 0);
};
const titreDeLaScene = async () => (await page.locator('bol-scene-cartouche .ctc-titre').innerText()).trim();
const tuilesEnFace = () => page.locator('.sit-grille--face > li');
const onglet = (nom) => page.locator('bol-scene-lecture .lec-onglet', {hasText: nom});

/** Charge une scène depuis un menu d'aperçu déjà ouvert : le rideau se ferme, puis se rouvre sur elle. */
const chargerDepuisLApercu = async (titre) => {
  await page.locator('.thr-apercu-charger').click();
  await page.waitForSelector('bol-rideau.rdo--ferme', {timeout: 3000}).catch(() => fail(`le rideau ne s’est pas fermé pour « ${titre} »`));
  await page.waitForSelector('bol-rideau:not(.rdo--ferme)', {timeout: 10000}).catch(() => fail(`le rideau ne s’est pas rouvert sur « ${titre} »`));
  await page.waitForTimeout(600);
  if ((await titreDeLaScene()) !== titre) fail(`le bandeau montre « ${await titreDeLaScene()} » au lieu de « ${titre} »`);
};

/** Le casting déjà ouvert : choisit la première fiche ajoutable, puis « Ajouter à la table » ; rend le nombre de non-héros d'avant. */
const ajouterParLeCasting = async () => {
  const avant = await nonHeros();
  const casting = page.locator('bol-personnages-dialog');
  await casting.waitFor();
  const titre = (await casting.locator('.pdg-distribution-titre').innerText()).trim();
  if (titre !== 'À ajouter à la table') fail(`le casting s’ouvre sur « ${titre} » au lieu de « À ajouter à la table »`);
  await casting.locator('.pdg-tuile-plus:not([disabled])').first().click();
  await casting.getByRole('button', {name: 'Ajouter à la table'}).click();
  await casting.waitFor({state: 'detached'});
  await page.waitForTimeout(800);
  return avant;
};

await page.goto(base + '/login', {waitUntil: 'domcontentloaded'});
await page.evaluate(async ({email, password}) => {
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email, password})}).then((r) => r.json());
  sessionStorage.setItem('diceway-session', JSON.stringify({token: login.token ?? login.access_token, user: login.user ?? login}));
}, {email, password});

let sessionId = null;
let sagaId = null;
try {
  // ── Préparation, par l'API : un chapitre de deux scènes ; la première porte tout (texte, jets, pistes, distribution), la seconde rien.
  const hero = liste(await api('GET', 'bol/heros'))[0];
  const creatures = liste(await api('GET', 'bol/creature'));
  const chapitre = await api('POST', 'bol/scenario/create', {titre: 'TMP Théâtre — 1. Le gué'});
  sagaId = chapitre.saga.id;
  const gue = await api('POST', 'bol/scene/create', {titre: 'TMP Gué', scenario_id: chapitre.id});
  const citadelle = await api('POST', 'bol/scene/create', {titre: 'TMP Citadelle', scenario_id: chapitre.id});
  await api('POST', 'bol/scene/update', {
    id: gue.id,
    region_id: 5,
    lieu: 'Gué du Tyr',
    moment: 'crepuscule',
    meteo: 'pluie',
    danger: 3,
    lecture: 'La pluie chaude martèle les fougères géantes. '.repeat(60),
    jeu: 'Le courant est fort.\nUn faux pas, et c’est la noyade.',
    notes: 'Le sceau est dans la sacoche du chef.',
    jets: [{titre: 'Passer le gué', attributs: ['agilite'], difficulte: 'ardue', enjeu: 'traverser', echec: 'emporté, d3 dégâts', reussite: null, carriere: null, quand: null}],
    pistes: [{texte: 'Suivre les traces vers la citadelle', scene_id: citadelle.id}],
    distribution: [
      {kind: 'pnj', source_id: '2', qty: 1, camp: 'adversaires', attitude: 'hostile'},
      {kind: 'creature', source_id: String(creatures[0].id), qty: 3, camp: 'adversaires', attitude: null},
    ],
  });
  // La table : un héros, sur ce chapitre ; prendre le chapitre charge sa première scène.
  const session = await api('POST', 'bol/fight-session/create', {titre: 'TMP théâtre', heros: [{heroId: hero.id, camp: 'heros'}], pnjs: [], creatures: [], demons: []});
  sessionId = session.id;
  await api('PATCH', `bol/fight-session/${sessionId}/scenario`, {scenario_id: chapitre.id});

  etape('1. La première scène est sur la table : son bandeau, la frise de ses deux scènes');
  await page.goto(`${base}/session/${sessionId}/play`, {waitUntil: 'networkidle'});
  await page.locator('bol-scene-cartouche .ctc-titre').waitFor();
  if ((await titreDeLaScene()) !== 'TMP Gué') fail(`le bandeau montre « ${await titreDeLaScene()} » au lieu de « TMP Gué »`);
  if ((await page.locator('bol-scene-acts .sca-acte').count()) !== 2) fail('la frise ne montre pas les deux scènes du chapitre');
  await page.screenshot({path: `${shots}/theatre-1-scene.png`});

  etape('2. Le lieu ouvre la carte de Lémurie, la région cerclée ; Échap la referme et rend le focus au lieu');
  await page.getByRole('button', {name: 'Gué du Tyr, Jungle de Qo et jungle de Qush : voir sur la carte'}).click();
  await page.waitForFunction(() => document.querySelector('bol-carte-dialog img.crt-image')?.complete);
  const largeurCarte = await page.locator('bol-carte-dialog img.crt-image').evaluate((img) => img.naturalWidth);
  if (largeurCarte !== 1248) fail(`la carte HD ne s’est pas chargée (largeur ${largeurCarte})`);
  if (!(await page.locator('bol-carte-dialog .crt-repere').isVisible())) fail('la région n’est pas cerclée sur la carte');
  await page.keyboard.press('Escape');
  await page.locator('bol-carte-dialog').waitFor({state: 'detached'});
  if (!(await page.evaluate(() => document.activeElement?.classList.contains('ctc-lieu-carte')))) fail('le focus ne revient pas au lieu après la carte');

  etape('3. « En face » : le PNJ hostile et les trois créatures en paquet');
  if ((await nonHeros()) !== 4) fail(`la table compte ${await nonHeros()} personnages en face au lieu de 4`);
  if ((await tuilesEnFace().count()) !== 2) fail(`« En face » montre ${await tuilesEnFace().count()} tuiles au lieu de 2 (le PNJ, les créatures en paquet)`);
  if (!(await tuilesEnFace().filter({hasText: '×3'}).count())) fail('les trois créatures ne sont pas en paquet « ×3 »');
  if (!(await page.locator('.sit-grille--face .sit-attitude bol-attitude-puce.apu--hostile').count())) fail('la pastille hostile manque après le nom du PNJ');

  etape('4. Le carnet : ses onglets, la mise en scène, le secret, un jet lancé pour le héros');
  for (const nom of ['À lire aux joueurs', 'Jets', 'Mise en scène', 'Secret du MJ', 'Pistes']) {
    if (!(await onglet(nom).count())) fail(`l’onglet « ${nom} » manque au carnet`);
  }
  await onglet('Mise en scène').click();
  if ((await page.locator('.lec-jeu').innerText()).trim() !== 'Le courant est fort.\nUn faux pas, et c’est la noyade.') fail('« Mise en scène » ne garde pas ses lignes');
  await onglet('Secret du MJ').click();
  if ((await page.locator('.lec-secret').innerText()).trim() !== 'Le sceau est dans la sacoche du chef.') fail('le secret du MJ ne s’affiche pas');
  await onglet('Jets').click();
  await page.locator('.scj-lancer').first().click();
  await page.locator('.mat-mdc-menu-item').first().click();
  await page.locator('bol-expanded-card bol-action-roll-panel').waitFor({timeout: 4000}).catch(() => fail('« Lancer pour » n’ouvre pas la carte du héros sur son jet'));
  await page.screenshot({path: `${shots}/theatre-2-jet.png`});
  await page.reload({waitUntil: 'networkidle'});

  etape('5. Une piste charge sa scène, rideau fermé ; la frise ramène la première');
  await onglet('Pistes').click();
  await page.locator('.lec-piste').first().click();
  await chargerDepuisLApercu('TMP Citadelle');
  if ((await nonHeros()) !== 0) fail('la scène vide n’a pas remplacé ceux d’en face');
  await page.locator('bol-scene-acts .sca-acte').first().click();
  await chargerDepuisLApercu('TMP Gué');
  if ((await nonHeros()) !== 4) fail('la frise n’a pas ramené ceux d’en face de la première scène');

  etape('6. « Préparer la scène » depuis le carnet, puis retour à la table, la mise en scène changée');
  await page.locator('bol-scene-lecture .lec-preparer').click();
  await page.locator('.sfp-onglet', {hasText: 'Mise en scène'}).click();
  const champJeu = page.locator('#sfp-jeu');
  await champJeu.waitFor();
  await page.screenshot({path: `${shots}/theatre-3-preparer.png`});
  await champJeu.fill('Le courant a baissé.');
  await page.getByRole('button', {name: 'Enregistrer'}).click();
  await page.waitForURL(`**/session/${sessionId}/play`);
  await onglet('Mise en scène').click();
  if ((await page.locator('.lec-jeu').innerText()).trim() !== 'Le courant a baissé.') fail('la mise en scène n’est pas à jour au retour à la table');

  etape('7. « Ajouter un personnage » : le casting, et la fiche choisie entre à la table');
  await page.getByRole('button', {name: 'Ajouter un personnage'}).click();
  const avantAjout = await ajouterParLeCasting();
  if ((await nonHeros()) !== avantAjout + 1) fail('le personnage choisi dans le casting n’est pas entré à la table');
  await page.screenshot({path: `${shots}/theatre-4-casting.png`});

  etape('8. Une scène bondée tient à l’écran de référence : rien ne déborde de la page, « En face » et le texte défilent seuls');
  await api('POST', `bol/fight-session/${sessionId}/personnages`, {
    distribution: creatures.slice(1, 15).map((c) => ({kind: 'creature', source_id: String(c.id), qty: 1, camp: 'adversaires', attitude: null})),
  });
  await page.reload({waitUntil: 'networkidle'});
  await page.waitForTimeout(800);
  const mesures = await page.evaluate(() => {
    const el = (sel) => document.querySelector(sel);
    const page = document.scrollingElement;
    return {
      pageLargeur: page.scrollWidth - page.clientWidth,
      pageHauteur: page.scrollHeight - page.clientHeight,
      enFace: el('.sit-grille--face').scrollHeight - el('.sit-grille--face').clientHeight,
      lecture: el('bol-scene-lecture .lec-corps').scrollHeight - el('bol-scene-lecture .lec-corps').clientHeight,
    };
  });
  console.log('  débordements :', JSON.stringify(mesures));
  if (mesures.pageLargeur > 1) fail(`la page déborde en largeur (${mesures.pageLargeur}px)`);
  if (mesures.pageHauteur > 1) fail(`la page défile en hauteur (${mesures.pageHauteur}px)`);
  if (mesures.enFace <= 0) fail('« En face », bondé, ne défile pas dans sa colonne');
  if (mesures.lecture <= 0) fail('le long texte à lire ne défile pas dans le carnet');
  await page.screenshot({path: `${shots}/theatre-5-bondee.png`});

  etape('9. Une illustration qui ne se charge pas retombe sur le décor par défaut');
  await api('POST', 'bol/scene/update', {id: gue.id, image: '/assets/bol/nexiste-pas.jpg'});
  await page.reload({waitUntil: 'networkidle'});
  await page.waitForTimeout(800);
  const decor = (await page.locator('bol-scene-decor').first().getAttribute('class')) ?? '';
  if (!decor.includes('dcr--defaut')) fail(`le décor ne retombe pas sur l’image par défaut (classes : ${decor})`);

  etape('10. En combat, le « + » de l’ordre d’action ouvre le casting ; la fiche choisie rejoint le combat');
  await page.getByRole('button', {name: /Démarrer un combat/}).click();
  await page.locator('.scd-total').first().waitFor();
  await page.locator('.scd-total').first().fill('10');
  await page.getByRole('button', {name: /Commencer le combat/}).click();
  await page.waitForURL(`**/session/${sessionId}/play`);
  await page.getByRole('button', {name: 'Ajouter un combattant'}).click();
  const avantCombat = await ajouterParLeCasting();
  if ((await nonHeros()) !== avantCombat + 1) fail('le personnage choisi en combat n’est pas entré à la table');
  if ((await api('GET', `bol/fight-session/${sessionId}`)).statut !== 'combat') fail('la table n’est plus en combat après l’ajout');
  await page.screenshot({path: `${shots}/theatre-6-combat.png`});

  etape('11. Aucune erreur dans la console, hormis l’illustration absente voulue');
  const imprevues = errors.filter((error) => !error.includes('404'));
  if (imprevues.length) fail('erreurs dans la console : ' + imprevues.join(' | '));
} catch (error) {
  fail(String(error));
} finally {
  // Rien ne reste sur le compte de test : la table d'abord (un scénario joué ne se supprime pas), puis le scénario et ses scènes.
  if (sessionId) await api('DELETE', `bol/fight-session/delete/${sessionId}`).catch(() => undefined);
  if (sagaId) await api('DELETE', `bol/saga/${sagaId}`).catch(() => undefined);
}

console.log(process.exitCode ? 'Scénario en échec.' : `Scénario du théâtre : OK (captures dans ${shots}).`);
await browser.close();
