import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Observable, map, take} from 'rxjs';
import {DwConfirmDialogComponent} from './dw-confirm-dialog';
import {DwConfirmDialogData} from '../models/dw-confirm-dialog.model';

/** Ouvre le dialog de confirmation et émet une seule fois true (confirmé) ou false (annulé/fermé). */
export function confirmDialog(
  dialog: MatDialog,
  data: DwConfirmDialogData,
  config?: Omit<MatDialogConfig, 'data'>,
): Observable<boolean> {
  return dialog
    .open(DwConfirmDialogComponent, {...config, data})
    .afterClosed()
    .pipe(
      take(1),
      map((confirmed: boolean | undefined) => Boolean(confirmed)),
    );
}

/** « Modifications non enregistrées » : avant de quitter une page de saisie (`canLeave`), true pour quitter quand même. */
export function confirmLeaveUnsaved(dialog: MatDialog, message: string): Observable<boolean> {
  return confirmDialog(dialog, {
    title: 'Modifications non enregistrées',
    message,
    confirmLabel: 'Quitter sans sauver',
    cancelLabel: 'Annuler',
  });
}
