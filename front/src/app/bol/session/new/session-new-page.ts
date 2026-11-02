import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {BolAccueilScenario} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {findScenario} from '../accueil/accueil.util';
import {CombatantPickerDialogComponent} from './combatant-picker-dialog/combatant-picker-dialog';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';

/**
 * Seuil, sur `/session/new` : le MJ choisit les héros présents et ouvre la table (session en mode libre). Arrivé de l'accueil avec
 * `?scenario=<id>`, il montre ce scénario (qu'on peut retirer) et la table s'ouvre avec ; une sélection vide reprend les héros de la dernière table.
 */
@Component({
  selector: 'bol-session-new-page',
  imports: [AvatarFallbackDirective, RouterLink, MatButtonModule, MatIconModule, AccountMenuComponent],
  templateUrl: './session-new-page.html',
  styleUrl: './session-new-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionNewPageComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly accueilService = inject(BolAccueilService);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly launching = signal(false);
  protected readonly canLaunch = computed(() => this.selection.combatants().length > 0);

  /** Le scénario de la future table : celui de `?scenario=`, s'il est connu du compte ; le MJ peut le retirer. */
  protected readonly scenario = signal<BolAccueilScenario | null>(null);

  /** Revenir sur le seuil (avec son scénario) après la création d'un héros, et non sur l'accueil (`/`). */
  protected readonly createHeroState = computed(() => {
    const scenario = this.scenario();
    return {returnUrl: scenario ? `/session/new?scenario=${encodeURIComponent(scenario.id)}` : '/session/new'};
  });

  constructor() {
    this.selection.loadCatalog();

    const demande = this.route.snapshot.queryParamMap.get('scenario');
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.scenario.set(findScenario(data.scenarios, demande));
          this.selection.preselectHeroes(data.derniers_heros);
        },
        // Sans l'accueil, le seuil reste tel qu'il était : sans scénario, sans présélection.
        error: () => undefined,
      });
  }

  protected removeScenario(): void {
    this.scenario.set(null);
  }

  protected openPicker(): void {
    this.dialog.open(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
      data: {lockKind: 'hero'},
    });
  }

  protected launchSession(): void {
    this.launching.set(true);
    this.selection
      .launch(null, this.scenario()?.id ?? null)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.launching.set(false);
          this.selection.reset();

          if (session.id) {
            void this.router.navigate(['/session', session.id, 'play']);
          }
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de créer la session.'), 'OK', {
            duration: 6000,
          });
        },
      });
  }
}
