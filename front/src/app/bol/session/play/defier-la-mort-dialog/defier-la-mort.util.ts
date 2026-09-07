import {MatDialog} from '@angular/material/dialog';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {DefierLaMortDialogComponent} from './defier-la-mort-dialog';

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

/**
 * Ouvre "Défier la mort" si la vitalité est négative, sinon ne fait rien. Sur confirmation,
 * dépense 1 PH et — seulement dans le cas -1 à -5 — ramène la vitalité à 0 (02-actions-combat.md).
 */
export function maybePromptDefierLaMort(ctx: DefierLaMortContext): void {
  if (ctx.vitaliteCourante >= 0) {
    return;
  }

  ctx.dialog
    .open(DefierLaMortDialogComponent, {
      maxWidth: 'min(26rem, 92vw)',
      data: {heroNom: ctx.heroNom, vitaliteCourante: ctx.vitaliteCourante, heroisme: ctx.heroisme},
    })
    .afterClosed()
    .subscribe((confirmed: boolean | undefined) => {
      if (!confirmed) {
        return;
      }

      ctx.herosService.adjustHeroisme(ctx.herosId, -1).subscribe();

      if (ctx.vitaliteCourante >= -5) {
        ctx.fightSessionService.applyDamage(ctx.sessionId, 'hero', ctx.pivotId, -ctx.vitaliteCourante).subscribe({
          next: () => ctx.onApplied?.(),
        });
      } else {
        ctx.onApplied?.();
      }
    });
}
