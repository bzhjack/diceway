import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard} from '../../models/tapis.model';

/** Rang en clair d'un rival (`TapisCard.rang`). */
const RIVAL = 'Rival';

/** « Fuite opportune » (04-pnj-creatures-demons.md, « Points de vilenie » ; livre p. 135) : un rival adverse qui a encore de la vilénie et
 * n'a pas déjà quitté ce combat. Les rivaux sont « les ennemis jurés des héros » : un rival qui combat à leurs côtés (allié) ne fuit pas
 * ainsi. Il peut fuir même s'il semble mort (à 0 ou moins) : combinée à « défier la mort », la fuite le sauve. */
export function peutFuir(card: TapisCard, etat: EtatCombat): boolean {
  return card.kind === 'pnj' && card.camp === 'adversaires' && card.rang === RIVAL && (card.vilenie ?? 0) >= 1 && !etat.exclus.includes(card.key);
}
