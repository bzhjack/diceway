import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, map, Observable, of, switchMap} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {TableAClore} from '../models/close-table.model';

const APRES = 'Elle quitte l’accueil et reste dans « Mes sessions », d’où vous pourrez la reprendre.';

/** « Clore la table », depuis la table ou le bandeau de l'accueil : une confirmation, puis la table passe `terminee`. Une table en combat
 * le termine d'abord, côté serveur, sans les soins d'après combat (qui se choisissent avec « Terminer »). */
@Injectable({providedIn: 'root'})
export class CloseTableService {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fightSessionService = inject(BolFightSessionService);

  /** Émet une fois : `true` si la table est close, `false` si le MJ renonce ou si l'enregistrement échoue (il est alors prévenu). */
  clore(table: TableAClore): Observable<boolean> {
    const message = table.enCombat ? `Le combat en cours prend fin, sans les soins d’après combat. ${APRES}` : `La partie est finie ? ${APRES}`;
    return confirmDialog(this.dialog, {title: 'Clore la table', message, confirmLabel: 'Clore la table'}, {width: '420px'}).pipe(
      switchMap((confirme) =>
        confirme
          ? this.fightSessionService.close(table.id).pipe(
              map(() => true),
              catchError((error: unknown) => {
                this.snackBar.open(extractApiErrorMessage(error, 'Impossible de clore la table.'), 'Fermer', {duration: 5000});
                return of(false);
              }),
            )
          : of(false),
      ),
    );
  }
}
