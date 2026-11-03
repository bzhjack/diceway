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
import {findScenario, libelleDeChapitre, titreDeChapitre} from '../scenario.util';

/** La clé d'un scénario pour retrouver sa teinte d'après son nom : sans tenir compte de la casse. */
function cleDeSaga(nom: string): string {
  return nom.toLocaleLowerCase('fr');
}

/** L'introduction d'abord (numéro 0), puis les chapitres par numéro, puis ceux sans numéro par ordre alphabétique. */
function comparerChapitres(a: AccueilChapitre, b: AccueilChapitre): number {
  return rang(a.numero) - rang(b.numero) || a.libelle.localeCompare(b.libelle, 'fr');
}

function rang(numero: number | null): number {
  return numero ?? Number.MAX_SAFE_INTEGER;
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
 * Range les chapitres par scénario : le scénario de la table la plus récente d'abord, les autres par ordre alphabétique, les one shots
 * (nom null) en dernier. Chaque chapitre porte son état : joué, en cours, prochain ou à jouer.
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
    const chapitre: AccueilChapitre = {
      id: scenario.id,
      titre: titreDeChapitre(scenario),
      libelle: libelleDeChapitre(scenario.numero, scenario.titre),
      numero: scenario.numero,
      etat: 'a-jouer',
    };
    if (scenario.saga === null) {
      horsSaga ??= {nom: null, chapitres: []};
      horsSaga.chapitres.push(chapitre);
      continue;
    }
    const groupe = groupes.get(scenario.saga.id) ?? {nom: scenario.saga.titre, chapitres: []};
    groupe.chapitres.push(chapitre);
    groupes.set(scenario.saga.id, groupe);
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
    return titreDeChapitre(scenario);
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
 * « Reste à jouer », pas « Chapitre suivant ». Aucun : le scénario est achevé.
 */
function suiteDeSaga(saga: AccueilSaga, joues: number, tableId: string | null): AccueilSagaSuite | null {
  const nom = saga.nom ?? ONE_SHOT;
  const enCours = saga.chapitres.find((c) => c.etat === 'en-cours');
  if (enCours && tableId !== null) {
    return {
      id: enCours.id,
      libelle: enCours.libelle,
      action: 'Reprendre',
      reprise: true,
      ariaLabel: `Reprendre ${enCours.libelle}, ${nom}, sur la table ouverte`,
    };
  }
  const prochain = saga.chapitres.find((c) => c.etat === 'prochain');
  const chapitre = prochain ?? saga.chapitres.find((c) => c.etat === 'a-jouer');
  if (!chapitre) {
    return null;
  }
  const action: AccueilSagaAction =
    saga.nom === null ? 'Jouer' : prochain ? 'Chapitre suivant' : joues === 0 && !enCours ? 'Commencer' : 'Reste à jouer';
  return {
    id: chapitre.id,
    libelle: chapitre.libelle,
    action,
    reprise: false,
    ariaLabel: `${action} ${chapitre.libelle}, ${nom}, sur une nouvelle table`,
  };
}

const ETAT_CHAPITRE: Record<ChapitreEtat, string> = {joue: 'joué', 'en-cours': 'sur la table', prochain: 'à jouer', 'a-jouer': 'à jouer'};

/** Les pastilles d'une saga : chaque chapitre par son numéro (« Intro » pour l'introduction, son initiale sans numéro) et son état. */
function reperesDeSaga(saga: AccueilSaga): AccueilRepere[] {
  return saga.chapitres.map((chapitre) => {
    const {numero} = chapitre;
    return {
      marque: numero === 0 ? 'Intro' : numero !== null ? String(numero) : chapitre.libelle.charAt(0).toLocaleUpperCase('fr'),
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
    return horsSaga ? 'Tout est joué' : 'Scénario achevé';
  }
  if (joues > 0) {
    return enToutesLettres;
  }
  if (horsSaga) {
    return total > 1 ? `${total} scénarios à jouer` : '1 scénario à jouer';
  }
  return 'Pas encore commencé';
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

/** Où se place un chapitre parmi ceux du compte : son scénario et son chapitre, d'après son numéro et le nombre de chapitres du scénario. */
export function situerScenario(scenario: BolAccueilScenario, scenarios: readonly BolAccueilScenario[]): ScenarioSitue {
  const {saga, numero, titre} = scenario;
  if (saga === null) {
    return {saga: null, histoire: ONE_SHOT, chapitre: null, chapitreCourt: null, nom: titre};
  }
  const total = scenarios.filter((s) => s.saga?.id === saga.id).length;
  const court = numero === null ? null : numero === 0 ? 'Introduction' : `Chapitre ${numero}`;
  return {
    saga: saga.titre,
    histoire: saga.titre,
    chapitre: numero === null ? null : numero === 0 ? 'Introduction' : `${court} sur ${total}`,
    chapitreCourt: court,
    nom: titre,
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
