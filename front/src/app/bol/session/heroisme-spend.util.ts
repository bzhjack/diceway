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

/** Limite habituelle des points d'héroïsme d'un héros (02-actions-combat.md) ; un échec critique accepté peut la dépasser. */
const HEROISME_HABITUEL = 5;

/** Les gemmes d'héroïsme d'un héros : une par point, allumée s'il reste à dépenser. On en montre toujours cinq (la limite habituelle),
 * davantage si le héros en a gagné au-delà. */
export function heroismeGems(heroisme: number): readonly boolean[] {
  const points = Math.max(0, Math.floor(heroisme));
  return Array.from({length: Math.max(HEROISME_HABITUEL, points)}, (_, index) => index < points);
}

/** « Juste une égratignure », en Mythic+ : un d6B, le meilleur de deux d6 (un seul dé : le dé gardé, tapé après un jet à table). La
 * cible récupère autant de vitalité, sans dépasser les dégâts du coup (02-actions-combat.md). */
export function egratignure(des: readonly number[], degats: number): {die: number; healed: number} {
  const die = Math.max(...des);
  return {die, healed: Math.min(die, degats)};
}
