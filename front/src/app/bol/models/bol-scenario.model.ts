/** Le scénario d'un chapitre (« Perle du Beshaar ») : son id et son nom. */
export interface BolScenarioSaga {
  id: string;
  titre: string;
}

/** Un chapitre (`BolScenario`) : son nom, son numéro dans son scénario (0 pour l'introduction, null sans numéro) et son scénario (null
 * pour un one shot). */
export interface BolScenarioModel {
  id: string | null;
  user_id?: string | null;
  titre: string;
  pitch: string | null;
  numero?: number | null;
  saga?: BolScenarioSaga | null;
}
