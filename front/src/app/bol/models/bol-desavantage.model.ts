/** Un désavantage du catalogue : malus d'attribut ou dé de malus sur un domaine ; `pivot` porte le détail
 * propre à une région. */
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
