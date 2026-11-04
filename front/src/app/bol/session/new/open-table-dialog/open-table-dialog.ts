import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
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
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolAccueilModel} from '../../../models/bol-accueil.model';
import {BolAccueilService} from '../../../services/bol-accueil.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {chapitresDuScenario, scenariosDuCompte, situerScenario, teinteDeScenario} from '../../accueil/accueil.util';
import {OpenTableData} from '../../models/open-table.model';
import {findScenario, libelleDeChapitre} from '../../scenario.util';
import {CombatantPickerDialogComponent} from '../combatant-picker-dialog/combatant-picker-dialog';
import {enumerer} from '../open-table.util';

/** La colonne `bol_fight_session.titre` : un `string` de 255 caractères. */
const NOM_MAX = 255;

/**
 * « Nouvelle partie », en dialogue sur l'accueil : le nom de la compagnie (obligatoire), le scénario et son chapitre de départ (ou une
 * partie improvisée), puis qui est à table (aucun héros d'office), puis « Créer la partie », qui mène à sa table. Aucune autre partie n'en
 * est touchée.
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly accueilService = inject(BolAccueilService);
  protected readonly selection = inject(CombatSelectionService);

  protected readonly launching = signal(false);
  private readonly accueil = signal<BolAccueilModel | null>(this.data.accueil ?? null);
  /** L'accueil n'a pas encore répondu : on ne connaît pas encore les scénarios ; la partie ne se crée pas encore. */
  protected readonly loadingAccueil = signal(!this.data.accueil);
  /** Le chapitre de départ de la future partie : celui demandé ; « Improviser » le retire. */
  protected readonly scenarioId = signal(this.data.scenarioId);

  /** Le nom de la compagnie, obligatoire : la partie se retrouve sous lui. Il part vide (le MJ mène plusieurs compagnies). */
  private readonly nom = signal('');
  protected readonly nomField = form(this.nom, (path) => {
    required(path, {message: 'Donnez un nom à la compagnie'});
    maxLength(path, NOM_MAX, {message: `${NOM_MAX} caractères au plus`});
  });
  private readonly nomSaisi = computed(() => this.nom().trim());
  protected readonly nomValide = computed(() => this.nomSaisi().length > 0 && this.nomSaisi().length <= NOM_MAX);

  /**
   * Les présents que le catalogue sait nommer. Une sélection arrive parfois avant le catalogue : tant qu'une fiche n'y est pas résolue,
   * elle n'est ni affichée ni comptée, et elle ne suffit pas à créer la partie (la demande ne la porterait pas : table vide).
   */
  protected readonly present = computed(() =>
    this.selection.combatants().flatMap((combatant) => this.selection.entryFor(combatant.catalogId) ?? []),
  );
  protected readonly canLaunch = computed(
    () =>
      this.present().length > 0 &&
      this.nomValide() &&
      !this.launching() &&
      !this.loadingAccueil() &&
      !this.selection.loading() &&
      !this.selection.loadFailed(),
  );
  /** Aucun héros affiché, le catalogue chargé : « Créer la partie » est désactivé, le dialogue dit pourquoi. */
  protected readonly attenteHeros = computed(() => this.present().length === 0 && !this.selection.loading() && !this.selection.loadFailed());

  private readonly scenarios = computed(() => this.accueil()?.scenarios ?? []);
  private readonly scenario = computed(() => findScenario(this.scenarios(), this.scenarioId()));

  /** Le chapitre de départ, placé dans son scénario, avec la teinte du scénario (celle de ses parties sur l'accueil). */
  protected readonly chapitre = computed(() => {
    const scenario = this.scenario();
    return scenario ? {...situerScenario(scenario, this.scenarios()), teinte: teinteDeScenario(scenario.id, this.scenarios())} : null;
  });

  /** « Choisir un scénario » : les sagas, puis les one shots ; celui du chapitre choisi est coché. */
  protected readonly scenariosAChoisir = computed(() => {
    const courant = new Set(chapitresDuScenario(this.scenarioId(), this.scenarios()).map((c) => c.id));
    return scenariosDuCompte(this.scenarios()).map((choix) => ({...choix, choisi: choix.chapitres.some((c) => courant.has(c.id))}));
  });

  /** « Chapitre de départ » : les chapitres du scénario choisi, rien pour un one shot ; le choisi est coché. */
  protected readonly chapitresDeDepart = computed(() => {
    if (!this.scenario()?.saga) {
      return [];
    }
    return chapitresDuScenario(this.scenarioId(), this.scenarios()).map((c) => ({
      id: c.id,
      libelle: libelleDeChapitre(c.numero, c.titre),
      choisi: c.id === this.scenarioId(),
    }));
  });

  /** Un chapitre demandé que le compte n'a pas : le dialogue le dit, et la partie se crée sans lui. Rien tant que l'accueil n'a pas répondu. */
  protected readonly scenarioPerdu = computed(() => {
    if (!this.scenarioId() || this.loadingAccueil() || this.scenario()) {
      return null;
    }
    return this.accueil()
      ? 'Ce chapitre est introuvable : la partie sera improvisée.'
      : 'Impossible de charger le chapitre : la partie sera improvisée.';
  });

  /** La future partie en une ligne : « Les Lames de Satarla · Tolometh, avec Axel, jadawin et jean » (sans nom saisi, le chapitre seul). */
  protected readonly resume = computed(() => {
    const noms = this.present().map((entry) => entry.nom);
    const histoire = this.chapitre()?.nom ?? 'Partie improvisée';
    const nom = this.nomSaisi() ? `${this.nomSaisi()} · ${histoire}` : histoire;
    return noms.length ? `${nom}, avec ${enumerer(noms)}` : nom;
  });

  /** Revenir au dialogue (avec son chapitre) après la création d'un héros : `/session/new` rouvre l'accueil et ce dialogue. */
  protected readonly createHeroState = computed(() => {
    const scenario = this.scenario();
    return {returnUrl: scenario ? `/session/new?scenario=${encodeURIComponent(scenario.id)}` : '/session/new'};
  });

  constructor() {
    // Une nouvelle partie est une nouvelle compagnie : aucun héros d'office.
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

  /** Un scénario choisi : la partie part de son premier chapitre (l'introduction s'il y en a une). */
  protected choisirScenario(chapitres: readonly {id: string}[]): void {
    if (chapitres.length) {
      this.scenarioId.set(chapitres[0].id);
    }
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

  /** « Créer la partie » : elle se crée, puis mène à sa table. */
  protected creer(): void {
    if (!this.canLaunch()) {
      return;
    }
    this.launching.set(true);
    this.selection
      .launch(this.nomSaisi(), this.scenario()?.id ?? null)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
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
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de créer la partie.'), 'OK', {duration: 6000});
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
        // Sans l'accueil, le dialogue reste utilisable, sans chapitre.
        error: () => this.loadingAccueil.set(false),
      });
  }
}
