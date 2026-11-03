import {BolAccueilScenario, BolAccueilTable} from '../../models/bol-accueil.model';
import {
  AccueilChapitre,
  AccueilRepere,
  AccueilSaga,
  AccueilSagaAction,
  AccueilSagaResume,
  AccueilSagaSuite,
  AccueilSceneRepere,
  AccueilTableOuverte,
  ChapitreEtat,
  SceneEtat,
  ScenarioSitue,
} from '../models/accueil.model';
import {findScenario} from '../scenario.util';

const SEPARATEUR = ' — ';

interface Decoupe {
  saga: string | null;
  libelle: string;
}

/** Un titre « Saga — chapitre » se coupe au premier tiret cadratin ; sans tiret, ou avec une moitié vide, il est hors saga. */
function decouper(titre: string): Decoupe {
  const coupe = titre.indexOf(SEPARATEUR);
  if (coupe >= 0) {
    const saga = titre.slice(0, coupe).trim();
    const libelle = titre.slice(coupe + SEPARATEUR.length).trim();
    if (saga && libelle) {
      return {saga, libelle};
    }
  }
  return {saga: null, libelle: titre};
}

/** La clé d'une saga : son nom sans tenir compte de la casse (« Perle du Beshaar » et « PERLE DU BESHAAR » sont la même saga). Les accents
 * comptent : « Éveil » et « Eveil » restent deux sagas. */
function cleDeSaga(nom: string): string {
  return nom.toLocaleLowerCase('fr');
}

interface Numerotation {
  /** « 1 » pour « 1. Sacrilège à Satarla » ; null sans numéro. */
  numero: string | null;
  intro: boolean;
  /** Le nom du chapitre sans son numéro ni « Introduction : ». */
  nom: string;
}

/** Ce que le libellé d'un chapitre dit de sa place : « 1. Sacrilège à Satarla », « Introduction : La colère de Nemmereth », ou rien. */
function numeroter(libelle: string): Numerotation {
  const intro = /^introduction\s*(?::\s*(.*))?$/i.exec(libelle);
  if (intro) {
    return {numero: null, intro: true, nom: intro[1]?.trim() || libelle};
  }
  const numero = /^(\d+)\.\s*(.*)$/.exec(libelle);
  return numero ? {numero: numero[1], intro: false, nom: numero[2].trim() || libelle} : {numero: null, intro: false, nom: libelle};
}

/** Introduction d'abord, puis les chapitres numérotés par numéro, puis le reste par ordre alphabétique. */
function comparerChapitres(a: AccueilChapitre, b: AccueilChapitre): number {
  const [rangA, numeroA] = rang(a.libelle);
  const [rangB, numeroB] = rang(b.libelle);
  return rangA - rangB || numeroA - numeroB || a.libelle.localeCompare(b.libelle, 'fr');
}

function rang(libelle: string): [number, number] {
  const {numero, intro} = numeroter(libelle);
  if (intro) {
    return [0, 0];
  }
  return numero ? [1, Number(numero)] : [2, 0];
}

/** Le `prochain` est le premier chapitre non joué après le chapitre en cours, sinon après le dernier joué ; jamais à rebours, jamais hors saga. */
function marquerEtats(chapitres: AccueilChapitre[], joues: ReadonlySet<string>, enCoursId: string | null, avecProchain: boolean): void {
  const indexEnCours = chapitres.findIndex((c) => c.id === enCoursId);
  const ancre = indexEnCours >= 0 ? indexEnCours : chapitres.map((c) => joues.has(c.id)).lastIndexOf(true);
  const prochain =
    avecProchain && ancre >= 0 ? chapitres.findIndex((c, i) => i > ancre && !joues.has(c.id) && c.id !== enCoursId) : -1;
  chapitres.forEach((chapitre, i) => {
    chapitre.etat = chapitre.id === enCoursId ? 'en-cours' : joues.has(chapitre.id) ? 'joue' : i === prochain ? 'prochain' : 'a-jouer';
  });
}

