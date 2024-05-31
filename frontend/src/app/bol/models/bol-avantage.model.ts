export interface BolAvantageModel {
  id: number | null;
  avantage: string;
  attribut: string | null;
  attribut_bonus: boolean | null;
  de_bonus: boolean | null,
  de_bonus_domaine: string | null,
  description: string | null,
  pivot: {detail: string}
}
