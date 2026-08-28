import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {BolFightSessionModel} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {buildPlayBoard} from '../combat-play.util';

interface CombatSummary {
  readonly session: BolFightSessionModel;
  readonly heroesCount: number;
  readonly adversairesCount: number;
}

/** Liste des combats lancés par l'utilisateur, avec accès pour reprendre ou supprimer chacun. */
@Component({
  selector: 'bol-combat-library-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCard,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    DwLibraryHeaderComponent,
    DwTagComponent,
  ],
  templateUrl: './combat-library-page.html',
  styleUrl: './combat-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatLibraryPageComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sessions = refreshableResource(() => this.fightSessionService.fightSessions());

  protected readonly searchTerm = signal('');

  protected readonly summaries = computed<CombatSummary[]>(() =>
    this.sessions.data().map((session) => {
      const board = buildPlayBoard(session);
      return {
        session,
        heroesCount: board.tokens.filter((token) => token.camp === 'heros').length,
        adversairesCount: board.tokens.filter((token) => token.camp === 'adversaires').length,
      };
    }),
  );

  protected readonly filteredSummaries = computed(() =>
    this.summaries().filter((item) => matchesTerm(this.searchTerm(), item.session.titre)),
  );

  protected readonly totalCount = computed(() => this.sessions.data().length);
  protected readonly visibleCount = computed(() => this.filteredSummaries().length);

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected askDelete(session: BolFightSessionModel): void {
    if (!session.id) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer ce combat',
        message: `Voulez-vous supprimer "${session.titre ?? 'ce combat'}" ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteSession(session.id!);
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
