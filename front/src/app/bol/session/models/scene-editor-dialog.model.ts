import {BolSceneModel, SceneMeteo, SceneMoment} from '../../models/bol-scene.model';

/** Données du dialogue « Préparer la scène » : la scène, et les autres scènes de son scénario vers
 * lesquelles une piste peut mener. */
export interface SceneEditorDialogData {
  readonly scene: BolSceneModel;
  readonly siblings: readonly BolSceneModel[];
}

/** Valeur du formulaire de préparation : des textes vides plutôt que `null`, et un danger à 0 pour
 * « aucun ». */
export interface SceneEditorValue {
  titre: string;
  region_id: number | null;
  lieu: string;
  moment: SceneMoment | null;
  meteo: SceneMeteo | null;
  danger: number;
  image: string;
  lecture: string;
  jeu: string;
  notes: string;
  pistes: {texte: string; scene_id: string | null}[];
}
