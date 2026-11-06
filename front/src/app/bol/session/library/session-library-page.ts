import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {BolFightSessionSummaryModel} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';

/** « Mes parties » : toutes les parties du compte, à reprendre ou à supprimer. */
@Component({
  selector: 'bol-session-library-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCard,
    MatIconModule,
    DwLibraryHeaderComponent,
    DwTagComponent,
    DwLibraryToolbarComponent,
  ],
  templateUrl: './session-library-page.html',
  styleUrl: './session-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLibraryPageComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly sessions = refreshableResource(() => this.fightSessionService.fightSessions());

  protected readonly searchTerm = signal('');

  protected readonly filteredSessions = computed(() =>
    this.sessions.data().filter((session) => matchesTerm(this.searchTerm(), session.titre)),
  );

  protected readonly totalCount = computed(() => this.sessions.data().length);
  protected readonly visibleCount = computed(() => this.filteredSessions().length);

  /** Retourne à la table de la partie ; l'y entrer en fait la dernière partie jouée. */
  protected reprendre(session: BolFightSessionSummaryModel): void {
    void this.router.navigate(['/session', session.id, 'play']);
  }

  protected askDelete(session: BolFightSessionSummaryModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer la partie',
        message: `Voulez-vous supprimer "${session.titre || 'cette partie'}" ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteSession(session.id);
      }
    });
  }

  private deleteSession(id: string): void {
    this.fightSessionService.delete(id).subscribe({
      next: () => this.sessions.refresh(),
      error: (error: unknown) => {
        this.snackBar.open(
          extractApiErrorMessage(error, 'La suppression de la partie a échoué.'),
          'Fermer',
          {duration: 5000},
        );
      },
    });
  }
}
