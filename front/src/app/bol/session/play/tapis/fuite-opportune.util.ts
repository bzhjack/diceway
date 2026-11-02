import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard} from '../../models/tapis.model';

/** Rang en clair d'un rival (`TapisCard.rang`). */
const RIVAL = 'Rival';

/** « Fuite opportune » (04-pnj-creatures-demons.md, « Points de vilenie » ; livre p. 133) : un rival qui a encore de la vilénie et n'a pas
 * déjà quitté ce combat. Il peut fuir même s'il semble mort (à 0 ou moins) : combinée à « défier la mort », la fuite le sauve. */
export function peutFuir(card: TapisCard, etat: EtatCombat): boolean {
  return card.kind === 'pnj' && card.rang === RIVAL && (card.vilenie ?? 0) >= 1 && !etat.exclus.includes(card.key);
}

/** Le rival s'enfuit : il quitte le combat (exclu : il ne joue plus, ne se vise plus et ne compte plus pour l'issue), et l'état retient
 * qu'il a fui, pour que la frise le dise. Sa fiche reste sur la table. */
export function fuir(etat: EtatCombat, key: string): EtatCombat {
  if (etat.exclus.includes(key) && etat.fuis.includes(key)) {
    return etat;
  }
  return {
    ...etat,
    exclus: etat.exclus.includes(key) ? etat.exclus : [...etat.exclus, key],
    fuis: etat.fuis.includes(key) ? etat.fuis : [...etat.fuis, key],
  };
}
