export interface BolHeroModel {
  id: string | null;
  joueur: string;
  avatar: string | null;
  nom: string;

  vitalite: number,
  heroisme: number,

  vigueur: number,
  aura: number,
  esprit: number,
  agilite: number,

  initiative: number,
  melee: number,
  tir: number,
  defense: number,

  region_id: number | null,
  region: string | null
}
