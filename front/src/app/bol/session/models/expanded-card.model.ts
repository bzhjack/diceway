import {ActionRollData} from './action-roll.model';
import {HeroResourcesData} from './hero-resources.model';
import {HeroDetails, HeroHeaderStat} from './tapis.model';

/** Tout ce que la carte dépliée d'un héros affiche : statistiques, détails, ressources et jet d'action. */
export interface ExpandedHeroData {
  /** Carrières, armes et armures, pour les popovers de détail de l'en-tête. */
  readonly details: HeroDetails;
  /** Statistiques de combat de l'en-tête (initiative, mêlée, tir, défense, protection, dégâts). */
  readonly stats: readonly HeroHeaderStat[];
  readonly resources: HeroResourcesData;
  readonly actionRoll: ActionRollData;
}
