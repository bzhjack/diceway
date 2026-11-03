import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {findScenario} from '../accueil/accueil.util';
import {CombatantPickerDialogComponent} from './combatant-picker-dialog/combatant-picker-dialog';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';

/**
 * Seuil, sur `/session/new` : le MJ choisit les héros présents et ouvre la table (session en mode libre). Arrivé de l'accueil avec
 * `?scenario=<id>`, il montre ce scénario (qu'on peut retirer) et la table s'ouvre avec ; une sélection vide reprend les héros de la dernière table.
 * Le paramètre fait foi et se relit à chaque changement (Angular garde le composant quand seule la query change) ; l'accueil, lui, n'est chargé qu'une fois.
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
  /** L'accueil n'a pas encore répondu : le scénario demandé n'est pas encore connu, la table ne s'ouvre pas sans lui. */
  protected readonly loadingAccueil = signal(true);
  /**
   * Les présents que le catalogue sait nommer. La présélection de l'accueil arrive avant le catalogue : tant qu'une fiche n'y est pas
   * résolue, elle n'est ni affichée ni comptée, et elle ne suffit pas à ouvrir la table (le payload ne la porterait pas : table vide).
   */
  protected readonly present = computed(() =>
    this.selection.combatants().flatMap((combatant) => this.selection.entryFor(combatant.catalogId) ?? []),
  );
  protected readonly canLaunch = computed(
    () =>
      this.present().length > 0 &&
      !this.loadingAccueil() &&
      !this.selection.loading() &&
      // Après un chargement raté, le catalogue gardé date d'une autre visite : on ne l'engage pas sans réessai.
      !this.selection.loadFailed(),
  );

  private readonly accueil = signal<BolAccueilModel | null>(null);
  private readonly requestedScenario = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('scenario'))), {
    initialValue: this.route.snapshot.queryParamMap.get('scenario'),
  });

  /** Le scénario de la future table : celui de `?scenario=`, s'il est connu du compte ; le MJ peut le retirer (« × » ôte le paramètre). */
  protected readonly scenario = computed(() => findScenario(this.accueil()?.scenarios ?? [], this.requestedScenario()));

  /** Revenir sur le seuil (avec son scénario) après la création d'un héros, et non sur l'accueil (`/`). */
  protected readonly createHeroState = computed(() => {
    const scenario = this.scenario();
    return {returnUrl: scenario ? `/session/new?scenario=${encodeURIComponent(scenario.id)}` : '/session/new'};
  });

  constructor() {
    this.selection.loadCatalog();

    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.accueil.set(data);
          this.selection.preselectHeroes(data.derniers_heros);
          this.loadingAccueil.set(false);
        },
        // Sans l'accueil, le seuil reste utilisable tel qu'il était : sans scénario, sans présélection.
        error: () => this.loadingAccueil.set(false),
      });
  }

  protected reloadCatalog(): void {
    this.selection.loadCatalog();
  }

  protected removeScenario(): void {
    void this.router.navigate([], {queryParams: {scenario: null}, queryParamsHandling: 'merge', replaceUrl: true});
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
