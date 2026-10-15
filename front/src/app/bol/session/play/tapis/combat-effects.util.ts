import {CombatEffect, EffectDuration, EffectEvent, EffectStat, EffectWhen, ModifierTerm, NewEffect, RollContext, TurnChoice} from '../../models/combat-effect.model';

/** Effet d'une posture sur la défense de son porteur (le bonus d'attaque vient du référentiel de combat). */
export const POSTURE_DEFENSE: Readonly<Record<string, number>> = {defensive: 1, offensive: -1, intrepid: -2, 'dual-parry': 1};

/** Trace : le petit bouclier de la carte a déjà servi ce round. */
export const BOUCLIER_DEPENSE = 'bouclier-depense';
/** Trace : la carte n'a pas le bénéfice de son bouclier (attaque intrépide, échec critique au round 1). */
export const SANS_BOUCLIER = 'sans-bouclier';
/** Trace : le héros tombé à 0 a choisi de sombrer dans l'inconscience ; il ne se relève qu'à la fin du combat. */
const INCONSCIENT = 'inconscient';
/** Trace : des dégâts encaissés à mains nues, récupérés en totalité après le combat. */
const MAINS_NUES = 'mains-nues';
/** Trace : le héros mourant est stabilisé (« Défier la mort » sous −5, ou secouru) ; il ne perd plus de vitalité d'un round à l'autre. */
const STABILISE = 'stabilise';
/** La carte lance un dé de malus à sa prochaine action (adversaire renversé qui se relève, coup précis…). */
const DE_MALUS = 'de-malus';

const POSTURE_ORIGINE: Readonly<Record<string, string>> = {
  defensive: 'posture-defensive',
  offensive: 'posture-offensive',
  intrepid: 'attaque-intrepide',
  'dual-parry': 'parade',
};

const ORIGINE_LIBELLE: Readonly<Record<string, string>> = {
  'defense-totale': 'défense totale',
  'posture-defensive': 'posture défensive',
  'posture-offensive': 'posture offensive',
  'attaque-intrepide': 'attaque intrépide',
  parade: 'parade',
  [BOUCLIER_DEPENSE]: 'bouclier dépensé',
  [SANS_BOUCLIER]: 'sans bouclier',
};

/** Libellé affiché d'un effet : celui saisi à la main, sinon celui de son origine. */
export function libelleEffet(effet: Pick<CombatEffect, 'origine' | 'libelle'>): string {
  return effet.libelle ?? ORIGINE_LIBELLE[effet.origine] ?? effet.origine;
}

/** Un effet en toutes lettres : « + 1 posture défensive » ; une trace (valeur 0) n'a que son libellé (« bouclier dépensé »). */
export function descriptionEffet(effet: CombatEffect): string {
  // Un effet d'action (dé de malus, action perdue) ne se chiffre pas : son libellé se suffit.
  return effet.valeur === 0 || effet.stat === 'action' ? libelleEffet(effet) : `${effet.valeur > 0 ? '+' : '−'} ${Math.abs(effet.valeur)} ${libelleEffet(effet)}`;
}

function puce(contribution: number, nom: string): string {
  return `${contribution > 0 ? '+' : '−'} ${Math.abs(contribution)} ${nom}`;
}

/** Identifiant suivant : `e-<plus grand numéro + 1>`. */
export function nextEffectId(effets: readonly CombatEffect[]): string {
  const max = effets.reduce((plusGrand, effet) => {
    const numero = Number(effet.id.replace(/^e-/, ''));
    return Number.isInteger(numero) ? Math.max(plusGrand, numero) : plusGrand;
  }, 0);
  return `e-${max + 1}`;
}

/** Produit l'identifiant d'un effet à créer, vu la liste déjà là. */
export type EffectIdGenerator = (effets: readonly CombatEffect[]) => string;

/** Identifiant jamais réutilisé, même quand l'effet qui portait le plus grand numéro a été consommé ou retiré : une croix restée à l'écran
 * ne peut alors pas retirer un autre effet. */
export const idAleatoire: EffectIdGenerator = () => `e-${crypto.randomUUID().slice(0, 8)}`;