/**
 * Range les scénarios en sagas d'après leur titre « Saga — chapitre » : la saga de la table la plus récente d'abord, les autres par ordre
 * alphabétique, les one shots (nom null) en dernier. Chaque chapitre porte son état : joué, en cours, prochain ou à jouer.
 */
export function accueilSagas(
  scenarios: readonly BolAccueilScenario[],
  joues: ReadonlySet<string>,
  enCoursId: string | null,
  recentId: string | null,
): AccueilSaga[] {
  const groupes = new Map<string, AccueilSaga>();
  let horsSaga: AccueilSaga | null = null;

  for (const scenario of scenarios) {
    const {saga, libelle} = decouper(scenario.titre);
    const chapitre: AccueilChapitre = {id: scenario.id, titre: scenario.titre, libelle, etat: 'a-jouer'};
    if (saga === null) {
      horsSaga ??= {nom: null, chapitres: []};
      horsSaga.chapitres.push(chapitre);
      continue;
    }
    const cle = cleDeSaga(saga);
    const groupe = groupes.get(cle) ?? {nom: saga, chapitres: []};
    groupe.chapitres.push(chapitre);
    groupes.set(cle, groupe);
  }

  const contientRecent = (saga: AccueilSaga) => recentId !== null && saga.chapitres.some((c) => c.id === recentId);
  const sagas = [...groupes.values()].sort(
    (a, b) => Number(contientRecent(b)) - Number(contientRecent(a)) || (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'),
  );

  for (const saga of sagas) {
    saga.chapitres.sort(comparerChapitres);
    marquerEtats(saga.chapitres, joues, enCoursId, true);
  }
  if (horsSaga) {
    horsSaga.chapitres.sort(comparerChapitres);
    marquerEtats(horsSaga.chapitres, joues, enCoursId, false);
    sagas.push(horsSaga);
  }
  return sagas;
}

/** Le nom d'une table : son titre, sinon le titre complet de son scénario, sinon sa date (« Table du 2 novembre »). */
export function tableTitre(table: BolAccueilTable, scenarios: readonly BolAccueilScenario[]): string {
  if (table.titre?.trim()) {
    return table.titre;
  }
  const scenario = findScenario(scenarios, table.scenario_id);
  if (scenario) {
    return scenario.titre;
  }
  const date = new Date(table.created_at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'});
  return `Table du ${date}`;
}

/** Le nom affiché du groupe des scénarios hors saga. */
export const ONE_SHOT = 'One shot';

/** Couleurs et images des sagas (`--dw-saga-1` à `--dw-saga-4`). */
const TEINTES = 4;

/** L'avancement en toutes lettres : des chapitres (des scénarios pour les one shots), pas des scènes. */
function avancement(joues: number, total: number, unite: 'chapitre' | 'scénario'): string {
  return joues > 1 ? `${joues} ${unite}s joués sur ${total}` : `${joues} ${unite} joué sur ${total}`;
}

/**
 * Le bouton d'une saga. Sa saga est-elle sur la table ouverte : il la reprend, sur son chapitre (le bandeau et la carte disent alors la même
 * chose). Sinon il ouvre le dialogue « Ouvrir une table » sur le chapitre `prochain`, à défaut sur le premier à jouer, qui précède alors le dernier joué :
 * « Reste à jouer », pas « Continuer ». Aucun : la saga est achevée.
 */
function suiteDeSaga(saga: AccueilSaga, joues: number, tableId: string | null): AccueilSagaSuite | null {
  const nom = saga.nom ?? ONE_SHOT;
  const enCours = saga.chapitres.find((c) => c.etat === 'en-cours');
  if (enCours && tableId !== null) {
    return {
      id: enCours.id,
      libelle: enCours.libelle,
      action: 'Reprendre',
      route: ['/session', tableId, 'play'],
      ariaLabel: `Reprendre ${enCours.libelle}, ${nom}, sur la table ouverte`,
    };
  }
  const prochain = saga.chapitres.find((c) => c.etat === 'prochain');
  const chapitre = prochain ?? saga.chapitres.find((c) => c.etat === 'a-jouer');
  if (!chapitre) {
    return null;
  }
  const action: AccueilSagaAction =
    saga.nom === null ? 'Jouer' : prochain ? 'Continuer' : joues === 0 && !enCours ? 'Commencer' : 'Reste à jouer';
  return {
    id: chapitre.id,
    libelle: chapitre.libelle,
    action,
    route: null,
    ariaLabel: `${action} ${chapitre.libelle}, ${nom}, sur une nouvelle table`,
  };
}

const ETAT_CHAPITRE: Record<ChapitreEtat, string> = {joue: 'joué', 'en-cours': 'sur la table', prochain: 'à jouer', 'a-jouer': 'à jouer'};

/** Les pastilles d'une saga : chaque chapitre par son numéro (« Intro » pour l'introduction, son initiale sans numéro) et son état. */
function reperesDeSaga(saga: AccueilSaga): AccueilRepere[] {
  return saga.chapitres.map((chapitre) => {
    const {numero, intro} = numeroter(chapitre.libelle);
    return {
      marque: numero ?? (intro ? 'Intro' : chapitre.libelle.charAt(0).toLocaleUpperCase('fr')),
      etat: chapitre.etat,
      texte: `${chapitre.libelle} : ${ETAT_CHAPITRE[chapitre.etat]}`,
    };
  });
}

/** La ligne sous le nom de la saga ; pour les one shots, rien ne parle de saga ni de chapitre. */
function resumeDeSaga(suite: AccueilSagaSuite | null, joues: number, total: number, enToutesLettres: string, horsSaga: boolean): string {
  if (suite?.action === 'Reprendre') {
    return `Table ouverte · ${enToutesLettres}`;
  }
  if (suite === null) {
    return horsSaga ? 'Tout est joué' : 'Saga achevée';
  }
  if (joues > 0) {
    return enToutesLettres;
  }
  if (horsSaga) {
    return total > 1 ? `${total} scénarios à jouer` : '1 scénario à jouer';
  }
  return 'Pas encore commencée';
}

/**
 * Les sagas réduites à ce que l'accueil montre : pas de chapitre, seulement l'avancement et le bouton (voir `suiteDeSaga`), qui reprend la
 * table `tableId` quand elle porte un chapitre de la saga. Une saga garde sa teinte quel que soit l'ordre d'affichage : elle suit l'ordre
 * alphabétique des noms.
 */
export function sagaResumes(sagas: readonly AccueilSaga[], tableId: string | null): AccueilSagaResume[] {
  const noms = sagas
    .map((saga) => saga.nom)
    .filter((nom): nom is string => nom !== null)
    .sort((a, b) => a.localeCompare(b, 'fr'));
  return sagas.map((saga) => {
    const horsSaga = saga.nom === null;
    const total = saga.chapitres.length;
    const joues = saga.chapitres.filter((c) => c.etat === 'joue').length;
    const suite = suiteDeSaga(saga, joues, tableId);
    const enToutesLettres = avancement(joues, total, horsSaga ? 'scénario' : 'chapitre');
    return {
      nom: saga.nom,
      joues,
      total,
      reperes: reperesDeSaga(saga),
      suite,
      avancement: enToutesLettres,
      resume: resumeDeSaga(suite, joues, total, enToutesLettres, horsSaga),
      teinte: saga.nom === null ? 0 : (noms.indexOf(saga.nom) % TEINTES) + 1,
    };
  });
}

/** La teinte d'une saga (celle de la table ouverte), retrouvée comme les chapitres sont groupés : sans tenir compte de la casse, car le nom
 * d'une saga est celui du premier titre vu et le scénario de la table peut l'écrire autrement. 0 sans saga ou pour une saga inconnue. */
export function teinteDeSaga(resumes: readonly AccueilSagaResume[], saga: string | null): number {
  if (saga === null) {
    return 0;
  }
  const cle = cleDeSaga(saga);
  return resumes.find((resume) => resume.nom !== null && cleDeSaga(resume.nom) === cle)?.teinte ?? 0;
}

/** Où se place un scénario parmi ceux du compte : sa saga et son chapitre, d'après son numéro et le nombre de chapitres de la saga. */
export function situerScenario(scenario: BolAccueilScenario, scenarios: readonly BolAccueilScenario[]): ScenarioSitue {
  const {saga, libelle} = decouper(scenario.titre);
  if (saga === null) {
    return {saga: null, histoire: ONE_SHOT, chapitre: null, chapitreCourt: null, nom: libelle};
  }
  const numerotation = numeroter(libelle);
  const total = scenarios.filter((s) => cleDeSaga(decouper(s.titre).saga ?? '') === cleDeSaga(saga)).length;
  return {
    saga,
    histoire: saga,
    chapitre: numerotation.numero ? `Chapitre ${numerotation.numero} sur ${total}` : numerotation.intro ? 'Introduction' : null,
    chapitreCourt: numerotation.numero ? `Chapitre ${numerotation.numero}` : numerotation.intro ? 'Introduction' : null,
    nom: numerotation.nom,
  };
}

const ETAT_SCENE: Record<SceneEtat, string> = {jouee: 'jouée', 'en-cours': 'en cours', 'a-jouer': 'à jouer'};

/**
 * La table ouverte pour le bandeau : le fil de l'histoire (la saga de son scénario, « One shot » pour un scénario hors saga, « Sans
 * scénario » quand on improvise ; le chapitre ; la scène en cours et sa place), son titre (le sien, sinon le nom du chapitre, sinon sa
 * date) et la barre des scènes du chapitre.
 */
export function tableOuverte(table: BolAccueilTable, scenarios: readonly BolAccueilScenario[]): AccueilTableOuverte {
  const scenario = findScenario(scenarios, table.scenario_id);
  const situe = scenario ? situerScenario(scenario, scenarios) : null;
  const titre = table.titre?.trim() ? table.titre : (situe?.nom ?? tableTitre(table, scenarios));
  const histoire = situe?.histoire ?? 'Sans scénario';

  const jouees = new Set(table.scenes_jouees);
  const scenes = table.scenes.map((scene, i): AccueilSceneRepere => {
    const etat: SceneEtat = scene.id === table.scene_id ? 'en-cours' : jouees.has(scene.id) ? 'jouee' : 'a-jouer';
    return {etat, texte: `Scène ${i + 1}, ${scene.titre} : ${ETAT_SCENE[etat]}`};
  });
  const indexEnCours = table.scenes.findIndex((scene) => scene.id === table.scene_id);
  const enCours = indexEnCours >= 0 ? table.scenes[indexEnCours] : null;
  const nbJouees = scenes.filter((scene) => scene.etat === 'jouee').length;

  return {
    id: table.id,
    saga: situe?.saga ?? null,
    histoire,
    chapitre: situe?.chapitre ?? null,
    scene: enCours ? `Scène ${indexEnCours + 1} sur ${scenes.length}` : null,
    titre,
    sceneEnCours: enCours?.titre ?? null,
    enCombat: table.statut === 'combat',
    scenes,
    scenesJouees: scenes.length ? `${nbJouees} ${nbJouees > 1 ? 'scènes jouées' : 'scène jouée'} sur ${scenes.length}` : null,
    filAriane: [histoire, situe?.chapitreCourt ?? titre, enCours ? `Scène ${indexEnCours + 1} · ${enCours.titre}` : null]
      .filter((partie): partie is string => partie !== null)
      .join(' › '),
  };
}
