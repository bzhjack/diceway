import {BolHerosModel} from "./bol-heros.model";
import {BolCreatureModel} from "./bol-creature.model";

export interface BolQuestModel {
  id: string | null;
  user_id: string;
  titre: string;
  commentaire: string | null;
  protagonists: BolQuestProtagonistModel[]
}

export interface BolQuestProtagonistModel {
  id: number;                        // L'identifiant unique du protagoniste
  quest_id: string;                  // L'ID de la quête à laquelle appartient ce protagoniste
  protagonist_id: string;            // L'ID unique du protagoniste (héros, ennemi, etc.)
  protagonist_type: string;          // Le type du protagoniste (relié à un modèle spécifique)
  type: string;                      // Type du protagoniste (par ex., 'H' pour héros)
  vitalite: number;
  heroisme: number;
  foi: number;
  creation: number;
  vilenie: number;
  protagonist?: BolHerosModel | BolCreatureModel
}
