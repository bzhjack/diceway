import {CombatantAttitude} from '../../../models/bol-fight-session.model';
import {BolSceneEntry, BolSceneModel, SceneMeteo, SceneMoment} from '../../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {ActeStatut, AmbianceOption, SceneActe, ScenePortrait, TroupeCard, TroupeTaille} from '../../models/theatre.model';
import {scenesOf} from '../scene-list/scene.util';

/** Les moments de la journée, dans l'ordre, avec leur libellé et leur icône. */
export const MOMENTS: readonly AmbianceOption<SceneMoment>[] = [
  {value: 'aube', label: 'Aube', icon: 'wb_twilight'},
  {value: 'jour', label: 'Jour', icon: 'wb_sunny'},
  {value: 'crepuscule', label: 'Crépuscule', icon: 'wb_twilight'},
  {value: 'nuit', label: 'Nuit', icon: 'nights_stay'},
];

/** Les temps possibles d'une scène, avec leur libellé et leur icône. */
export const METEOS: readonly AmbianceOption<SceneMeteo>[] = [
  {value: 'clair', label: 'Ciel clair', icon: 'wb_sunny'},
  {value: 'couvert', label: 'Ciel de plomb', icon: 'cloud'},
  {value: 'pluie', label: 'Pluie', icon: 'umbrella'},
  {value: 'brume', label: 'Brume', icon: 'blur_on'},
  {value: 'vent', label: 'Grand vent', icon: 'air'},
  {value: 'orage', label: 'Orage', icon: 'thunderstorm'},
  {value: 'cendres', label: 'Pluie de cendres', icon: 'local_fire_department'},
];

/** Les attitudes envers les héros, de la plus hostile à la plus amicale. */
export const ATTITUDES: readonly AmbianceOption<CombatantAttitude>[] = [
  {value: 'hostile', label: 'Hostile', icon: 'sentiment_very_dissatisfied'},
  {value: 'mefiant', label: 'Méfiant', icon: 'visibility'},
  {value: 'neutre', label: 'Neutre', icon: 'remove'},
  {value: 'amical', label: 'Amical', icon: 'handshake'},
];

/** Les actes de la frise : les scènes du scénario (`null` = « Sans scénario »), dans leur ordre, numérotées
 * à partir de 1. La scène courante est « en cours » ; une scène déjà passée sur la table est « jouée ». */
export function sceneActs(
  scenes: readonly BolSceneModel[],
  scenarioId: string | null,
  knownScenarioIds: ReadonlySet<string>,
  currentId: string | null,
  played: readonly string[],
): SceneActe[] {
  return scenesOf(scenes, scenarioId, knownScenarioIds).map((scene, index) => ({
    scene,
    numero: index + 1,
    statut: scene.id === currentId ? 'en-cours' : played.includes(scene.id) ? 'jouee' : 'a-venir',
  }));
}

/** Le décor d'une scène sans illustration ni région connue, et du plateau sans scène : l'image retenue pour la
 * maquette du théâtre. */
const DECOR_PAR_DEFAUT = '/assets/bol/dashboard-header.png';

/** Le fond du plateau pour une scène : son illustration, sinon l'image par défaut. La région n'y change rien : la carte se
 * consulte à part, depuis le lieu du cartouche. */
export function sceneDecor(scene: BolSceneModel | null): string {
  return scene?.image?.trim() || DECOR_PAR_DEFAUT;
}

/** Les portraits de la distribution d'une scène, retrouvés dans le catalogue ; une entrée dont la fiche
 * n'y est plus est ignorée. */
export function distributionPortraits(distribution: readonly BolSceneEntry[], catalog: readonly CombatCatalogEntry[]): ScenePortrait[] {
  return distribution.flatMap((entry) => {
    const fiche = catalog.find((c) => c.kind === entry.kind && c.sourceId === entry.source_id);
    return fiche ? [{nom: fiche.nom, avatar: fiche.avatar || null, qty: Math.max(1, entry.qty)}] : [];
  });
}

/** Où se joue une scène, en clair : la précision du lieu puis la région (« Gué du Tyr, Jungle de Qush »), ou
 * ce qui en est connu ; `null` si rien. */
export function lieuTexte(lieu: string | null, region: string | null): string | null {
  const parts = [lieu?.trim(), region?.trim()].filter((part): part is string => !!part);
  return parts.length ? parts.join(', ') : null;
}

const MOMENT_PHRASES: Record<SceneMoment, string> = {
  aube: 'à l’aube',
  jour: 'en plein jour',
  crepuscule: 'au crépuscule',
  nuit: 'à la nuit tombée',
};

