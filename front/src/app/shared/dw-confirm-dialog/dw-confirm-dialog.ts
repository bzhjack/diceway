import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';

export interface DwConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'dw-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ data.cancelLabel ?? 'Annuler' }}</button>
      <button mat-flat-button class="confirm-dialog__danger" [mat-dialog-close]="true" cdkFocusInitial>
        {{ data.confirmLabel ?? 'Confirmer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-dialog__danger {
      --mat-filled-button-container-color: var(--mat-sys-error);
      --mat-filled-button-label-text-color: var(--mat-sys-on-error);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwConfirmDialogComponent {
  protected readonly data = inject<DwConfirmDialogData>(MAT_DIALOG_DATA);
}
