export interface BolDesavantageModel {
  id: number | null;
  desavantage: string;
  attribut: string | null;
  attribut_malus: number | null;
  de_malus: boolean | null;
  de_malus_domaine: string| null;
  description: string | null;
  pivot: { detail: string, desavantage_id: number, region_id: number };
}
