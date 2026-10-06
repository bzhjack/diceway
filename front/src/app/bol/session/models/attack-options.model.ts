import {BolCombatOptionModel} from '../../models/bol-combat-reference.model';

/** Ce avec quoi la carte active attaque : les dégâts de l'arme choisie (`null` = ceux de la carte,
 * pour un PNJ, une créature ou un démon) et la posture (`null` = aucune). */
export interface AttackChoice {
  readonly degats: string | null;
  readonly posture: BolCombatOptionModel | null;
}