/** Ciel clair : rien à dire. */
const METEO_PHRASES: Record<SceneMeteo, string | null> = {
  clair: null,
  couvert: 'sous un ciel de plomb',
  pluie: 'sous la pluie',
  brume: 'dans la brume',
  vent: 'dans le grand vent',
  orage: 'sous l’orage',
  cendres: 'sous une pluie de cendres',
};

/** La phrase du chroniqueur qui ouvre une scène, d'après son moment et sa météo : « Au crépuscule, sous la pluie… » ;
 * `null` s'il n'y a rien à dire. */
export function narration(moment: SceneMoment | null, meteo: SceneMeteo | null): string | null {
  const parts = [moment ? MOMENT_PHRASES[moment] : null, meteo ? METEO_PHRASES[meteo] : null].filter((part): part is string => !!part);
  if (!parts.length) {
    return null;
  }
  const texte = parts.join(', ');
  return texte.charAt(0).toUpperCase() + texte.slice(1) + '…';
}

/** Rythme du carton du chroniqueur, en millisecondes : le fondu au noir, une lettre de la phrase (une virgule marque
 * un temps), le silence avant le titre, puis le titre seul. Avec moins d'animations, tout s'affiche d'un coup et
 * reste `reduit` ms. */
export const CARTON_RYTHME = {fondu: 900, lettre: 34, virgule: 220, avantTitre: 400, titre: 1600, reduit: 1400} as const;

/** Délai d'une lettre de la phrase, une fois écrite : plus long après une virgule. */
export function cartonDelai(lettre: string): number {
  return lettre === ',' ? CARTON_RYTHME.virgule : CARTON_RYTHME.lettre;
}

/** Combien de temps le carton reste affiché une fois le fondu au noir terminé : la phrase qui s'écrit, puis le titre. */
export function cartonTenue(phrase: string | null, reduit: boolean): number {
  if (reduit) {
    return CARTON_RYTHME.reduit;
  }
  const ecriture = phrase ? [...phrase].reduce((total, lettre) => total + cartonDelai(lettre), 0) + CARTON_RYTHME.avantTitre : 0;
  return ecriture + CARTON_RYTHME.titre;
}

const STATUT_LABELS: Record<ActeStatut, string | null> = {'en-cours': 'en cours', jouee: 'jouée', 'a-venir': null};

/** Nom accessible d'un acte de la frise : « Scène 2, Embuscade au gué, en cours ». */
export function acteLabel(acte: SceneActe): string {
  const statut = STATUT_LABELS[acte.statut];
  return [`Scène ${acte.numero}`, acte.scene.titre, statut].filter((part): part is string => !!part).join(', ');
}

const RANG_ORDRE: Record<string, number> = {Rival: 0, Coriace: 1, Piétaille: 2};
const RANG_TAILLE: Record<string, TroupeTaille> = {Rival: 'rival', Coriace: 'coriace', Piétaille: 'pietaille'};
const KIND_ORDRE: Record<TapisKind, number> = {hero: 0, pnj: 1, creature: 2, demon: 3};

/** La troupe en scène : les personnages du camp des adversaires, rivaux d'abord, puis coriaces, puis
 * piétaille ; à rang égal, par type puis par ordre d'arrivée. La taille de chaque carte suit son rang. */
export function troupe(cards: readonly TapisCard[]): TroupeCard[] {
  return cards
    .filter((card) => card.camp === 'adversaires')
    .sort(
      (left, right) =>
        (RANG_ORDRE[left.rang ?? ''] ?? 1) - (RANG_ORDRE[right.rang ?? ''] ?? 1) || parTypePuisArrivee(left, right),
    )
    .map((card) => ({card, taille: RANG_TAILLE[card.rang ?? ''] ?? 'coriace'}));
}

function parTypePuisArrivee(left: TapisCard, right: TapisCard): number {
  return KIND_ORDRE[left.kind] - KIND_ORDRE[right.kind] || left.pivotId - right.pivotId;
}

/** La compagnie : les héros, puis leurs alliés (PNJ, créatures ou démons du camp des héros), par type puis
 * par ordre d'arrivée. */
export function compagnie(cards: readonly TapisCard[]): {heros: TapisCard[]; allies: TapisCard[]} {
  const camp = cards.filter((card) => card.camp === 'heros').sort(parTypePuisArrivee);
  return {heros: camp.filter((card) => card.kind === 'hero'), allies: camp.filter((card) => card.kind !== 'hero')};
}
