import {BolAccueilScenario, BolAccueilTable} from '../../models/bol-accueil.model';
import {AccueilChapitre, AccueilSaga, AccueilSagaResume, AccueilTableOuverte} from '../models/accueil.model';
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

/** Introduction d'abord, puis les chapitres numérotés par numéro, puis le reste par ordre alphabétique. */
function comparerChapitres(a: AccueilChapitre, b: AccueilChapitre): number {
  const [rangA, numeroA] = rang(a.libelle);
  const [rangB, numeroB] = rang(b.libelle);
  return rangA - rangB || numeroA - numeroB || a.libelle.localeCompare(b.libelle, 'fr');
}

function rang(libelle: string): [number, number] {
  if (/^introduction/i.test(libelle)) {
    return [0, 0];
  }
  const numero = /^(\d+)\./.exec(libelle);
  return numero ? [1, Number(numero[1])] : [2, 0];
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
 * alphabétique, « Hors saga » (nom null) en dernier. Chaque chapitre porte son état : joué, en cours, prochain ou à jouer.
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

/** Rayon de l'anneau d'avancement d'une saga, dans un `viewBox` de 64. */
export const ANNEAU_RAYON = 27;

/** Couleurs et images des sagas (`--dw-saga-1` à `--dw-saga-4`). */
const TEINTES = 4;

/** Ce que compte l'anneau, en toutes lettres : des chapitres (des scénarios), pas des scènes. */
function avancement(joues: number, total: number): string {
  return joues > 1 ? `${joues} chapitres joués sur ${total}` : `${joues} chapitre joué sur ${total}`;
}

/**
 * Les sagas réduites à ce que l'accueil montre : pas de chapitre, seulement l'avancement et la suite. La suite est le chapitre `prochain`,
 * sinon le premier à jouer ; une saga sans l'un ni l'autre est achevée. Une saga garde sa teinte quel que soit l'ordre d'affichage : elle
 * suit l'ordre alphabétique des noms.
 */
export function sagaResumes(sagas: readonly AccueilSaga[]): AccueilSagaResume[] {
  const noms = sagas
    .map((saga) => saga.nom)
    .filter((nom): nom is string => nom !== null)
    .sort((a, b) => a.localeCompare(b, 'fr'));
  const circonference = 2 * Math.PI * ANNEAU_RAYON;
  return sagas.map((saga) => {
    const total = saga.chapitres.length;
    const joues = saga.chapitres.filter((c) => c.etat === 'joue').length;
    const suite = saga.chapitres.find((c) => c.etat === 'prochain') ?? saga.chapitres.find((c) => c.etat === 'a-jouer') ?? null;
    const enCours = saga.chapitres.some((c) => c.etat === 'en-cours');
    return {
      nom: saga.nom,
      joues,
      total,
      suite,
      action: joues === 0 && !enCours ? 'Commencer' : 'Continuer',
      resume: enCours
        ? `Sur la table ce soir · ${avancement(joues, total)}`
        : suite === null ? 'Saga achevée' : joues === 0 ? 'Pas encore commencée' : avancement(joues, total),
      teinte: saga.nom === null ? 0 : (noms.indexOf(saga.nom) % TEINTES) + 1,
      anneau: `${((circonference * joues) / Math.max(1, total)).toFixed(1)} ${circonference.toFixed(1)}`,
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

/** La table ouverte pour le bandeau : la saga de son scénario au-dessus, son titre (le sien, sinon le chapitre, sinon sa date) en grand. */
export function tableOuverte(table: BolAccueilTable, scenarios: readonly BolAccueilScenario[]): AccueilTableOuverte {
  const scenario = findScenario(scenarios, table.scenario_id);
  const decoupe = scenario ? decouper(scenario.titre) : null;
  return {
    id: table.id,
    saga: decoupe?.saga ?? null,
    titre: table.titre?.trim() ? table.titre : (decoupe?.libelle ?? tableTitre(table, scenarios)),
  };
}
