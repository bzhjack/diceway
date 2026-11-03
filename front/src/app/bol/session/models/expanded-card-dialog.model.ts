import {Signal} from '@angular/core';
import {BolStatblockData} from '../../shared/models/bol-statblock.model';
import {ExpandedHeroData} from './expanded-card.model';
import {TableChange} from './table-change.model';
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
  /** La carte ouverte est un rival en combat qui peut encore prendre la fuite. */
  readonly canFlee: Signal<boolean>;
  /** La carte ouverte est en combat : le MJ peut l'en retirer. */
  readonly canWithdraw: Signal<boolean>;
  readonly changed: (change: TableChange) => void;
  readonly remove: (card: TapisCard) => void;
  /** « Fuite opportune » : demande confirmation, puis le rival quitte le combat. */
  readonly flee: (card: TapisCard) => void;
  /** « Retirer du combat » : demande confirmation, puis la carte quitte le combat (elle reste sur la table). */
  readonly withdraw: (card: TapisCard) => void;
  readonly toggleArmure: (event: {card: TapisCard; armureId: number}) => void;
  readonly toggleArme: (event: {card: TapisCard; armeId: number}) => void;
}
