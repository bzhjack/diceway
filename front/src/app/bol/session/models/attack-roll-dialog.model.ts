import {ResolvedCombatStats} from './combat-attack.model';

/** Posture/option de combat choisie dans le menu épée (bol_combat_option) — seul le sous-ensemble
 * "modificateur simple au jet d'attaque" est géré ici (doc/rules/02-actions-combat.md, "Options de
 * combat") : offensive/intrépide/défensive/défaut de l'armure. Le volet défensif de ces postures
 * ("pour tout le round") n'est pas persisté côté session dans cette passe — seul l'attaquant en
 * bénéficie, sur son propre jet d'attaque. */
export interface AttackRollDialogPosture {
  readonly label: string;
  readonly slug: string;
  readonly modificateur: number;
}

/** Données du dialogue d'attaque : l'attaquant, la cible, leurs statistiques résolues et la posture
 * choisie. */
export interface AttackRollDialogData {
  readonly attackerNom: string;
  readonly targetNom: string;
  readonly attackerAvatar: string;
  readonly targetAvatar: string;
  readonly attacker: ResolvedCombatStats;
  readonly target: ResolvedCombatStats;
  /** true si l'attaquant a obtenu un succès légendaire au jet de réaction de cette rencontre
   * (`PlayToken.tier`) : +1 personnel à tous ses jets d'attaque durant toute la rencontre
   * (02-actions-combat.md). */
  readonly legendaryBonusActive: boolean;
  readonly posture: AttackRollDialogPosture | null;
}
