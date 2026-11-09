import {BolAccueilHeros, BolAccueilModel, BolAccueilPartie, BolAccueilScenario} from '../../models/bol-accueil.model';
import {usableAvatar} from '../../../shared/avatar-fallback/avatar.util';
import {
  AccueilBandeau,
  AccueilHerosCarte,
  AccueilLigneScene,
  AccueilPartie,
  AccueilRepere,
  AccueilScenarioChoix,
  AccueilSceneRepere,
  ChapitreEtat,
  SceneEtat,
  ScenarioSitue,
} from '../models/accueil.model';
import {findScenario, libelleDeChapitre} from '../scenario.util';

/** Le nom d'une partie sans nom (une partie d'avant le nom obligatoire). */
const SANS_NOM = 'Table sans nom';

/** Couleurs et images des sagas (`--dw-saga-1` à `--dw-saga-4`). */
const TEINTES = 4;

/** L'introduction d'abord (numéro 0), puis les chapitres par numéro, puis ceux sans numéro par ordre alphabétique. */
function comparerChapitres(a: BolAccueilScenario, b: BolAccueilScenario): number {
  return rang(a.numero) - rang(b.numero) || a.titre.localeCompare(b.titre, 'fr');
}

function rang(numero: number | null): number {
  return numero ?? Number.MAX_SAFE_INTEGER;
}

/** Les chapitres du scénario d'un chapitre, dans l'ordre de lecture ; rien sans chapitre ou pour un chapitre inconnu. */
export function chapitresDuScenario(chapitreId: string | null, scenarios: readonly BolAccueilScenario[]): BolAccueilScenario[] {
  const chapitre = findScenario(scenarios, chapitreId);
  if (!chapitre) {
    return [];
  }
  const sagaId = chapitre.saga.id;
  return scenarios.filter((s) => s.saga.id === sagaId).sort(comparerChapitres);
}

/** Les sagas du compte, chacune une fois (par id), triées par nom : leur rang donne leur teinte. */
function sagasTriees(scenarios: readonly BolAccueilScenario[]): {id: string; titre: string}[] {
  const sagas = new Map<string, string>();
  for (const s of scenarios) {
    if (!sagas.has(s.saga.id)) {
      sagas.set(s.saga.id, s.saga.titre);
    }
  }
  return [...sagas].map(([id, titre]) => ({id, titre})).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
}

function teinteDeSagaId(sagaId: string, sagas: readonly {id: string}[]): number {
  return (sagas.findIndex((saga) => saga.id === sagaId) % TEINTES) + 1;
}

/** La teinte du scénario d'un chapitre : de 1 à 4 dans l'ordre alphabétique des scénarios, la même pour toutes les parties qui le jouent ;
 * 0 sans chapitre, ou pour un chapitre inconnu. */
export function teinteDeScenario(chapitreId: string | null, scenarios: readonly BolAccueilScenario[]): number {
  const saga = findScenario(scenarios, chapitreId)?.saga;
  return saga ? teinteDeSagaId(saga.id, sagasTriees(scenarios)) : 0;
}

/** Les scénarios à choisir pour une partie, par ordre alphabétique, chacun avec ses chapitres. */
export function scenariosDuCompte(scenarios: readonly BolAccueilScenario[]): AccueilScenarioChoix[] {
  const sagas = sagasTriees(scenarios);
  return sagas.map((saga): AccueilScenarioChoix => {
    const chapitres = scenarios.filter((s) => s.saga.id === saga.id).sort(comparerChapitres);
    return {
      id: saga.id,
      nom: saga.titre,
      teinte: teinteDeSagaId(saga.id, sagas),
      chapitres: chapitres.map((c) => ({id: c.id, libelle: libelleDeChapitre(c.numero, c.titre)})),
    };
  });
}