function ajouter(effets: readonly CombatEffect[], crees: readonly NewEffect[], genererId: EffectIdGenerator): CombatEffect[] {
  const resultat = [...effets];
  for (const cree of crees) {
    resultat.push({...cree, id: genererId(resultat)});
  }
  return resultat;
}

/** Les modificateurs d'un jet, un par puce. Un effet de valeur 0 (une trace) n'en produit pas.
 * Attaque : les effets d'attaque de l'attaquant, la défense de la cible, et le petit bouclier de la fiche s'il n'a pas servi.
 * Dégâts : les effets de dégâts de l'attaquant et la protection de la cible. */
export function modificateursPour(effets: readonly CombatEffect[], contexte: RollContext): ModifierTerm[] {
  const {jet, attaquant, cible} = contexte;
  const statDeLAttaquant: EffectStat = jet === 'attaque' ? 'attaque' : 'degats';
  const statDeLaCible: EffectStat = jet === 'attaque' ? 'defense' : 'protection';
  const termes: ModifierTerm[] = [];

  for (const effet of effets) {
    if (effet.valeur === 0) {
      continue;
    }
    const deLAttaquant = effet.porteur === attaquant && effet.quand === 'attaque' && effet.stat === statDeLAttaquant;
    const subiParLaCible = effet.porteur === cible && effet.quand === 'subie' && effet.stat === statDeLaCible;
    if (!deLAttaquant && !subiParLaCible) {
      continue;
    }
    if (effet.cible !== undefined && effet.cible !== (deLAttaquant ? cible : attaquant)) {
      continue;
    }
    // Un bonus de défense ou de protection de la cible pèse contre l'attaquant.
    const contribution = subiParLaCible ? -effet.valeur : effet.valeur;
    const nom = contexte.noms?.[effet.porteur];
    termes.push({effetId: effet.id, label: puce(contribution, nom ? `${libelleEffet(effet)} (${nom})` : libelleEffet(effet)), valeur: contribution, tone: contribution > 0 ? 'plus' : 'minus'});
  }

  // Le petit bouclier ne joue qu'une fois par round ; le grand joue contre toutes les attaques. Les deux tombent quand la carte perd
  // le bénéfice de son bouclier.
  const sansBouclier = effets.some((effet) => effet.porteur === cible && effet.origine === SANS_BOUCLIER);
  const depense = effets.some((effet) => effet.porteur === cible && effet.origine === BOUCLIER_DEPENSE);
  if (jet === 'attaque' && contexte.bouclier > 0 && !sansBouclier && !depense) {
    termes.push({effetId: null, label: puce(-contexte.bouclier, 'bouclier'), valeur: -contexte.bouclier, tone: 'minus'});
  }
  if (jet === 'attaque' && contexte.bouclierToutes > 0 && sansBouclier) {
    termes.push({effetId: null, label: puce(contexte.bouclierToutes, 'grand bouclier perdu'), valeur: contexte.bouclierToutes, tone: 'plus'});
  }
  return termes;
}

/** Les puces d'un jet sans celle d'un effet retiré : un jet déjà fait recalcule son total tout de suite. */
export function sansTerme(termes: readonly ModifierTerm[], effetId: string): readonly ModifierTerm[] {
  return termes.filter((terme) => terme.effetId !== effetId);
}

/** Total des contributions des puces. */
export function sommeModificateurs(termes: readonly ModifierTerm[]): number {
  return termes.reduce((somme, terme) => somme + terme.valeur, 0);
}

