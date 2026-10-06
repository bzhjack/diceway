import {DefierLaMortDialogComponent} from './defier-la-mort-dialog';
import {DefierLaMortContext} from '../../models/defier-la-mort.model';

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
