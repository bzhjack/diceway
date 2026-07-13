export interface BolAvantageModel {
  id: number | null;
  avantage: string;
  attribut: string | null;
  attribut_bonus: number | null;
  de_bonus: boolean | null;
  de_bonus_domaine: string | null;
  description: string | null;
  pivot: { detail: string, avantage_id: number, region_id: number };
}
