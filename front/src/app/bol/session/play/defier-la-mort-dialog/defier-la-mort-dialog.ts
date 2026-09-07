import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';

export interface DefierLaMortDialogData {
  readonly heroNom: string;
  /** Toujours négative — c'est ce qui déclenche l'ouverture de ce dialog. */
  readonly vitaliteCourante: number;
  readonly heroisme: number;
}

/**
 * Vitalité négative (02-actions-combat.md, Points d'héroïsme) : entre -1 et -5, dépenser 1 PH
 * ramène la vitalité à 0 (inconscient) ; en dessous de -5, dépenser 1 PH stabilise (reste
 * inconscient, se remet sur pied après quelques jours de repos — pas de changement de vitalité).
 */
@Component({
  selector: 'bol-defier-la-mort-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './defier-la-mort-dialog.html',
  styleUrl: './defier-la-mort-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefierLaMortDialogComponent {
  protected readonly data = inject<DefierLaMortDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<DefierLaMortDialogComponent, boolean>);

  protected readonly severe = this.data.vitaliteCourante < -5;
  protected readonly canConfirm = this.data.heroisme > 0;

  protected confirm(): void {
    this.ref.close(true);
  }

  protected dismiss(): void {
    this.ref.close(false);
  }
}
