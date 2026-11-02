/** Posture de combat du référentiel (offensive, défensive…) et son modificateur au jet d'attaque. */
export interface BolCombatOptionModel {
  id: number;
  label: string;
  slug: string;
  modificateur: number;
  modificateur_armor: boolean;
  note: string;
  ordre: number;
}
