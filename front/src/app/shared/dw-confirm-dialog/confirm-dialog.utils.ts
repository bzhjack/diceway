import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Observable, map, take} from 'rxjs';
import {DwConfirmDialogComponent, DwConfirmDialogData} from './dw-confirm-dialog';

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
