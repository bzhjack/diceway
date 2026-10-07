import {InitiativeResultat} from '../models/bol-fight-session.model';
import {combatantRankKey} from './combat-statblock.util';
import {CombatCatalogEntry, SelectedCombatant} from '../models/combat-selection.model';
import {InitiativeTierKey, InitiativeEntry, InitiativeOrder, InitiativeSource} from './models/initiative.model';

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

/** Construit l'ordre d'action combiné à partir de sources génériques (héros + PNJ + créatures + démons). */
export function buildInitiativeOrderFrom(sources: readonly InitiativeSource[]): InitiativeOrder {
  const legendaryActive = sources.some((s) => s.resultat === 'legendaire');
  const round1BlockActive = sources.some((s) => s.resultat === 'legendaire' || s.resultat === 'heroique');

  const entries = sources
    .map((s): InitiativeEntry => {
      const tier: InitiativeTierKey | null = s.resultat ? HERO_RESULT_TIER[s.resultat] : s.rang;

      // Un héros en échec critique est bloqué au round 1 sans condition (contrairement aux
      // coriaces/piétaille adverses, bloqués seulement face à un héroïque/légendaire allié).
      const lockedRound1 =
        s.resultat === 'echec_critique' ||
        (tier !== null && s.rang !== null && round1BlockActive && ROUND1_LOCKABLE_TIERS.has(tier));

      return {
        key: s.key,
        kind: s.kind,
        nom: s.nom,
        tier,
        resultat: s.resultat,
        lockedRound1,
      };
    })
    .sort((a, b) => tierIndex(a.tier) - tierIndex(b.tier));

  return {entries, legendaryActive};
}

/** Un combattant sans résultat/rang connu passe en toute fin de liste, en attendant la saisie du MJ. */
function tierIndex(tier: InitiativeTierKey | null): number {
  return tier ? TIER_ORDER.indexOf(tier) : TIER_ORDER.length;
}

export const INITIATIVE_RESULT_OPTIONS: readonly {value: InitiativeResultat; label: string; short: string}[] = [
  {value: 'echec_critique', label: 'Échec critique', short: 'Crit.'},
  {value: 'echec', label: 'Échec', short: 'Éch.'},
  {value: 'reussite', label: 'Réussite', short: 'Réu.'},
  {value: 'heroique', label: 'Succès héroïque', short: 'Hér.'},
  {value: 'legendaire', label: 'Succès légendaire', short: 'Lég.'},
];
