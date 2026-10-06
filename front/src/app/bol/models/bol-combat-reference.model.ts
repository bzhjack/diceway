export interface BolCombatOptionModel {
  id: number;
  label: string;
  slug: string;
  modificateur: number;
  modificateur_armor: boolean;
  note: string;
  ordre: number;
}

export interface BolHeroicOptionModel {
  id: number;
  label: string;
  slug: string;
  description: string;
  ordre: number;
}

export interface BolDifficulteModel {
  id: number;
  label: string;
  modificateur: number;
  ordre: number;
}
