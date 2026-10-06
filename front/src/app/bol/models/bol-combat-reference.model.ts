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

/** Effet héroïque du référentiel de combat, avec sa description. */
export interface BolHeroicOptionModel {
  id: number;
  label: string;
  slug: string;
  description: string;
  ordre: number;
}

/** Niveau de difficulté d'un jet (moyenne, etc.) et son modificateur. */
export interface BolDifficulteModel {
  id: number;
  label: string;
  modificateur: number;
  ordre: number;
}
