import {InitiativeResultat} from '../models/bol-fight-session.model';
import {combatantRankKey} from './select/combat-statblock.util';
import {CombatCatalogEntry, SelectedCombatant} from '../services/combat-selection.service';

export type InitiativeKind = 'hero' | 'pnj' | 'creature' | 'demon';

/** Les 8 paliers d'ordre de réaction BoL (02-actions-combat.md), du premier au dernier à agir. */
export type InitiativeTierKey =
  | 'legendaire'
  | 'heroique'
  | 'reussite'
  | 'rival'
  | 'coriace'
  | 'echec'
  | 'pietaille'
  | 'echec_critique';

const TIER_ORDER: readonly InitiativeTierKey[] = [
  'legendaire',
  'heroique',
  'reussite',
  'rival',
  'coriace',
  'echec',
  'pietaille',
  'echec_critique',
];

const HERO_RESULT_TIER: Record<InitiativeResultat, InitiativeTierKey> = {
  legendaire: 'legendaire',
  heroique: 'heroique',
  reussite: 'reussite',
  echec: 'echec',
  echec_critique: 'echec_critique',
};

/** Coriaces et piétaille adverses ne jouent pas au round 1 si un héros a obtenu héroïque/légendaire. */
const ROUND1_LOCKABLE_TIERS: ReadonlySet<InitiativeTierKey> = new Set(['coriace', 'pietaille']);

export interface InitiativeEntry {
  readonly key: string;
  readonly kind: InitiativeKind;
  readonly nom: string;
  /** null = héros dont le résultat n'a pas encore été saisi. */
  readonly tier: InitiativeTierKey | null;
  readonly resultat: InitiativeResultat | null;
  readonly lockedRound1: boolean;
}

export interface InitiativeOrder {
  readonly entries: readonly InitiativeEntry[];
  /** true si un héros a obtenu un succès légendaire : +1 à tous les jets d'attaque toute la rencontre. */
  readonly legendaryActive: boolean;
}

/** Combattant générique, indépendant de sa source. */
export interface InitiativeSource {
  readonly key: string;
  readonly kind: InitiativeKind;
  readonly nom: string;
  /** Rang BoL fixe (rival/coriace/pietaille) — uniquement pour pnj/creature/demon. */
  readonly rang: 'rival' | 'coriace' | 'pietaille' | null;
  /** Résultat du jet de réaction — uniquement pour un héros. */
  readonly resultat: InitiativeResultat | null;
}

/** Construit l'ordre d'action combiné à partir de sources génériques (héros + PNJ + créatures + démons). */
export function buildInitiativeOrderFrom(sources: readonly InitiativeSource[]): InitiativeOrder {
  const legendaryActive = sources.some((s) => s.resultat === 'legendaire');
  const round1BlockActive = sources.some((s) => s.resultat === 'legendaire' || s.resultat === 'heroique');

  const entries = sources
    .map((s): InitiativeEntry => {
      const tier: InitiativeTierKey | null = s.resultat ? HERO_RESULT_TIER[s.resultat] : s.rang;

      return {
        key: s.key,
        kind: s.kind,
        nom: s.nom,
        tier,
        resultat: s.resultat,
        lockedRound1: tier !== null && s.rang !== null && round1BlockActive && ROUND1_LOCKABLE_TIERS.has(tier),
      };
    })
    .sort((a, b) => tierIndex(a.tier) - tierIndex(b.tier));

  return {entries, legendaryActive};
}

/** Adaptateur : construit les sources à partir du brouillon de sélection (avant lancement du combat). */
export function buildInitiativeOrderFromSelection(
  combatants: readonly SelectedCombatant[],
  entryFor: (catalogId: string) => CombatCatalogEntry | undefined,
  heroInitiative: ReadonlyMap<string, InitiativeResultat>,
): InitiativeOrder {
  const sources: InitiativeSource[] = combatants.flatMap((c): InitiativeSource[] => {
    const entry = entryFor(c.catalogId);
    if (!entry) {
      return [];
    }

    return [
      {
        key: c.catalogId,
        kind: entry.kind,
        nom: entry.nom,
        rang: combatantRankKey(entry),
        resultat: entry.kind === 'hero' ? (heroInitiative.get(c.catalogId) ?? null) : null,
      },
    ];
  });

  return buildInitiativeOrderFrom(sources);
}

/** Un combattant sans résultat/rang connu passe en toute fin de liste, en attendant la saisie du MJ. */
function tierIndex(tier: InitiativeTierKey | null): number {
  return tier ? TIER_ORDER.indexOf(tier) : TIER_ORDER.length;
}

export const INITIATIVE_RESULT_OPTIONS: readonly {value: InitiativeResultat; label: string}[] = [
  {value: 'echec_critique', label: 'Échec critique'},
  {value: 'echec', label: 'Échec'},
  {value: 'reussite', label: 'Réussite'},
  {value: 'heroique', label: 'Succès héroïque'},
  {value: 'legendaire', label: 'Succès légendaire'},
];
