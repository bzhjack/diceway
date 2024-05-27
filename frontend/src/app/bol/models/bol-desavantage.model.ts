export interface BolDesavantageModel {
  id: string | null;
  desavantage: string;
  attribut: string | null;
  attribut_malus: boolean | null;
  de_malus: boolean | null,
  de_malus_domaine: string | null,
  description: string | null,
  pivot: {detail: string}
}
