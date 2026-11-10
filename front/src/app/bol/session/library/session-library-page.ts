import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolFightSessionSummaryModel} from '../../models/bol-fight-session.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {partiesDeLAccueil} from '../accueil/accueil.util';
import {AccueilPartie} from '../models/accueil.model';
import {PartieChapitreComponent} from '../partie-chapitre/partie-chapitre';

/** « Mes parties » : toutes les parties du compte, chacune avec son scénario et son chapitre, à reprendre, à passer sur un autre chapitre
 * (ou, improvisée, sur un scénario), à marquer terminée, à supprimer. */
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
    PartieChapitreComponent,
  ],
  templateUrl: './session-library-page.html',
  styleUrl: './session-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLibraryPageComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly accueilService = inject(BolAccueilService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly sessions = refreshableResource(() => this.fightSessionService.fightSessions());

  protected readonly searchTerm = signal('');

  /** Ce que l'accueil lit du compte : le scénario, le chapitre et l'avancée de chaque partie, et de quoi en changer. Null tant qu'il
   * n'a pas répondu (ou s'il a échoué) : les lignes n'ont alors ni scénario ni « Changer de chapitre ». */
  protected readonly accueil = signal<BolAccueilModel | null>(null);
  private readonly cartes = computed(() => {
    const accueil = this.accueil();
    return new Map((accueil ? partiesDeLAccueil(accueil) : []).map((partie) => [partie.id, partie]));
  });

  constructor() {
    this.chargerAccueil();
  }

  /** La carte d'une partie (son scénario, son chapitre, s'il est terminé) ; null avant la réponse de l'accueil. */
  protected carte(id: string): AccueilPartie | null {
    return this.cartes().get(id) ?? null;
  }

  /** Une partie a changé de chapitre ou a été marquée : la liste et les cartes se relisent. */
  protected relire(): void {
    this.sessions.refresh();
    this.chargerAccueil();
  }

  private chargerAccueil(): void {
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({next: (accueil) => this.accueil.set(accueil), error: () => this.accueil.set(null)});
  }

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
      next: () => this.relire(),
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
