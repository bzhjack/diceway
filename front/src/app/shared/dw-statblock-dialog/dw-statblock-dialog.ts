import {NgComponentOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, Type, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';

interface StatblockDialogData {
  component: Type<unknown>;
  inputs: Record<string, unknown>;
}

/** Hôte générique des statblocks (créature, démon, PNJ, héros) en dialog sans chrome Material. */
@Component({
  selector: 'dw-statblock-dialog',
  imports: [MatDialogModule, NgComponentOutlet],
  template: `<ng-container *ngComponentOutlet="data.component; inputs: data.inputs" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwStatblockDialogComponent {
  protected readonly data = inject<StatblockDialogData>(MAT_DIALOG_DATA);
}

export function openStatblockDialog(
  dialog: MatDialog,
  component: Type<unknown>,
  inputs: Record<string, unknown>,
): void {
  dialog.open(DwStatblockDialogComponent, {
    data: {component, inputs},
    maxWidth: 'min(760px, 92vw)',
    panelClass: 'dw-statblock-dialog',
  });
}
