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

/** Liste des tables lancées par l'utilisateur, closes comprises, avec accès pour reprendre (une table close est d'abord rouverte) ou
 * supprimer chacune. */
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

  /**
   * Retourne à la table. Une seule table est ouverte à la fois : si une autre l'est, elle se clôt d'abord, après confirmation (le serveur
   * la clôt en rouvrant celle-ci). Une table close est rouverte (`libre`) : elle redevient la table ouverte de l'accueil.
   */
  protected reprendre(session: BolFightSessionSummaryModel): void {
    const autres = this.sessions.data().filter((autre) => autre.id !== session.id && autre.statut !== 'terminee');
    if (!autres.length) {
      this.rouvrir(session);
      return;
    }
    const enCombat = autres.some((autre) => autre.statut === 'combat');
    const noms = autres.map((autre) => `« ${autre.titre || 'Table sans nom'} »`).join(', ');
    confirmDialog(
      this.dialog,
      {
        title: `Reprendre ${session.titre || 'cette table'}`,
        message:
          `Une seule table est ouverte à la fois : ${noms} se clôt${enCombat ? ', son combat en cours s’arrête' : ''}. ` +
          'Elle reste ici, d’où elle se reprend.',
        confirmLabel: 'Clore et reprendre',
      },
      {width: '420px'},
    ).subscribe((confirme) => {
      if (confirme) {
        this.rouvrir(session, true);
      }
    });
  }

  /** Rouvre la table (et clôt les autres) quand elle est close ou qu'une autre est ouverte ; sinon, y va simplement. */
  private rouvrir(session: BolFightSessionSummaryModel, autresAClore = false): void {
    const ouvrir = () => void this.router.navigate(['/session', session.id, 'play']);
    if (session.statut !== 'terminee' && !autresAClore) {
      ouvrir();
      return;
    }
    this.fightSessionService.reopen(session.id).subscribe({
      next: ouvrir,
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de rouvrir la table.'), 'Fermer', {duration: 5000});
      },
    });
  }

  protected askDelete(session: BolFightSessionSummaryModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer cette table',
        message: `Voulez-vous supprimer "${session.titre || 'cette table'}" ? Cette action est irréversible.`,
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
          extractApiErrorMessage(error, 'La suppression du combat a échoué.'),
          'Fermer',
          {duration: 5000},
        );
      },
    });
  }
}
