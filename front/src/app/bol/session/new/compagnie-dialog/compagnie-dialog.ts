import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {form, FormField, maxLength, required} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolCompagnieModel} from '../../../models/bol-compagnie.model';
import {BolCompagnieService} from '../../../services/bol-compagnie.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {CompagnieDialogData} from '../../models/compagnie-dialog.model';
import {CombatantPickerDialogComponent} from '../combatant-picker-dialog/combatant-picker-dialog';

/** La colonne `bol_compagnie.nom` : un `string` de 255 caractères. */
const NOM_MAX = 255;

/**
 * Une compagnie, à créer ou à modifier : son nom et ses héros, rien d'autre (c'est « Nouvelle partie » qui l'associe à un scénario). La modifier
 * vaut pour ses prochaines parties. Partage la feuille de style de « Nouvelle partie », dont elle reprend l'aspect.
 */
@Component({
  selector: 'bol-compagnie-dialog',
  imports: [AvatarFallbackDirective, FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, RouterLink],
  templateUrl: './compagnie-dialog.html',
  styleUrl: '../open-table-dialog/open-table-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompagnieDialogComponent {
  private readonly data = inject<CompagnieDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<CompagnieDialogComponent, BolCompagnieModel>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly compagnieService = inject(BolCompagnieService);
  protected readonly selection = inject(CombatSelectionService);

  /** Une compagnie à modifier ; sinon on en crée une. */
  protected readonly existante = this.data.compagnie;
  protected readonly enregistrement = signal(false);

  private readonly nom = signal(this.data.compagnie?.nom ?? this.data.nomEnCours ?? '');
  protected readonly nomField = form(this.nom, (path) => {
    required(path, {message: 'Donnez un nom à la compagnie'});
    maxLength(path, NOM_MAX, {message: `${NOM_MAX} caractères au plus`});
  });
  private readonly nomSaisi = computed(() => this.nom().trim());
  protected readonly nomValide = computed(() => this.nomSaisi().length > 0 && this.nomSaisi().length <= NOM_MAX);

  /** Les héros choisis que le catalogue sait nommer : tant qu'une fiche n'y est pas résolue, elle n'est ni affichée ni comptée. */
  protected readonly present = computed(() =>
    this.selection.combatants().flatMap((combatant) => {
      // Le brouillon est partagé et persisté : un ancien peut contenir autre chose que des héros.
      const entry = this.selection.entryFor(combatant.catalogId);
      return entry?.kind === 'hero' ? [entry] : [];
    }),
  );
  protected readonly peutEnregistrer = computed(
    () => this.present().length > 0 && this.nomValide() && !this.enregistrement() && !this.selection.loading() && !this.selection.loadFailed(),
  );
  protected readonly attenteHeros = computed(() => this.present().length === 0 && !this.selection.loading() && !this.selection.loadFailed());
  protected readonly boutonPrincipal = this.existante ? 'Enregistrer' : 'Créer la compagnie';

  /** Revenir à ce dialogue après la création d'un héros : `/session/new` mène à l'accueil, qui le rouvre, avec le nom tapé et la sélection commencée. */
  protected readonly createHeroState = computed(() => ({returnUrl: `/session/new?compagnie=nouvelle&nom=${encodeURIComponent(this.nom())}`}));
  private partiCreerUnHeros = false;

  constructor() {
    this.selection.loadCatalog();
    if (this.existante) {
      this.selection.combatants.set(this.existante.heros.map((heros) => ({catalogId: `hero:${heros.id}`, qty: 1})));
    } else if (!this.data.reprendreLaSelection) {
      this.selection.reset();
    }
    // La sélection est partagée : les héros d'une compagnie qu'on quitte ne doivent pas se retrouver dans la prochaine.
    this.destroyRef.onDestroy(() => {
      if (!this.partiCreerUnHeros) {
        this.selection.reset();
      }
    });
  }

  /** « Créer un héros » ferme le dialogue pour y revenir ensuite : les héros choisis attendent le retour. */
  protected allerCreerUnHeros(): void {
    this.partiCreerUnHeros = true;
  }

  protected reloadCatalog(): void {
    this.selection.loadCatalog();
  }

  protected ajouterHeros(): void {
    this.dialog.open(CombatantPickerDialogComponent, {
      width: 'min(1024px, 94vw)',
      maxWidth: '94vw',
      position: {top: '5vh'},
      data: {lockKind: 'hero'},
    });
  }

  protected enregistrer(): void {
    if (!this.peutEnregistrer()) {
      return;
    }
    const heros = this.present().map((entry) => entry.sourceId);
    this.enregistrement.set(true);
    (this.existante ? this.compagnieService.modifier(this.existante.id, this.nomSaisi(), heros) : this.compagnieService.creer(this.nomSaisi(), heros))
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (compagnie) => {
          this.enregistrement.set(false);
          this.selection.reset();
          this.dialogRef.close(compagnie);
        },
        error: (error: unknown) => {
          this.enregistrement.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible d’enregistrer la compagnie.'), 'OK', {duration: 6000});
        },
      });
  }
}
