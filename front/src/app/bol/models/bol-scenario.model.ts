export interface BolScenarioModel {
  id: string | null;
  user_id?: string | null;
  titre: string;
  pitch: string | null;
  pj?: BolScenarioPjModel[];
}

export interface BolScenarioPjModel {
  id: number;
  scenario_id: string;
  heros_id: string;
  heros?: {
    id: string | null;
    origines: {nom: string | null; avatar: string | null; joueur: string | null};
  };
}
