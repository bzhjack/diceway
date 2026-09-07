import {WritableSignal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../core/api-error.utils';
import {BolHerosService} from '../services/bol-heros.service';

/**
 * Applique un delta d'héroïsme de façon optimiste (signal local mis à jour immédiatement), envoie
 * la dépense/l'octroi au backend, et revient en arrière (signal + callback optionnel) si la
 * requête échoue. Partagé par les dialogs de jet (action/initiative/attaque) : Faveur divine,
 * échec critique, conversions héroïque/légendaire dépensent ou octroient tous 1 PH de la même
 * façon — seul le signe de `delta` et ce qui doit être annulé en cas d'échec changent.
 */
export function applyHeroismeDelta(
  herosService: BolHerosService,
  snackBar: MatSnackBar,
  herosId: string,
  heroisme: WritableSignal<number>,
  delta: number,
  onRevert?: () => void,
): void {
  heroisme.update((h) => h + delta);
  herosService.adjustHeroisme(herosId, delta).subscribe({
    error: (error: unknown) => {
      heroisme.update((h) => h - delta);
      onRevert?.();
      snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
        duration: 5000,
      });
    },
  });
}
