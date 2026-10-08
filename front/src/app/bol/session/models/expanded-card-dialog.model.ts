import {Signal} from '@angular/core';
import {BolStatblockData} from '../../shared/models/bol-statblock.model';
import {ExpandedHeroData} from './expanded-card.model';
import {TapisCard} from './tapis.model';

/** Ce que la page donne au dialogue de la carte : l'état de la carte ouverte (des signaux, pour qu'il suive
 * les rechargements de la session) et les actions, qui restent celles de la page. */
export interface ExpandedCardDialogData {
  readonly sessionId: string;
  /** La carte ouverte — `null` quand elle a quitté la table : le dialogue se ferme. */
  readonly card: Signal<TapisCard | null>;
  readonly hero: Signal<ExpandedHeroData | null>;
  readonly statblock: Signal<BolStatblockData | null>;
  readonly returnUrl: Signal<string | null>;
  readonly changed: () => void;
  readonly remove: (card: TapisCard) => void;
  readonly toggleArmure: (event: {card: TapisCard; armureId: number}) => void;
  readonly toggleArme: (event: {card: TapisCard; armeId: number}) => void;
}