/** Fait évoluer le registre. Fonction pure : l'entrée n'est jamais modifiée. */
export function appliquerEvenement(effets: readonly CombatEffect[], evenement: EffectEvent, genererId: EffectIdGenerator = nextEffectId): readonly CombatEffect[] {
  switch (evenement.type) {
    case 'debut-tour':
      return effets.filter(
        (effet) =>
          !(effet.porteur === evenement.carte && (effet.duree.type === 'debut-tour-porteur' || (effet.duree.type === 'usages' && effet.duree.expireAuTour === true))),
      );

    case 'fin-tour': {
      // La carte repart de zéro : ce qu'elle portait de son tour précédent et les effets « à sa prochaine action » tombent,
      // puis ceux de ce tour naissent. Un effet recréé remplace le précédent au lieu de s'y ajouter.
      const restants = effets.filter(
        (effet) =>
          !(effet.porteur === evenement.carte && (effet.duree.type === 'debut-tour-porteur' || effet.duree.type === 'action-porteur')) &&
          !evenement.crees.some((cree) => cree.origine === effet.origine && cree.porteur === effet.porteur),
      );
      return ajouter(restants, evenement.crees, genererId);
    }

    case 'jet-attaque': {
      const apresUsage = effets.flatMap((effet): CombatEffect[] => {
        // Seuls les effets de défense de la cible qui valent contre cet attaquant se consomment.
        const concerne = effet.quand === 'subie' && effet.stat === 'defense' && (effet.cible === undefined || effet.cible === evenement.attaquant);
        if (effet.porteur !== evenement.cible || effet.duree.type !== 'usages' || !concerne) {
          return [effet];
        }
        return effet.duree.restants > 1 ? [{...effet, duree: {...effet.duree, restants: effet.duree.restants - 1}}] : [];
      });
      // Seule une cible qui porte un petit bouclier garde la trace de ce jet : c'est lui qui est dépensé pour le round.
      const dejaDepense = apresUsage.some((effet) => effet.porteur === evenement.cible && effet.origine === BOUCLIER_DEPENSE);
      return dejaDepense || !evenement.petitBouclier
        ? apresUsage
        : ajouter(apresUsage, [{origine: BOUCLIER_DEPENSE, porteur: evenement.cible, stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false}], genererId);
    }

    case 'nouveau-round':
      return effets.filter((effet) => effet.duree.type !== 'fin-round');

    case 'ajout-manuel':
      return ajouter(effets, [{...evenement.effet, manuel: true}], genererId);

    case 'retrait-manuel':
      return effets.filter((effet) => effet.id !== evenement.id);

    case 'carte-retiree':
      return effets.filter((effet) => effet.porteur !== evenement.carte && effet.cible !== evenement.carte);
  }
}

/** Les effets durables que crée la fin du tour d'une carte : posture (défense, parade, perte du bouclier) et défense totale. */
export function effetsDeTour(carte: string, choix: TurnChoice): NewEffect[] {
  const defense = {porteur: carte, stat: 'defense', quand: 'subie', manuel: false} as const;
  const jusquAuTour = {type: 'debut-tour-porteur'} as const;
  const effets: NewEffect[] = [];
  const posture = choix.posture;
  const valeur = posture ? POSTURE_DEFENSE[posture] : undefined;

  if (posture && valeur) {
    effets.push({
      ...defense,
      origine: POSTURE_ORIGINE[posture],
      valeur,
      // La parade ne couvre qu'une attaque subie, et tombe avec le tour de son porteur si elle n'a pas servi.
      duree: posture === 'dual-parry' ? {type: 'usages', restants: 1, expireAuTour: true} : jusquAuTour,
    });
  }
  if (posture === 'intrepid') {
    effets.push({...defense, origine: SANS_BOUCLIER, valeur: 0, duree: jusquAuTour});
  }
  if (choix.defenseTotale) {
    effets.push({...defense, origine: 'defense-totale', valeur: 2, duree: jusquAuTour});
  }
  return effets;
}

const MAX_EFFETS = 200;
const STATS: readonly string[] = ['attaque', 'defense', 'degats', 'protection', 'action'];
const QUAND: readonly string[] = ['attaque', 'subie'];
const DUREES: readonly string[] = ['usages', 'fin-round', 'debut-tour-porteur', 'action-porteur', 'combat'];

function texte(valeur: unknown): string | null {
  return typeof valeur === 'string' && valeur !== '' ? valeur : null;
}

function duree(raw: unknown): EffectDuration | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  const type = source['type'];
  if (typeof type !== 'string' || !DUREES.includes(type)) {
    return null;
  }
  if (type !== 'usages') {
    return {type} as EffectDuration;
  }
  const restants = source['restants'];
  if (!Number.isInteger(restants) || (restants as number) < 1 || (restants as number) > 20) {
    return null;
  }
  return source['expireAuTour'] === true ? {type: 'usages', restants: restants as number, expireAuTour: true} : {type: 'usages', restants: restants as number};
}