/** Les scénarios qu'une partie improvisée peut prendre : tous, sauf ceux que sa compagnie joue déjà dans une autre partie (le serveur les refuse). */
export function scenariosLibresPour(partieId: string, data: BolAccueilModel): AccueilScenarioChoix[] {
  const compagnieId = data.parties.find((p) => p.id === partieId)?.compagnie_id ?? null;
  const pris = new Set(
    compagnieId === null ? [] : data.parties.filter((p) => p.compagnie_id === compagnieId && p.id !== partieId).map((p) => p.scenario_id),
  );
  return scenariosDuCompte(data.scenarios).filter((scenario) => !scenario.chapitres.some((chapitre) => pris.has(chapitre.id)));
}

export function herosCartes(heros: readonly BolAccueilHeros[]): AccueilHerosCarte[] {
  return heros.map((h) => ({id: h.id, nom: h.nom, portrait: usableAvatar(h.avatar), initiale: h.nom.charAt(0).toLocaleUpperCase('fr')}));
}

function nomDePartie(partie: BolAccueilPartie): string {
  return partie.titre?.trim() || SANS_NOM;
}

const ETAT_CHAPITRE: Record<ChapitreEtat, string> = {joue: 'joué', 'en-cours': 'en cours', 'a-jouer': 'à jouer'};

/** La marque d'un chapitre en pastille : son numéro, « Intro » pour l'introduction, son initiale sans numéro. */
export function marqueDeChapitre(chapitre: BolAccueilScenario): string {
  if (chapitre.numero === 0) {
    return 'Intro';
  }
  return chapitre.numero !== null ? String(chapitre.numero) : chapitre.titre.charAt(0).toLocaleUpperCase('fr');
}

/** Une carte de la rangée « Parties » (voir `AccueilPartie`). */
function carteDePartie(partie: BolAccueilPartie, scenarios: readonly BolAccueilScenario[], derniere: string | null): AccueilPartie {
  const courant = findScenario(scenarios, partie.scenario_id);
  const chapitres = chapitresDuScenario(courant?.id ?? null, scenarios);
  const joues = new Set(partie.chapitres_joues);
  const termine = courant !== null && partie.scenario_termine;
  const etat = (c: BolAccueilScenario): ChapitreEtat => (termine || (c.id !== courant?.id && joues.has(c.id)) ? 'joue' : c.id === courant?.id ? 'en-cours' : 'a-jouer');
  const reperes: AccueilRepere[] = chapitres.map((c) => {
    const libelle = libelleDeChapitre(c.numero, c.titre);
    return {marque: marqueDeChapitre(c), libelle, etat: etat(c), texte: `${libelle} : ${ETAT_CHAPITRE[etat(c)]}`};
  });

  return {
    id: partie.id,
    nom: nomDePartie(partie),
    scenario: courant ? courant.saga.titre : 'Partie improvisée',
    teinte: teinteDeScenario(courant?.id ?? null, scenarios),
    reperes,
    heros: herosCartes(partie.heros),
    reprendre: courant ? libelleDeChapitre(courant.numero, courant.titre) : null,
    termine,
    derniere: partie.id === derniere,
    scenarioId: courant?.id ?? null,
    figurantsARetirer: courant ? partie.figurants : 0,
    enCombat: partie.statut === 'combat',
  };
}

/** Les cartes de la rangée « Parties », dans l'ordre de l'API (la plus récemment jouée d'abord). */
export function partiesDeLAccueil(data: BolAccueilModel): AccueilPartie[] {
  return data.parties.map((partie) => carteDePartie(partie, data.scenarios, data.derniere));
}

/** Où se place un chapitre parmi ceux du compte : son scénario et son chapitre, d'après son numéro et le nombre de chapitres du scénario. */
export function situerScenario(scenario: BolAccueilScenario, scenarios: readonly BolAccueilScenario[]): ScenarioSitue {
  const {saga, numero, titre} = scenario;
  const total = scenarios.filter((s) => s.saga.id === saga.id).length;
  const court = numero === null ? null : numero === 0 ? 'Introduction' : `Chapitre ${numero}`;
  return {
    histoire: saga.titre,
    chapitre: numero === null ? null : numero === 0 ? 'Introduction' : `${court} sur ${total}`,
    chapitreCourt: court,
    nom: titre,
  };
}

