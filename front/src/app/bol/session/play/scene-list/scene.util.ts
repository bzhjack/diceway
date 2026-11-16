import {BolSessionSceneRef} from '../../../models/bol-fight-session.model';
import {BolSceneModel} from '../../../models/bol-scene.model';

export const SCENE_TITLE_MAX = 120;

/** Scènes d'un scénario (`null` = « On improvise »), triées par ordre puis par titre. Une scène dont
 * le scénario n'est pas connu (supprimé entre-temps) est rangée dans « On improvise ». */
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

/** Titre de la barre du haut selon le mode : en mode libre, le titre de la session — la frise des actes montre
 * déjà le scénario et la scène ; en combat, « Scénario · Scène » (cf. `tableTitle`). */
export function headerTitle(mode: 'libre' | 'combat', sessionTitre: string | null, scene: BolSessionSceneRef | null | undefined): string | null {
  return mode === 'libre' ? sessionTitre : tableTitle(sessionTitre, scene);
}

export function loadMessage(titre: string, ignored: number): string {
  const base = `Scène « ${titre} » chargée.`;
  return ignored > 0 ? `${base} ${ignoresMessage(ignored)}` : base;
}

/** Ce qu'il faut dire des figurants qu'un chargement de scène a laissés de côté ; rien s'il n'y en a pas. */
export function ignoresMessage(ignored: number | undefined): string {
  if (!ignored || ignored <= 0) {
    return '';
  }
  return ignored === 1
    ? '1 personnage a été ignoré (déjà sur la table ou supprimé de la bibliothèque).'
    : `${ignored} personnages ont été ignorés (déjà sur la table ou supprimés de la bibliothèque).`;
}