function effetValide(raw: unknown): CombatEffect | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  const id = texte(source['id']);
  const origine = texte(source['origine']);
  const porteur = texte(source['porteur']);
  const valeur = source['valeur'];
  const fin = duree(source['duree']);
  if (!id || !origine || !porteur || !fin) {
    return null;
  }
  if (!Number.isInteger(valeur) || (valeur as number) < -20 || (valeur as number) > 20) {
    return null;
  }
  if (!STATS.includes(source['stat'] as string) || !QUAND.includes(source['quand'] as string)) {
    return null;
  }
  const cible = texte(source['cible']);
  const libelle = texte(source['libelle']);
  return {
    id,
    origine,
    porteur,
    stat: source['stat'] as EffectStat,
    valeur: valeur as number,
    quand: source['quand'] as EffectWhen,
    duree: fin,
    manuel: source['manuel'] === true,
    ...(cible ? {cible} : {}),
    ...(libelle ? {libelle: libelle.slice(0, 60)} : {}),
  };
}

/** Effets valides à partir de ce que renvoie l'API : les lignes invalides ou en double sont ignorées, 200 au plus (mêmes règles que le backend). */
export function normalizeEffets(raw: unknown): CombatEffect[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const vus = new Set<string>();
  const effets: CombatEffect[] = [];
  for (const candidat of raw) {
    const effet = effetValide(candidat);
    if (effet && !vus.has(effet.id)) {
      vus.add(effet.id);
      effets.push(effet);
      if (effets.length >= MAX_EFFETS) {
        break;
      }
    }
  }
  return effets;
}

function clesUniques(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter((cle): cle is string => typeof cle === 'string' && cle !== ''))] : [];
}

/** Effets équivalents à un état de l'ancien format : `defense_totale` (+2 jusqu'au prochain tour) et `attaquees` (bouclier dépensé ce round). */
export function effetsDeLAncienFormat(source: Record<string, unknown>): CombatEffect[] {
  const defense = clesUniques(source['defense_totale']).map<NewEffect>((porteur) => ({origine: 'defense-totale', porteur, stat: 'defense', valeur: 2, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false}));
  const bouclier = clesUniques(source['attaquees']).map<NewEffect>((porteur) => ({origine: BOUCLIER_DEPENSE, porteur, stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false}));
  return [...defense, ...bouclier].map((effet, index) => ({...effet, id: `e-${index + 1}`}));
}

/** La durée d'un effet en français, pour l'infobulle et le bloc « Effets en cours ». */
export function libelleDuree(duree: EffectDuration): string {
  switch (duree.type) {
    case 'usages': {
      const base = `${duree.restants} ${duree.restants > 1 ? 'attaques subies' : 'attaque subie'}`;
      return duree.expireAuTour ? `${base}, ou jusqu’à son prochain tour` : base;
    }
    case 'fin-round':
      return 'jusqu’à la fin du round';
    case 'debut-tour-porteur':
      return 'jusqu’à son prochain tour';
    case 'action-porteur':
      return 'jusqu’à sa prochaine action';
    case 'combat':
      return 'jusqu’à la fin du combat';
  }
}

/** Coup précis (option de succès héroïque) : la cible, estropiée, garde un dé de malus à ses jets jusqu'à la fin du combat — le MJ le
 * retire s'il ne concernait pas ses attaques. */
export function effetCoupPrecis(porteur: string): NewEffect {
  return {origine: DE_MALUS, libelle: 'coup précis : dé de malus', porteur, stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'combat'}, manuel: true};
}

/** Renversement (option de succès héroïque) : la cible, jetée à terre, se relève avec un dé de malus à sa prochaine action. */
export function effetRenversement(porteur: string): NewEffect {
  return {origine: DE_MALUS, libelle: 'renversé : dé de malus', porteur, stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'action-porteur'}, manuel: true};
}

/** Un héros tombé à 0 sombre dans l'inconscience jusqu'à la fin du combat : on ne lui propose plus de reprendre ses esprits. */
export function effetInconscient(porteur: string): NewEffect {
  return {origine: INCONSCIENT, libelle: 'inconscient', porteur, stat: 'action', valeur: 0, quand: 'attaque', duree: {type: 'combat'}, manuel: false};
}

