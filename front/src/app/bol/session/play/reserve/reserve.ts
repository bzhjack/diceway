import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBar} from '@angular/material/snack-bar';
import {RouterLink} from '@angular/router';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {CombatCatalogEntry, CombatantKind, CombatSelectionService} from '../../../services/combat-selection.service';
import {resolveAddCombatantCamp} from '../add-combatant-dialog/add-combatant-dialog';
import {filterReserve, isOnTable, RESERVE_TABS, reserveTab} from './reserve.util';

interface ReserveRow {
  readonly entry: CombatCatalogEntry;
  readonly onTable: boolean;
}

/** Réserve de la table (mode libre) : les quatre bibliothèques en onglets, avec recherche. « Poser »
 * ajoute le personnage à la session ; la page recharge la session sur `placed`. */
@Component({
  selector: 'bol-reserve',
  imports: [RouterLink, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './reserve.html',
  styleUrl: './reserve.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReserveComponent {
  private readonly selection = inject(CombatSelectionService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  /** Ids source (heros_id / pnj_id) déjà présents dans la session. */
  readonly existingHeroIds = input.required<ReadonlySet<string>>();
  readonly existingPnjIds = input.required<ReadonlySet<string>>();
  readonly placed = output<void>();

  protected readonly tabs = RESERVE_TABS;
  protected readonly activeKind = signal<CombatantKind>('hero');
  protected readonly activeTab = computed(() => reserveTab(this.activeKind()));
  protected readonly query = signal('');
  protected readonly loading = this.selection.loading;
  /** Entrée en cours de pose : désactive tous les boutons « Poser » le temps de la requête. */
  protected readonly pendingCatalogId = signal<string | null>(null);

  protected readonly rows = computed<readonly ReserveRow[]>(() =>
    filterReserve(this.selection.catalog(), this.activeKind(), this.query()).map((entry) => ({
      entry,
      onTable: isOnTable(entry, this.existingHeroIds(), this.existingPnjIds()),
    })),
  );

  /** État de navigation des liens « Créer » / « Gérer » : revenir sur cette table après coup. */
  protected readonly navState = computed(() => ({returnUrl: `/session/${this.sessionId()}/play`}));

  constructor() {
    this.selection.loadCatalog();
  }

  protected setKind(change: MatButtonToggleChange): void {
    this.activeKind.set(change.value as CombatantKind);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected place(entry: CombatCatalogEntry): void {
    if (this.pendingCatalogId()) {
      return;
    }

    this.pendingCatalogId.set(entry.catalogId);
    this.fightSessionService
      .addCombatant(this.sessionId(), {
        kind: entry.kind,
        sourceId: entry.sourceId,
        camp: resolveAddCombatantCamp(entry.kind, 'adversaires'),
      })
      .subscribe({
        next: () => {
          this.pendingCatalogId.set(null);
          this.snackBar.open(`${entry.nom} posé sur la table.`, undefined, {duration: 2000});
          this.placed.emit();
        },
        error: (error: unknown) => {
          this.pendingCatalogId.set(null);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de poser ce personnage.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
  }
}
