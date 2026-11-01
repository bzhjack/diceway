import {CdkConnectedOverlay, ConnectedPosition} from '@angular/cdk/overlay';
import {Directive, inject, input, OnInit} from '@angular/core';

/** Sous le bouton, calé sur son bord gauche ; près du bord droit de l'écran, sur son bord droit ; au-dessus s'il n'y a pas la place en bas. */
const POSITIONS_START: readonly ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6},
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6},
  {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6},
];

/** Calé sur le bord droit du bouton, dessous, ou dessus s'il n'y a pas la place. */
const POSITIONS_END: readonly ConnectedPosition[] = [
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6},
  {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6},
];

/** Le réglage commun des popovers posés sur un `cdkConnectedOverlay` : leurs positions, poussés dans l'écran en dernier recours, un clic à côté les ferme. */
@Directive({selector: '[dwPopover]'})
export class DwPopoverDirective implements OnInit {
  private readonly overlay = inject(CdkConnectedOverlay);

  readonly dwPopover = input<'start' | 'end'>('end');

  ngOnInit(): void {
    this.overlay.positions = [...(this.dwPopover() === 'start' ? POSITIONS_START : POSITIONS_END)];
    this.overlay.push = true;
    this.overlay.viewportMargin = 12;
    this.overlay.hasBackdrop = true;
    this.overlay.backdropClass = 'cdk-overlay-transparent-backdrop';
  }
}
