import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {BolSceneChanges, BolSceneDistributionSaisie, BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../models/combat-selection.model';
import {KIND_LABEL} from '../../session/play/reserve/reserve.util';
import {EMPTY_AVATAR} from '../../../shared/avatar-fallback/avatar.util';
import {SceneFormValue, ScenePersonnageVue} from '../models/scene-form.model';

/** Texte rogné ; `null` s'il est vide. */
function texte(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

/** La valeur du formulaire pour une scène : les champs absents deviennent des textes vides, un danger absent devient 0. */
export function sceneFormValue(scene: BolSceneModel | null): SceneFormValue {
  if (!scene) {
    return {titre: '', region_id: null, lieu: '', moment: null, meteo: null, danger: 0, lecture: '', jeu: '', notes: '', pistes: []};
  }
  return {
    titre: scene.titre,
    region_id: scene.region_id,
    lieu: scene.lieu ?? '',
    moment: scene.moment,
    meteo: scene.meteo,
    danger: scene.danger ?? 0,
    lecture: scene.lecture ?? '',
    jeu: scene.jeu ?? '',
    notes: scene.notes ?? '',
    pistes: (scene.pistes ?? []).map((piste) => ({...piste})),
  };
}

/** Les changements à enregistrer pour une valeur du formulaire : textes rognés, vides à `null`, danger 0 à `null`, pistes sans texte
 * retirées (aucune piste : `null`). L'illustration n'y est pas : elle ne change pas. */
export function sceneChanges(value: SceneFormValue): BolSceneChanges {
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
    lecture: texte(value.lecture),
    jeu: texte(value.jeu),
    notes: texte(value.notes),
    pistes: pistes.length ? pistes : null,
  };
}

/** Les personnages d'une scène, à éditer : camp `adversaires` et attitude `null` pour les scènes enregistrées avant qu'ils n'existent,
 * un PNJ toujours seul. */
export function personnagesDe(scene: BolSceneModel | null): BolSceneDistributionSaisie[] {
  return (scene?.distribution ?? []).map((entree) => ({
    kind: entree.kind,
    source_id: String(entree.source_id),
    qty: entree.kind === 'pnj' ? 1 : Math.max(1, entree.qty),
    camp: entree.camp === 'heros' ? 'heros' : 'adversaires',
    attitude: entree.attitude ?? null,
  }));
}

/** Les mêmes personnages, dans le même ordre, avec les mêmes réglages. */
export function memesPersonnages(gauche: readonly BolSceneDistributionSaisie[], droite: readonly BolSceneDistributionSaisie[]): boolean {
  return (
    gauche.length === droite.length &&
    gauche.every((p, i) => {
      const q = droite[i];
      return p.kind === q.kind && p.source_id === q.source_id && p.qty === q.qty && p.camp === q.camp && p.attitude === q.attitude;
    })
  );
}

/** Les personnages à montrer : chacun avec le nom, le portrait et le type de sa fiche dans le catalogue. Une fiche absente d'un
 * catalogue lu (`catalogueLu`) se dit introuvable ; tant qu'il ne l'est pas (chargement, échec), son nom attend. */
export function personnagesVus(
  personnages: readonly BolSceneDistributionSaisie[],
  catalogue: readonly CombatCatalogEntry[],
  catalogueLu = true,
): ScenePersonnageVue[] {
  const parCle = new Map(catalogue.map((entree) => [`${entree.kind}:${entree.sourceId}`, entree]));
  return personnages.map((p) => {
    const fiche = parCle.get(`${p.kind}:${p.source_id}`);
    return {
      ...p,
      nom: fiche?.nom ?? (catalogueLu ? 'Fiche introuvable' : '…'),
      avatar: fiche?.avatar ?? EMPTY_AVATAR,
      type: KIND_LABEL[p.kind],
      introuvable: catalogueLu && !fiche,
    };
  });
}

/** Ouvre « Préparer la scène » sur sa page ; elle revient à `returnUrl`, par défaut là où l'on est (la table). Depuis un dialogue
 * (« Gérer les scènes », la lecture agrandie), `dialog` les ferme d'abord : un dialogue ne se ferme pas de lui-même quand la page change. */
export function preparerLaScene(router: Router, sceneId: string, returnUrl = router.url, dialog?: MatDialog): void {
  dialog?.closeAll();
  void router.navigate(['/create/scene', sceneId], {state: {returnUrl}});
}

/** Ouvre « Préparer la scène » pour une nouvelle scène, qui naîtra au dernier rang de ce chapitre ; elle revient à `returnUrl`. */
export function creerUneScene(router: Router, chapitreId: string, returnUrl: string): void {
  void router.navigate(['/create/scene'], {queryParams: {chapitre: chapitreId}, state: {returnUrl}});
}
