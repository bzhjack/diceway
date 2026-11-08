/** Un scénario du compte d'où vient une fiche, ou qui la cite (`scenarios` d'une créature) : la saga, ou le chapitre d'un one shot. */
export interface BolFicheScenario {
  id: string;
  titre: string;
  one_shot: boolean;
}
