import {BolSceneChanges, BolSceneModel} from '../../../../models/bol-scene.model';
import {SceneEditorValue} from '../../../models/scene-editor-dialog.model';

/** Texte rogné ; `null` s'il est vide. */
function texte(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

/** La valeur du formulaire de préparation pour une scène : les champs absents deviennent des textes vides,
 * un danger absent devient 0. */
export function editorValue(scene: BolSceneModel): SceneEditorValue {
  return {
    titre: scene.titre,
    region_id: scene.region_id,
    lieu: scene.lieu ?? '',
    moment: scene.moment,
    meteo: scene.meteo,
    danger: scene.danger ?? 0,
    image: scene.image ?? '',
    lecture: scene.lecture ?? '',
    jeu: scene.jeu ?? '',
    notes: scene.notes ?? '',
    pistes: (scene.pistes ?? []).map((piste) => ({...piste})),
  };
}

/** Les changements à enregistrer pour une valeur du formulaire : textes rognés, vides à `null`, danger 0 à
 * `null`, pistes sans texte retirées (aucune piste : `null`). */
export function sceneChanges(value: SceneEditorValue): BolSceneChanges {
  const pistes = value.pistes
    .map((piste) => ({texte: piste.texte.trim(), scene_id: piste.scene_id}))
    .filter((piste) => piste.texte !== '');
  return {
    titre: value.titre.trim(),
    region_id: value.region_id,
    lieu: texte(value.lieu),
    moment: value.moment,
    meteo: value.meteo,
    danger: value.danger > 0 ? value.danger : null,
    image: texte(value.image),
    lecture: texte(value.lecture),
    jeu: texte(value.jeu),
    notes: texte(value.notes),
    pistes: pistes.length ? pistes : null,
  };
}
