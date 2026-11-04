import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, Injector, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {form, FormField, maxLength, required} from '@angular/forms/signals';
import {Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, of, switchMap, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {usableAvatar} from '../../../../shared/avatar-fallback/avatar.util';
import {BolAccueilModel} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {accueilSagas, ONE_SHOT, sagaResumes, situerScenario, tableOuverte, teinteDeSaga} from '../../accueil/accueil.util';
import {ChapitreEtat} from '../../models/accueil.model';
import {OpenTableData, OpenTableEtape} from '../../models/open-table.model';
import {findScenario} from '../../scenario.util';
import {CombatantPickerDialogComponent} from '../combatant-picker-dialog/combatant-picker-dialog';
import {enumerer} from '../open-table.util';

/** L'état d'un chapitre à côté de son nom, dans le menu « Changer de chapitre » ; rien pour un chapitre à jouer. */
const ETAT_DANS_LE_MENU: Record<ChapitreEtat, string | null> = {joue: 'joué', 'en-cours': 'sur la table', prochain: 'le prochain', 'a-jouer': null};

/** La colonne `bol_fight_session.titre` : un `string` de 255 caractères. */
const NOM_MAX = 255;

/**
 * « Ouvrir une table », en dialogue sur l'accueil : l'histoire (le chapitre choisi sur l'accueil, ou une partie improvisée), puis qui est à
 * table (la dernière compagnie, reprise d'office), puis « Ouvrir la table », qui mène à elle. Une autre table encore ouverte se clôt d'abord,
 * après confirmation : une seule table ouverte à la fois, celle que l'accueil montre.
 */
@Component({
  selector: 'bol-open-table-dialog',
  imports: [AvatarFallbackDirective, FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, RouterLink],
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

  /** « Reprendre » : le dialogue reprend la table ouverte (ses héros, son état) au lieu d'en ouvrir une nouvelle. */
  protected readonly reprise = Boolean(this.data.reprise && this.data.accueil?.table);
  protected readonly etape = signal<OpenTableEtape>('choix');
  protected readonly launching = signal(false);
  private readonly accueil = signal<BolAccueilModel | null>(this.data.accueil ?? null);
  /** L'accueil n'a pas encore répondu : on ne sait ni le chapitre demandé, ni s'il y a une table à clore ; la table ne s'ouvre pas encore. */
  protected readonly loadingAccueil = signal(!this.data.accueil);
  /** Le chapitre de la future table : celui demandé ; « Improviser » le retire. */
  protected readonly scenarioId = signal(this.data.scenarioId);
  private readonly confirmer = viewChild('confirmer', {read: ElementRef<HTMLButtonElement>});

  /**
   * Le nom de la nouvelle table, obligatoire : celui de sa compagnie, sous lequel elle se retrouve dans « Mes tables ». Une nouvelle table
   * part d'un nom vide (le MJ peut mener plusieurs compagnies) ; une table reprise garde le sien.
   */
  private readonly nom = signal('');
  protected readonly nomField = form(this.nom, (path) => {
    required(path, {message: 'Donnez un nom à la compagnie'});
    maxLength(path, NOM_MAX, {message: `${NOM_MAX} caractères au plus`});
  });
  private readonly nomSaisi = computed(() => this.nom().trim());
  protected readonly nomValide = computed(() => this.nomSaisi().length > 0 && this.nomSaisi().length <= NOM_MAX);

  /**
   * Les présents que le catalogue sait nommer. La présélection arrive avant le catalogue : tant qu'une fiche n'y est pas résolue, elle n'est
   * ni affichée ni comptée, et elle ne suffit pas à ouvrir la table (la demande ne la porterait pas : table vide).
   */
  protected readonly present = computed(() =>
    this.selection.combatants().flatMap((combatant) => this.selection.entryFor(combatant.catalogId) ?? []),
  );
  protected readonly canLaunch = computed(
    () =>
      (this.reprise || (this.present().length > 0 && this.nomValide())) &&
      !this.launching() &&
      !this.loadingAccueil() &&
      (this.reprise || (!this.selection.loading() && !this.selection.loadFailed())),
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

  /**
   * Le menu « Changer de chapitre » : une entrée par saga (les one shots en dernier), et dans chacune ses chapitres dans l'ordre, avec
   * leur état comme sur l'accueil ; le chapitre choisi est coché.
   */
  protected readonly menuSagas = computed(() => {
    const accueil = this.accueil();
    if (!accueil) {
      return [];
    }
    const sagas = accueilSagas(accueil.scenarios, new Set(accueil.scenarios_joues), accueil.table?.scenario_id ?? null, accueil.scenario_recent_id);
    return sagas.map((saga) => ({
      nom: saga.nom ?? ONE_SHOT,
      chapitres: saga.chapitres.map((chapitre) => ({
        id: chapitre.id,
        libelle: chapitre.libelle,
        etat: ETAT_DANS_LE_MENU[chapitre.etat],
        choisi: chapitre.id === this.scenarioId(),
      })),
    }));
  });

  /** Un chapitre demandé que le compte n'a pas : le dialogue le dit, et la table s'ouvre sans lui. Rien tant que l'accueil n'a pas répondu. */
  protected readonly scenarioPerdu = computed(() => {
    if (!this.scenarioId() || this.loadingAccueil() || this.scenario()) {
      return null;
    }
    return this.accueil()
      ? 'Ce chapitre est introuvable : la partie sera improvisée.'
      : 'Impossible de charger le chapitre : la partie sera improvisée.';
  });

  /** La table déjà ouverte, que l'ouverture de celle-ci clôt. */
  protected readonly ouverte = computed(() => {
    const accueil = this.accueil();
    return accueil?.table ? tableOuverte(accueil.table, accueil.scenarios) : null;
  });

  /** Ce que la clôture de la table ouverte fait, dans l'ordre : le combat, et où elle reste (son chapitre n'en devient pas joué). */
  protected readonly effetsCloture = computed(() => {
    const table = this.accueil()?.table;
    if (!table) {
      return [];
    }
    return [
      ...(table.statut === 'combat' ? ['le combat en cours s’arrête'] : []),
      'elle reste dans « Mes tables », d’où elle se reprend',
    ];
  });

  protected readonly clotureEnUneLigne = computed(() => this.effetsCloture().join(', '));

  /** En reprise, les héros assis à la table ouverte : ils se gèrent à la table. */
  protected readonly compagnie = computed(() =>
    (this.accueil()?.compagnie ?? []).map((heros) => ({...heros, portrait: usableAvatar(heros.avatar), initiale: heros.nom.charAt(0).toUpperCase()})),
  );

  /** En reprise, le chapitre choisi n'est plus celui de la table : elle passera dessus. */
  protected readonly chapitreChange = computed(() => this.reprise && this.scenarioId() !== (this.accueil()?.table?.scenario_id ?? null));

  /** La future table en une ligne : « Les Lames de Satarla · Tolometh, avec Axel, jadawin, Balaram et jean » (sans nom saisi, le chapitre seul). */
  protected readonly resume = computed(() => {
    const noms = (this.reprise ? this.compagnie() : this.present()).map((entry) => entry.nom);
    const histoire = this.chapitre()?.nom ?? 'Partie improvisée';
    const nom = !this.reprise && this.nomSaisi() ? `${this.nomSaisi()} · ${histoire}` : histoire;
    return noms.length ? `${nom}, avec ${enumerer(noms)}` : nom;
  });

  protected readonly nomNouvelle = computed(() => this.nomSaisi() || this.chapitre()?.nom || 'la nouvelle table');

  /** Le bouton du pied : ouvrir une nouvelle table ; en reprise, la reprendre, ou la passer sur le chapitre choisi. */
  protected readonly boutonPrincipal = computed(() => {
    if (!this.reprise) {
      return 'Ouvrir la table';
    }
    if (!this.chapitreChange()) {
      return 'Reprendre la table';
    }
    const chapitre = this.chapitre();
    return chapitre ? `Passer à ${chapitre.nom}` : 'Passer en partie improvisée';
  });

  /** Revenir au dialogue (avec son chapitre) après la création d'un héros : `/session/new` rouvre l'accueil et ce dialogue. */
  protected readonly createHeroState = computed(() => {
    const scenario = this.scenario();
    return {returnUrl: scenario ? `/session/new?scenario=${encodeURIComponent(scenario.id)}` : '/session/new'};
  });

  constructor() {
    // Une table reprise garde ses héros : pas de catalogue. Une nouvelle table est une nouvelle compagnie : aucun héros d'office.
    if (this.reprise) {
      return;
    }
    this.selection.loadCatalog();
    if (!this.data.accueil) {
      this.chargerAccueil();
    }
  }

  protected reloadCatalog(): void {
    this.selection.loadCatalog();
  }

  protected choisirChapitre(id: string): void {
    this.scenarioId.set(id);
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

  /** « Ouvrir la table » : avec une autre table ouverte, d'abord la confirmation de sa clôture ; sinon, ou une fois confirmée, la table. En
   * reprise, la table ouverte, passée d'abord sur le chapitre choisi s'il a changé. */
  protected ouvrir(): void {
    if (!this.canLaunch()) {
      return;
    }
    if (this.reprise) {
      this.reprendre();
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

  private reprendre(): void {
    const table = this.accueil()?.table;
    if (!table) {
      return;
    }
    if (!this.chapitreChange()) {
      this.allerALaTable(table.id);
      return;
    }
    this.launching.set(true);
    this.fightSessionService
      .changerChapitre(table.id, this.scenario()?.id ?? null)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.launching.set(false);
          this.allerALaTable(table.id);
        },
        error: (error: unknown) => {
          this.launching.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de changer le chapitre de la table.'), 'OK', {duration: 6000});
        },
      });
  }

  private allerALaTable(id: string): void {
    this.dialogRef.close(true);
    void this.router.navigate(['/session', id, 'play']);
  }

  private lancer(): void {
    const aClore = this.accueil()?.table ?? null;
    const clore$: Observable<unknown> = aClore ? this.fightSessionService.close(aClore.id) : of(null);
    this.launching.set(true);
    clore$
      .pipe(
        switchMap(() => this.selection.launch(this.nomSaisi(), this.scenario()?.id ?? null)),
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
          this.loadingAccueil.set(false);
        },
        // Sans l'accueil, le dialogue reste utilisable : sans chapitre, sans table à clore.
        error: () => this.loadingAccueil.set(false),
      });
  }
}