const ETAT_SCENE: Record<SceneEtat, string> = {jouee: 'jouée', 'en-cours': 'en cours', 'a-jouer': 'à jouer'};

/**
 * La dernière partie jouée pour le bandeau : ce qu'on dit de son histoire (le scénario de son chapitre, « Sans scénario » quand on
 * improvise), le nom de la compagnie, la ligne de la scène en cours (son chapitre, sa place, le combat), la barre
 * des scènes du chapitre et ses héros.
 */
export function bandeauDePartie(partie: BolAccueilPartie, scenarios: readonly BolAccueilScenario[]): AccueilBandeau {
  const scenario = findScenario(scenarios, partie.scenario_id);
  const situe = scenario ? situerScenario(scenario, scenarios) : null;
  const titre = nomDePartie(partie);
  const histoire = situe?.histoire ?? 'Sans scénario';

  const jouees = new Set(partie.scenes_jouees);
  const scenes = partie.scenes.map((scene, i): AccueilSceneRepere => {
    const etat: SceneEtat = scene.id === partie.scene_id ? 'en-cours' : jouees.has(scene.id) ? 'jouee' : 'a-jouer';
    return {etat, texte: `Scène ${i + 1}, ${scene.titre} : ${ETAT_SCENE[etat]}`};
  });
  const indexEnCours = partie.scenes.findIndex((scene) => scene.id === partie.scene_id);
  const enCours = indexEnCours >= 0 ? partie.scenes[indexEnCours] : null;
  const chapitre = situe ? (situe.chapitreCourt ?? situe.nom) : null;
  const enCombat = partie.statut === 'combat';

  return {
    id: partie.id,
    histoire,
    teinte: teinteDeScenario(scenario?.id ?? null, scenarios),
    titre,
    ligne: ligneDeScene(scenario ? libelleDeChapitre(scenario.numero, scenario.titre) : null, enCours ? {place: `scène ${indexEnCours + 1} sur ${scenes.length}`, titre: enCours.titre} : null, enCombat),
    enCombat,
    scenes,
    heros: herosCartes(partie.heros),
    filAriane: [titre, histoire, chapitre, enCours ? `Scène ${indexEnCours + 1} · ${enCours.titre}` : null]
      .filter((morceau): morceau is string => morceau !== null)
      .join(' › '),
  };
}

/** « 1. Sacrilège à Satarla — scène 2 sur 3 : » + le nom de la scène + « · combat engagé » ; ce qui manque n'y est pas. */
function ligneDeScene(chapitre: string | null, scene: {place: string; titre: string} | null, enCombat: boolean): AccueilLigneScene | null {
  const avant = scene ? `${chapitre ? `${chapitre} — ` : ''}${scene.place} : ` : (chapitre ?? '');
  const apres = enCombat ? (avant ? ' · combat engagé' : 'Combat engagé') : '';
  return avant || apres ? {avant, scene: scene?.titre ?? null, apres} : null;
}

/** Depuis quand une partie n'a pas été jouée, en jours du calendrier : « aujourd'hui », « hier », « il y a 3 jours », « il y a 2 semaines »,
 * « il y a 4 mois », « il y a 1 an » ; null sans date. */
export function depuisQuand(iso: string | null, maintenant: Date): string | null {
  const jouee = iso ? new Date(iso) : null;
  if (!jouee || Number.isNaN(jouee.getTime())) {
    return null;
  }
  const jour = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const jours = Math.round((jour(maintenant) - jour(jouee)) / 86_400_000);
  if (jours <= 0) {
    return 'aujourd’hui';
  }
  if (jours === 1) {
    return 'hier';
  }
  if (jours < 7) {
    return `il y a ${jours} jours`;
  }
  if (jours < 30) {
    return `il y a ${pluriel(Math.floor(jours / 7), 'semaine')}`;
  }
  if (jours < 365) {
    return `il y a ${Math.floor(jours / 30)} mois`;
  }
  return `il y a ${pluriel(Math.floor(jours / 365), 'an')}`;
}

/** « 1 arme », « 54 armes ». */
export function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`;
}
