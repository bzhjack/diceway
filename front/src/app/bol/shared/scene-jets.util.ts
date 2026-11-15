import {SceneJetAttribut, SceneJetDifficulte} from '../models/bol-scene.model';
import {ACTION_ATTRIBUTE_LABELS, ACTION_DIFFICULTIES} from '../session/action-roll.util';
import {ActionDifficulty} from '../session/models/action-roll.model';

/** Au plus, les jets d'une scène (`BolSceneJets::JETS_MAX`) ; le titre d'un jet, puis chacun de ses textes. */
export const JETS_MAX = 20;
export const JET_TITRE_MAX = 120;
export const JET_TEXTE_MAX = 300;
/** Deux attributs au plus : « Vigueur ou Agilité », le héros prenant son meilleur. */
export const JET_ATTRIBUTS_MAX = 2;
export const JET_DIFFICULTE_PAR_DEFAUT: SceneJetDifficulte = 'moyenne';

/** Les attributs qu'un jet de scène peut demander, dans l'ordre de la fiche. */
export const JET_ATTRIBUTS: readonly {cle: SceneJetAttribut; label: string}[] = (['vigueur', 'agilite', 'esprit', 'aura'] as const).map((cle) => ({
  cle,
  label: ACTION_ATTRIBUTE_LABELS[cle],
}));

/** Les slugs de l'échelle, dans l'ordre d'`ACTION_DIFFICULTIES`. */
const SLUGS: readonly SceneJetDifficulte[] = ['tres-facile', 'facile', 'moyenne', 'ardue', 'difficile', 'tres-difficile', 'impossible', 'heroique'];

/** L'échelle du livre en slugs : le libellé et le modificateur sont ceux du panneau de jet (`ACTION_DIFFICULTIES`). */
export const JET_DIFFICULTES: readonly {cle: SceneJetDifficulte; label: string; modifier: number}[] = SLUGS.map((cle, i) => ({
  cle,
  label: ACTION_DIFFICULTIES[i].label,
  modifier: ACTION_DIFFICULTIES[i].modifier,
}));

/** La difficulté du panneau de jet qui répond à ce slug (Moyenne pour un slug inconnu). */
export function actionDifficultyDu(cle: SceneJetDifficulte): ActionDifficulty {
  const index = SLUGS.indexOf(cle);
  return ACTION_DIFFICULTIES[index >= 0 ? index : SLUGS.indexOf(JET_DIFFICULTE_PAR_DEFAUT)];
}

/** La difficulté en clair, avec son modificateur : « Ardue −1 », « Facile +1 », « Moyenne ». */
export function libelleDifficulte(cle: SceneJetDifficulte): string {
  const {label, modifier} = actionDifficultyDu(cle);
  if (modifier === 0) {
    return label;
  }
  return `${label} ${modifier > 0 ? '+' : '−'}${Math.abs(modifier)}`;
}

/** Les attributs d'un jet en clair : « Vigueur », « Vigueur ou Agilité » ; vide pour un effet sans jet. */
export function attributsEnClair(attributs: readonly SceneJetAttribut[]): string {
  return attributs.map((cle) => ACTION_ATTRIBUTE_LABELS[cle]).join(' ou ');
}