/** Vrai si le héros a déjà choisi de sombrer dans l'inconscience pour ce combat. */
export function aSombre(effets: readonly CombatEffect[], carte: string): boolean {
  return effets.some((effet) => effet.porteur === carte && effet.origine === INCONSCIENT);
}

/** Un héros mourant stabilisé — par « Défier la mort » sous −5, ou secouru à la table — ne perd plus 1 de vitalité par round. */
export function effetStabilise(porteur: string): NewEffect {
  return {origine: STABILISE, libelle: 'stabilisé', porteur, stat: 'action', valeur: 0, quand: 'attaque', duree: {type: 'combat'}, manuel: false};
}

/** Vrai si le héros a été stabilisé pendant ce combat. */
export function aStabilise(effets: readonly CombatEffect[], carte: string): boolean {
  return effets.some((effet) => effet.porteur === carte && effet.origine === STABILISE);
}

/** Des dégâts encaissés à mains nues : ils se récupèrent en totalité après le combat (02-actions-combat.md, « Récupération »). Une
 * trace par coup, pour tout le combat ; elle n'entre dans aucun jet. */
export function effetDegatsMainsNues(porteur: string, degats: number): NewEffect {
  const valeur = Math.min(20, degats);
  return {origine: MAINS_NUES, libelle: `${valeur} ${valeur > 1 ? 'dégâts' : 'dégât'} à mains nues`, porteur, stat: 'action', valeur, quand: 'subie', duree: {type: 'combat'}, manuel: false};
}

/** Les dégâts encaissés à mains nues par la carte pendant ce combat. */
export function degatsMainsNues(effets: readonly CombatEffect[], carte: string): number {
  return effets.filter((effet) => effet.porteur === carte && effet.origine === MAINS_NUES).reduce((total, effet) => total + effet.valeur, 0);
}

/** Héros surpris ou pris en embuscade : un personnage ne bénéficie de son bouclier que s'il est conscient de l'attaque
 * (`doc/resources/armures.md`) ; au premier round, le camp des héros n'en a pas. Le MJ peut retirer l'effet. */
export function effetSurpris(porteur: string): NewEffect {
  return {origine: SANS_BOUCLIER, libelle: 'surpris', porteur, stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: true};
}

/** Vrai si la carte doit un dé de malus à sa prochaine action : son jet d'attaque se fera à 3d6, en gardant les deux moins bons. */
export function doitUnDeDeMalus(effets: readonly CombatEffect[], carte: string): boolean {
  return effets.some((effet) => effet.porteur === carte && effet.origine === DE_MALUS);
}

/** Les effets que le MJ ajoute à la main depuis le menu « + Effet ». */
export const EFFETS_MODELES: readonly {readonly id: string; readonly libelle: string; readonly creer: (porteur: string) => NewEffect}[] = [
  {
    id: 'defense-round',
    libelle: '+1 en défense jusqu’à la fin du round',
    creer: (porteur) => ({origine: 'manuel', libelle: 'défense', porteur, stat: 'defense', valeur: 1, quand: 'subie', duree: {type: 'fin-round'}, manuel: true}),
  },
  {
    id: 'de-malus-action',
    libelle: 'Dé de malus à sa prochaine action',
    creer: (porteur) => ({origine: DE_MALUS, libelle: 'dé de malus', porteur, stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'action-porteur'}, manuel: true}),
  },
  {
    id: 'malus-attaque-round',
    libelle: '−1 à ses jets d’attaque jusqu’à la fin du round',
    creer: (porteur) => ({origine: 'manuel', libelle: 'malus d’attaque', porteur, stat: 'attaque', valeur: -1, quand: 'attaque', duree: {type: 'fin-round'}, manuel: true}),
  },
  {
    id: 'action-perdue',
    libelle: 'Perd sa prochaine action',
    creer: (porteur) => ({origine: 'egratignure', libelle: 'perd sa prochaine action', porteur, stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'action-porteur'}, manuel: true}),
  },
];
