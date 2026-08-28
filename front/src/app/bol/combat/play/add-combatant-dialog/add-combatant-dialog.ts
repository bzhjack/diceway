import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {CombatCatalogEntry, CombatantKind, CombatSelectionService} from '../../../services/combat-selection.service';
import {combatantKindIcon, combatantKindIconIsSvg, combatantRankLabel} from '../../select/combat-statblock.util';

type CatalogFilter = CombatantKind | 'all';

export interface AddCombatantDialogData {
  readonly sessionId: string;
  /** Ids source (heros_id / pnj_id) déjà présents dans la session — un héros ou un PNJ ne peut y figurer qu'une fois. */
  readonly existingHeroIds: ReadonlySet<string>;
  readonly existingPnjIds: ReadonlySet<string>;
}

function duplicateKey(kind: CombatantKind, sourceId: string): string {
  return `${kind}:${String(sourceId)}`;
}

/** Dialog d'ajout d'un combattant à une session déjà lancée (contrairement au picker de préparation, chaque clic ajoute immédiatement côté backend). */
@Component({
  selector: 'bol-add-combatant-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './add-combatant-dialog.html',
  styleUrl: './add-combatant-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCombatantDialogComponent {
  protected readonly ref = inject(MatDialogRef<AddCombatantDialogComponent, boolean>);
  private readonly data = inject<AddCombatantDialogData>(MAT_DIALOG_DATA);
  protected readonly selection = inject(CombatSelectionService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly activeType = signal<CatalogFilter>('all');
  protected readonly query = signal('');
  protected readonly camp = signal<CombatCamp>('adversaires');
  protected readonly addedCount = signal(0);
  protected readonly pendingCatalogId = signal<string | null>(null);
  /** Héros/PNJ ajoutés depuis l'ouverture du dialog (le dialog reste ouvert entre deux ajouts). */
  private readonly addedDuringSession = signal<ReadonlySet<string>>(new Set());

  protected readonly kindIcon = combatantKindIcon;
  protected readonly kindIconIsSvg = combatantKindIconIsSvg;
  protected readonly rankLabel = combatantRankLabel;

  protected readonly filteredCatalog = computed(() => {
    const type = this.activeType();
    const query = this.query().trim().toLowerCase();

    return this.selection
      .catalog()
      .filter(
        (entry) => (type === 'all' || entry.kind === type) && (!query || entry.nom.toLowerCase().includes(query)),
      );
  });

  constructor() {
    this.selection.loadCatalog();
  }

  protected setType(type: CatalogFilter): void {
    this.activeType.set(type);
  }

  protected setCamp(camp: CombatCamp): void {
    this.camp.set(camp);
  }

  /** Un héros ou un PNJ ne peut participer qu'une fois à un même combat (contrairement aux créatures/démons, ré-instanciables). */
  protected isAlreadyAdded(entry: CombatCatalogEntry): boolean {
    const sourceId = String(entry.sourceId);
    if (entry.kind === 'hero') {
      return this.data.existingHeroIds.has(sourceId) || this.addedDuringSession().has(duplicateKey('hero', sourceId));
    }
    if (entry.kind === 'pnj') {
      return this.data.existingPnjIds.has(sourceId) || this.addedDuringSession().has(duplicateKey('pnj', sourceId));
    }
    return false;
  }

  protected add(entry: CombatCatalogEntry): void {
    if (this.pendingCatalogId() || this.isAlreadyAdded(entry)) {
      return;
    }

    this.pendingCatalogId.set(entry.catalogId);
    this.fightSessionService
      .addCombatant(this.data.sessionId, {kind: entry.kind, sourceId: entry.sourceId, camp: this.camp()})
      .subscribe({
        next: () => {
          this.pendingCatalogId.set(null);
          this.addedCount.update((n) => n + 1);
          if (entry.kind === 'hero' || entry.kind === 'pnj') {
            this.addedDuringSession.update((set) => new Set(set).add(duplicateKey(entry.kind, entry.sourceId)));
          }
          this.snackBar.open(`${entry.nom} ajouté.`, undefined, {duration: 2000});
        },
        error: (error: unknown) => {
          this.pendingCatalogId.set(null);
          this.snackBar.open(
            extractApiErrorMessage(error, "Impossible d'ajouter ce combattant."),
            'Fermer',
            {duration: 5000},
          );
        },
      });
  }

  protected close(): void {
    this.ref.close(this.addedCount() > 0);
  }
}
