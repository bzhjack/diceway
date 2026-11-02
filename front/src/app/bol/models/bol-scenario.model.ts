/** Un scénario préparé en bibliothèque : son titre et son pitch. */
export interface BolScenarioModel {
  id: string | null;
  user_id?: string | null;
  titre: string;
  pitch: string | null;
}
