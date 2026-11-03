import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, Injector, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, of, switchMap, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolAccueilModel} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {accueilSagas, sagaResumes, situerScenario, tableOuverte, teinteDeSaga} from '../../accueil/accueil.util';
import {OpenTableData, OpenTableEtape} from '../../models/open-table.model';
import {findScenario} from '../../scenario.util';
import {CombatantPickerDialogComponent} from '../combatant-picker-dialog/combatant-picker-dialog';
import {enumerer} from '../open-table.util';

/**
 * « Ouvrir une table », en dialogue sur l'accueil : l'histoire (le chapitre choisi sur l'accueil, ou une partie improvisée), puis qui est à
 * table (la dernière compagnie, reprise d'office), puis « Ouvrir la table », qui mène à elle. Une autre table encore ouverte se clôt d'abord,
 * après confirmation : une seule table ouverte à la fois, celle que l'accueil montre.
 */
@Component({
  selector: 'bol-open-table-dialog',
  imports: [AvatarFallbackDirective, MatButtonModule, MatDialogModule, MatIconModule, RouterLink],
  templateUrl: './open-table-dialog.html',
  styleUrl: './open-table-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenTableDialogComponent {
  private readonly data = inject<OpenTableData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<OpenTableDialogComponent, boolean>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly accueilService = inject(BolAccueilService);
  private readonly fightSessionService = inject(BolFightSessionService);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly etape = signal<OpenTableEtape>('choix');
  protected readonly launching = signal(false);
  private readonly accueil = signal<BolAccueilModel | null>(this.data.accueil ?? null);
  /** L'accueil n'a pas encore répondu : on ne sait ni le chapitre demandé, ni s'il y a une table à clore ; la table ne s'ouvre pas encore. */
  protected readonly loadingAccueil = signal(!this.data.accueil);
  /** Le chapitre de la future table : celui demandé ; « Improviser » le retire. */
  protected readonly scenarioId = signal(this.data.scenarioId);
  private readonly confirmer = viewChild('confirmer', {read: ElementRef<HTMLButtonElement>});

  /**
   * Les présents que le catalogue sait nommer. La présélection arrive avant le catalogue : tant qu'une fiche n'y est pas résolue, elle n'est
   * ni affichée ni comptée, et elle ne suffit pas à ouvrir la table (la demande ne la porterait pas : table vide).
   */
  protected readonly present = computed(() =>
    this.selection.combatants().flatMap((combatant) => this.selection.entryFor(combatant.catalogId) ?? []),
  );
  protected readonly canLaunch = computed(
    () =>
      this.present().length > 0 &&
      !this.launching() &&
      !this.loadingAccueil() &&
      !this.selection.loading() &&
      // Après un chargement raté, le catalogue gardé date d'une autre visite : on ne l'engage pas sans réessai.
      !this.selection.loadFailed(),
  );
  /** Aucun héros affiché, le catalogue chargé : « Ouvrir la table » est désactivé, le dialogue dit pourquoi. */
  protected readonly attenteHeros = computed(() => this.present().length === 0 && !this.selection.loading() && !this.selection.loadFailed());

  private readonly scenario = computed(() => findScenario(this.accueil()?.scenarios ?? [], this.scenarioId()));

  /** Le chapitre choisi, placé dans sa saga, avec la teinte de la saga (celle de sa carte sur l'accueil). */
  protected readonly chapitre = computed(() => {
    const scenario = this.scenario();
    if (!scenario) {
      return null;
    }
    const scenarios = this.accueil()?.scenarios ?? [];
    const situe = situerScenario(scenario, scenarios);
    return {...situe, teinte: teinteDeSaga(sagaResumes(accueilSagas(scenarios, new Set(), null, null), null), situe.saga)};
  });

  /** Un chapitre demandé que le compte n'a pas : le dialogue le dit, et la table s'ouvre sans lui. Rien tant que l'accueil n'a pas répondu. */
  protected readonly scenarioPerdu = computed(() => {
    if (!this.scenarioId() || this.loadingAccueil() || this.scenario()) {
      return null;
    }
    return this.accueil()
      ? 'Ce chapitre est introuvable : la table s’ouvrira sans scénario.'
      : 'Impossible de charger le chapitre : la table s’ouvrira sans scénario.';
  });

  /** La table déjà ouverte, que l'ouverture de celle-ci clôt. */
  protected readonly ouverte = computed(() => {
    const accueil = this.accueil();
    return accueil?.table ? tableOuverte(accueil.table, accueil.scenarios) : null;
  });

  /** Ce que la clôture de la table ouverte fait, dans l'ordre : le combat, le chapitre, et où elle reste. */
  protected readonly effetsCloture = computed(() => {
    const table = this.accueil()?.table;
    if (!table) {
      return [];
    }
    return [
      ...(table.statut === 'combat' ? ['le combat en cours s’arrête'] : []),
      ...(table.scenario_id ? ['son chapitre compte comme joué'] : []),
      'elle reste dans « Mes tables », d’où elle se reprend',
    ];
  });

  protected readonly clotureEnUneLigne = computed(() => this.effetsCloture().join(', '));

  protected readonly compagnieReprise = computed(() => (this.accueil()?.derniers_heros.length ?? 0) > 0);

  /** La future table en une ligne : « Tolometh, avec Axel, jadawin, Balaram et jean ». */
  protected readonly resume = computed(() => {
    const noms = this.present().map((entry) => entry.nom);
    const nom = this.chapitre()?.nom ?? 'Partie improvisée';
    return noms.length ? `${nom}, avec ${enumerer(noms)}` : nom;
  });

  protected readonly nomNouvelle = computed(() => this.chapitre()?.nom ?? 'la nouvelle table');

  /** Revenir au dialogue (avec son chapitre) après la création d'un héros : `/session/new` rouvre l'accueil et ce dialogue. */
  protected readonly createHeroState = computed(() => {
    const scenario = this.scenario();
    return {returnUrl: scenario ? `/session/new?scenario=${encodeURIComponent(scenario.id)}` : '/session/new'};
  });

  constructor() {
    this.selection.loadCatalog();
    const accueil = this.data.accueil;
    if (accueil) {
      this.selection.preselectHeroes(accueil.derniers_heros);
    } else {
      this.chargerAccueil();
    }
  }

  protected reloadCatalog(): void {
    this.selection.loadCatalog();
  }

  protected improviser(): void {
    this.scenarioId.set(null);
  }

  protected ajouterHeros(): void {
    this.dialog.open(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
      data: {lockKind: 'hero'},
    });
  }

  /** « Ouvrir la table » : avec une autre table ouverte, d'abord la confirmation de sa clôture ; sinon, ou une fois confirmée, la table. */
  protected ouvrir(): void {
    if (!this.canLaunch()) {
      return;
    }
    if (this.ouverte() && this.etape() === 'choix') {
      this.etape.set('confirmation');
      afterNextRender(() => this.confirmer()?.nativeElement.focus(), {injector: this.injector});
      return;
    }
    this.lancer();
  }

  protected revenirAuChoix(): void {
    this.etape.set('choix');
  }

  private lancer(): void {
    const aClore = this.accueil()?.table ?? null;
    const clore$: Observable<unknown> = aClore ? this.fightSessionService.close(aClore.id) : of(null);
    this.launching.set(true);
    clore$
      .pipe(
        switchMap(() => this.selection.launch(null, this.scenario()?.id ?? null)),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (session) => {
          this.launching.set(false);
          this.selection.reset();
          this.dialogRef.close(true);
          if (session.id) {
            void this.router.navigate(['/session', session.id, 'play']);
          }
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.etape.set('choix');
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible d’ouvrir la table.'), 'OK', {duration: 6000});
          // L'ancienne table a pu se clore avant l'échec : on relit ce qu'il en est.
          if (aClore) {
            this.chargerAccueil();
          }
        },
      });
  }

  private chargerAccueil(): void {
    this.loadingAccueil.set(true);
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.accueil.set(data);
          this.selection.preselectHeroes(data.derniers_heros);
          this.loadingAccueil.set(false);
        },
        // Sans l'accueil, le dialogue reste utilisable : sans chapitre, sans présélection, sans table à clore.
        error: () => this.loadingAccueil.set(false),
      });
  }
}
