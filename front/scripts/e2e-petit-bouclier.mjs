// Scénario : un PNJ porte un petit bouclier (−1 à une attaque subie par round). Le −1 pèse sur le premier jet, reste à la relance, et tombe
// pour un second jet contre la même cible dans le même round.
// Lancer son propre `npx ng serve --port 4400` d'abord ; ne jamais utiliser le port 4200 (serveur IntelliJ de Lionel).
import {chromium} from 'playwright';

const base = process.env.DICEWAY_BASE_URL ?? 'http://localhost:4400';
// Compte de test (voir la mémoire du projet) ; surchargeable par l'environnement.
const email = process.env.DICEWAY_TEST_EMAIL ?? 'claude-test@example.com';
const password = process.env.DICEWAY_TEST_PASSWORD ?? 'ClaudeTest123!';
const browser = await chromium.launch({args: ['--no-sandbox']});
const page = await (await browser.newContext({viewport: {width: 1700, height: 1000}})).newPage();

await page.goto(base + '/login', {waitUntil: 'domcontentloaded'});
const {id} = await page.evaluate(async ({email, password}) => {
  const json = (r) => r.json();
  const login = await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({email, password})}).then(json);
  const token = login.token ?? login.access_token;
  sessionStorage.setItem('diceway-session', JSON.stringify({token, user: login.user ?? login}));
  const headers = {'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + token};
  const heros = await fetch('/api/bol/heros', {headers}).then(json);
  const list = Array.isArray(heros) ? heros : (heros.data ?? []);
  const session = await fetch('/api/bol/fight-session/create', {method: 'POST', headers, body: JSON.stringify({titre: 'TMP bouclier', heros: [{heroId: list[0].id, camp: 'heros'}]})}).then(json);
  await fetch(`/api/bol/fight-session/${session.id}/combatant`, {method: 'POST', headers, body: JSON.stringify({kind: 'pnj', sourceId: '2', camp: 'adversaires', qty: 1})});
  return {id: session.id};
}, {email, password});

// Le PNJ porte un petit bouclier : −1 à une attaque subie par round.
await page.route(/\/api\/bol\/heros\/[^/?]+$/, async (route) => {
  if (route.request().method() !== 'GET') return route.continue();
  const res = await route.fetch();
  const body = await res.json();
  body.equipement_effectif = {...(body.equipement_effectif ?? {}), bouclier_malus_attaque_subie: 1, bouclier_malus_attaque_subie_portee: 'une'};
  await route.fulfill({response: res, json: body});
});

const fail = (message) => {
  console.error('ÉCHEC :', message);
  process.exitCode = 1;
};
const attackTerms = async () => (await page.locator('.tas-rolls .tas-step').first().locator('.tas-terms').innerText()).replace(/\n/g, ' | ');
const total = async () => page.locator('.tas-rolls .tas-step').first().locator('.tas-ticket-total').innerText();

await page.goto(`${base}/session/${id}/play`, {waitUntil: 'networkidle'});
await page.getByRole('button', {name: /Démarrer un combat/}).click();
await page.waitForTimeout(1500);
const reaction = page.locator('.scd-input--manual').first();
await reaction.fill('10');
await reaction.dispatchEvent('change');
await page.getByRole('button', {name: /Commencer le combat/}).click();
await page.waitForTimeout(2500);
await page.locator('.tas-fighter .tas-target').first().click();
await page.waitForTimeout(800);

const roll = async (value) => {
  await page.locator('.tas-step--roll .tas-manual input').fill(String(value));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000); // laisse l'état s'enregistrer et la session se recharger
};

if (!(await attackTerms()).includes('− 1 bouclier')) fail('le −1 du bouclier manque avant le premier jet');
await roll(11);
if (!(await attackTerms()).includes('− 1 bouclier')) fail('le −1 du bouclier a disparu après le premier jet (rechargement de la session ?)');
if ((await total()).trim() === '—') fail('le jet a été effacé par le rechargement de la session');
await roll(10);
if (!(await attackTerms()).includes('− 1 bouclier')) fail('le −1 du bouclier a disparu à la relance');

// Nouvelle attaque (changement d'arme) contre la même cible, même round : plus de bouclier.
const armes = page.locator('.tas-group[aria-label="Arme"] .tas-chip');
if ((await armes.count()) > 1) {
  await armes.nth(1).click();
  await page.waitForTimeout(1000);
  if ((await attackTerms()).includes('bouclier')) fail('le bouclier pèse encore sur la deuxième attaque du round');
} else {
  console.warn("Une seule arme : la deuxième attaque n'est pas vérifiée.");
}

console.log(process.exitCode ? 'Scénario en échec.' : 'Scénario du petit bouclier : OK.');
await browser.close();
