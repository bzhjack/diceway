import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {DwImageDialogData} from '../models/dw-image-dialog.model';

/** Une image carrée (1:1) en grand, ouverte depuis un portrait (médaillon du statbloc) ; Échap, un clic à côté ou le bouton la ferment. */
@Component({
  selector: 'dw-image-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <img class="dwi-image" [src]="data.src" [alt]="data.alt" />
    <button mat-icon-button type="button" class="dwi-close" mat-dialog-close aria-label="Fermer">
      <mat-icon>close</mat-icon>
    </button>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      overflow: hidden;
    }

    .dwi-image {
      display: block;
      width: min(88vmin, 640px);
      aspect-ratio: 1 / 1;
      object-fit: cover;
    }

    .dwi-close {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(0, 0, 0, 0.55);
      color: var(--dw-color-text-bright);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwImageDialogComponent {
  protected readonly data = inject<DwImageDialogData>(MAT_DIALOG_DATA);
}

/** Ouvre l'image carrée en grand. */
export function openImageDialog(dialog: MatDialog, data: DwImageDialogData): void {
  dialog.open(DwImageDialogComponent, {data, autoFocus: 'dialog', maxWidth: '96vw'});
}
