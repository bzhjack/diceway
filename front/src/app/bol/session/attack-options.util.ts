import {BolHerosArmeModel} from '../models/bol-arme.model';
import {BolCombatOptionModel} from '../models/bol-combat-reference.model';
import {isDualWieldEligible} from './combat-attack.util';

/** Postures proposées à l'attaquant (doc/rules/02-actions-combat.md, "Options de combat") — "Défense
 * totale" en est exclue : elle empêche d'attaquer, elle a son propre bouton dans la barre d'action. */
const IN_SCOPE_POSTURE_SLUGS: ReadonlySet<string> = new Set([
  'none',
  'offensive',
  'intrepid',
  'defensive',
  'armor-chink',
  'dual-parry',
  'dual-strike',
]);

export const DUAL_WIELD_SLUGS: ReadonlySet<string> = new Set(['dual-parry', 'dual-strike']);

/** Options de combat proposées à l'attaquant, triées par ordre d'affichage — "Aucune" en premier. */
export function filterAttackMenuCombatOptions(options: readonly BolCombatOptionModel[]): readonly BolCombatOptionModel[] {
  return options.filter((o) => IN_SCOPE_POSTURE_SLUGS.has(o.slug)).sort((a, b) => a.ordre - b.ordre);
}

/** Masque les postures de combat à deux armes tant qu'elles ne sont pas jouables : l'arme principale
 * ET au moins une autre arme doivent toutes deux être légères ou moyennes (02-actions-combat.md). */
export function filterVisiblePostures(
  options: readonly BolCombatOptionModel[],
  mainDegats: string | null,
  otherArmesDegats: readonly (string | null)[],
): readonly BolCombatOptionModel[] {
  const dualWieldPlayable = isDualWieldEligible(mainDegats) && otherArmesDegats.some((d) => isDualWieldEligible(d));
  return dualWieldPlayable ? options : options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
}

/** Options toujours disponibles à un héros en plus de ses armes (table des dégâts de BoL). */
export const MAINS_NUES: BolHerosArmeModel = {
  id: -1,
  arme_id: -1,
  arme: {id: null, arme: 'Mains nues', type: 'M', degats: 'd3', portee: null, notes: null},
};
export const ARME_IMPROVISEE: BolHerosArmeModel = {
  id: -2,
  arme_id: -2,
  arme: {id: null, arme: 'Arme improvisée', type: 'M', degats: 'd3', portee: null, notes: null},
};

