import {BolSessionSceneRef} from '../../../models/bol-fight-session.model';
import {BolSceneEntry, BolSceneModel, SceneEntryKind} from '../../../models/bol-scene.model';

/** Valeur du sélecteur de scénario pour « Sans scénario » (`mat-select` n'accepte pas `null` proprement). */
export const NO_SCENARIO = '__none__';

export const SCENE_TITLE_MAX = 120;

/** Scènes d'un scénario (`null` = « Sans scénario »), triées par ordre puis par titre. Une scène dont
 * le scénario n'est pas connu (supprimé entre-temps) est rangée dans « Sans scénario ». */
export function scenesOf(
  scenes: readonly BolSceneModel[],
  scenarioId: string | null,
  knownScenarioIds: ReadonlySet<string>,
): BolSceneModel[] {
  return scenes
    .filter((scene) => {
      const effective = scene.scenario_id && knownScenarioIds.has(scene.scenario_id) ? scene.scenario_id : null;
      return effective === scenarioId;
    })
    .sort((left, right) => left.ordre - right.ordre || left.titre.localeCompare(right.titre, 'fr'));
}

const KIND_LABELS: Record<SceneEntryKind, readonly [string, string]> = {
  pnj: ['PNJ', 'PNJ'],
  creature: ['créature', 'créatures'],
  demon: ['démon', 'démons'],
};

/** Résumé d'une distribution, en nombre d'exemplaires par type : « 2 PNJ · 3 créatures ». */
export function distributionSummary(entries: readonly BolSceneEntry[]): string {
  const parts = (Object.keys(KIND_LABELS) as SceneEntryKind[])
    .map((kind) => {
      const count = entries.filter((e) => e.kind === kind).reduce((sum, e) => sum + Math.max(1, e.qty), 0);
      return count > 0 ? `${count} ${KIND_LABELS[kind][count > 1 ? 1 : 0]}` : null;
    })
    .filter((part): part is string => part !== null);

  return parts.length ? parts.join(' · ') : 'Aucun personnage';
}

/** Nouvelle liste d'ids après avoir monté (−1) ou descendu (+1) une scène d'un rang. `null` si rien
 * ne change (déjà en bout de liste, ou scène absente). */
export function moveScene(ids: readonly string[], id: string, delta: -1 | 1): string[] | null {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) {
    return null;
  }

  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

/** Faut-il demander « Remplacer ou Ajouter » ? Seulement si la table porte autre chose que des héros. */
export function needsLoadChoice(nonHeroCount: number): boolean {
  return nonHeroCount > 0;
}

/** Titre de la barre du haut : « Scénario · Scène », la scène seule, ou le titre de la session. */
export function tableTitle(sessionTitre: string | null, scene: BolSessionSceneRef | null | undefined): string | null {
  if (!scene) {
    return sessionTitre;
  }
  return scene.scenario ? `${scene.scenario.titre} · ${scene.titre}` : scene.titre;
}

/** Titre saisi, rogné et borné à 120 caractères ; `null` s'il est vide. */
export function normalizeTitre(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  return trimmed ? trimmed.slice(0, SCENE_TITLE_MAX) : null;
}

export function loadMessage(titre: string, ignored: number): string {
  const base = `Scène « ${titre} » chargée.`;
  if (ignored <= 0) {
    return base;
  }
  return ignored === 1
    ? `${base} 1 personnage a été ignoré (déjà sur la table ou supprimé de la bibliothèque).`
    : `${base} ${ignored} personnages ont été ignorés (déjà sur la table ou supprimés de la bibliothèque).`;
}
