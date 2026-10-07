import {MatDialog} from '@angular/material/dialog';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolHerosService} from '../../services/bol-heros.service';

/** Ce dont la logique « Défier la mort » a besoin pour ouvrir son dialogue et enregistrer le résultat. */
export interface DefierLaMortContext {
  readonly dialog: MatDialog;
  readonly fightSessionService: BolFightSessionService;
  readonly herosService: BolHerosService;
  readonly sessionId: string;
  readonly herosId: string;
  /** Id de la ligne `BolFightSessionHeros` (pas l'id du héros) — cible d'`applyDamage`. */
  readonly pivotId: number;
  readonly heroNom: string;
  /** Vitalité déjà appliquée (résultat, pas delta) — appeler seulement si négative. */
  readonly vitaliteCourante: number;
  readonly heroisme: number;
  /** Appelé une fois la dépense (et, le cas échéant, le rétablissement à 0) persistés. */
  readonly onApplied?: () => void;
}
