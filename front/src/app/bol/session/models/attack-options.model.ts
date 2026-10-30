import {BolCombatOptionModel} from '../../models/bol-combat-reference.model';

/** Ce avec quoi la carte active attaque : les dégâts de l'arme choisie (`null` = ceux de la carte,
 * pour un PNJ, une créature ou un démon), la posture (`null` = aucune) et l'option spéciale qui s'y ajoute (défaut de l'armure,
 * combat à deux armes ; `null` = aucune). */
export interface AttackChoice {
  readonly degats: string | null;
  readonly posture: BolCombatOptionModel | null;
  readonly special: BolCombatOptionModel | null;
}
