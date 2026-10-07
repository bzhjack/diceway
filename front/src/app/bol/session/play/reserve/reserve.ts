import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleChange, MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {RouterLink} from '@angular/router';
import {CdkDrag, CdkDragEnd, CdkDragMove, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {CombatCatalogEntry, CombatantKind} from '../../../models/combat-selection.model';
import {RESERVE_MAX_QTY, ReservePlacementService} from '../../reserve-placement.service';
import {ReserveItem} from '../../models/reserve.model';
import {SceneStripComponent} from './scene-strip';
import {filterReserve, isOnTable, KIND_LABEL, RESERVE_TABS, reserveTab} from './reserve.util';

interface ReserveRow {
  readonly entry: CombatCatalogEntry;
  readonly onTable: boolean;
}

/** Onglet affiché : un des quatre types de personnages, ou les scènes. */
type ReserveView = CombatantKind | 'scene';

/** Réserve de la table (mode libre), en bandeau au bas de l'écran comme une main de cartes : les
 * quatre bibliothèques et les scènes en onglets, en liste. Un clic coche un personnage ; on le pose par
 * double-clic ou Entrée (camp par défaut), en le glissant sur une zone du tapis (camp de la zone), ou
 * avec la barre de sélection pour plusieurs à la fois. La page recharge la session sur `placed`. */
@Component({
  selector: 'bol-reserve',
  imports: [CdkDrag, CdkDragPreview, CdkDropList, RouterLink, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule, SceneStripComponent],
  templateUrl: './reserve.html',
  styleUrl: './reserve.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReserveComponent {
  private readonly selection = inject(CombatSelectionService);
  private readonly placement = inject(ReservePlacementService);

  readonly sessionId = input.required<string>();
  /** Ids source (heros_id / pnj_id) déjà présents dans la session. */
  readonly existingHeroIds = input.required<ReadonlySet<string>>();
  readonly existingPnjIds = input.required<ReadonlySet<string>>();
  readonly placed = output<void>();
  /** Scène courante de la session et nombre de non-héros sur la table, relayés à `bol-scene-list`. */
  readonly currentSceneId = input<string | null>(null);
  readonly nonHeroCount = input(0);
  /** Une opération sur les scènes a modifié la session : la page la recharge. */
  readonly sceneChanged = output<void>();

  protected readonly tabs = RESERVE_TABS;
  protected readonly view = signal<ReserveView>('hero');
  /** Type de personnage listé — sans objet quand l'onglet Scènes est affiché (la liste est masquée). */
  protected readonly activeKind = computed<CombatantKind>(() => {
    const view = this.view();
    return view === 'scene' ? 'hero' : view;
  });
  protected readonly activeTab = computed(() => reserveTab(this.activeKind()));
  protected readonly query = signal('');
  protected readonly loading = this.selection.loading;
  /** Entrées dont l'avatar a échoué au chargement : repli sur l'initiale du nom. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  protected readonly rows = computed<readonly ReserveRow[]>(() =>
    filterReserve(this.selection.catalog(), this.activeKind(), this.query()).map((entry) => ({
      entry,
      onTable: isOnTable(entry, this.existingHeroIds(), this.existingPnjIds()),
    })),
  );

  protected readonly maxQty = RESERVE_MAX_QTY;

  /** La liste ne reçoit rien : elle n'existe que pour que CDK dessine l'aperçu et garde la place de la ligne
   * pendant un glisser. Le dépôt est géré par `onDragEnded`, qui cherche la zone du tapis sous le pointeur. */
  protected readonly rejectDrop = (): boolean => false;

  /** Personnages cochés encore posables, avec leur quantité — d'un onglet comme de l'autre. */
  protected readonly selectedItems = computed<readonly ReserveItem[]>(() => {
    const selected = this.placement.selectedIds();
    return this.selection
      .catalog()
      .filter((entry) => selected.has(entry.catalogId) && !isOnTable(entry, this.existingHeroIds(), this.existingPnjIds()))
      .map((entry) => ({entry, qty: this.itemQty(entry)}));
  });
  protected readonly selectedTotal = computed(() => this.selectedItems().reduce((sum, item) => sum + item.qty, 0));
  protected readonly pending = signal(false);

  /** État de navigation des liens « Créer » / « Gérer » : revenir sur cette table après coup. */
  protected readonly navState = computed(() => ({returnUrl: `/session/${this.sessionId()}/play`}));

  /** Annulations déjà prises en compte : une nouvelle valeur du service demande de recharger la session. */
  private seenUndo = this.placement.undone();

  constructor() {
    this.selection.loadCatalog();
    effect(() => {
      const undone = this.placement.undone();
      if (undone !== this.seenUndo) {
        this.seenUndo = undone;
        this.placed.emit();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.placement.clearSelection();
      this.placement.endDrag();
    });
  }

  protected setView(change: MatButtonToggleChange): void {
    this.placement.clearSelection();
    this.view.set(change.value as ReserveView);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected hasAvatar(entry: CombatCatalogEntry): boolean {
    return !!entry.avatar && !this.brokenAvatars().has(entry.catalogId);
  }

  protected onAvatarError(entry: CombatCatalogEntry): void {
    this.brokenAvatars.update((set) => new Set(set).add(entry.catalogId));
  }

  protected initial(entry: CombatCatalogEntry): string {
    return entry.nom.trim().charAt(0).toUpperCase();
  }

  protected kindLabel(entry: CombatCatalogEntry): string {
    return KIND_LABEL[entry.kind];
  }

  protected rowLabel(row: ReserveRow): string {
    return row.onTable ? `${row.entry.nom}, déjà à table` : `${row.entry.nom}, ${this.kindLabel(row.entry)}`;
  }

  /** Seules les créatures et les démons se posent en plusieurs exemplaires. */
  protected hasQuantity(entry: CombatCatalogEntry): boolean {
    return entry.kind === 'creature' || entry.kind === 'demon';
  }

  protected quantity(row: ReserveRow): number {
    return this.placement.quantityOf(row.entry.catalogId);
  }

  protected changeQuantity(row: ReserveRow, delta: number): void {
    this.placement.setQuantity(row.entry.catalogId, this.quantity(row) + delta);
  }

  protected isSelected(row: ReserveRow): boolean {
    return this.placement.selectedIds().has(row.entry.catalogId);
  }

  /** Clic : coche ou décoche. Rien ne se pose sans geste explicite (double-clic, Entrée, glisser, barre). */
  protected toggle(row: ReserveRow): void {
    if (!row.onTable) {
      this.placement.select(row.entry.catalogId, !this.isSelected(row));
    }
  }

  protected clearSelection(): void {
    this.placement.clearSelection();
  }

  protected onRowKey(event: KeyboardEvent, row: ReserveRow): void {
    if (event.target !== event.currentTarget || row.onTable) {
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      this.toggle(row);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.placeFrom(row, 'auto');
    }
  }

  /** Double-clic : pose ce personnage dans son camp par défaut. */
  protected placeOne(row: ReserveRow): void {
    if (!row.onTable) {
      this.placement.deselect(row.entry.catalogId);
      this.run([{entry: row.entry, qty: this.itemQty(row.entry)}], 'auto');
    }
  }

  protected placeSelection(camp: CombatCamp): void {
    this.run(this.selectedItems(), camp);
  }

  /** Ce qu'on emporte en glissant ou en validant : toute la sélection si la ligne en fait partie, sinon elle seule. */
  private itemsFor(row: ReserveRow): readonly ReserveItem[] {
    const selected = this.selectedItems();
    return this.isSelected(row) && selected.length > 1 ? selected : [{entry: row.entry, qty: this.itemQty(row.entry)}];
  }

  private placeFrom(row: ReserveRow, camp: CombatCamp | 'auto'): void {
    this.run(this.itemsFor(row), camp);
  }

  private itemQty(entry: CombatCatalogEntry): number {
    return this.hasQuantity(entry) ? this.placement.quantityOf(entry.catalogId) : 1;
  }

  protected ghostLabel(row: ReserveRow): string {
    const items = this.itemsFor(row);
    return items.length > 1 ? `${items.length} personnages` : this.itemQty(row.entry) > 1 ? `${row.entry.nom} ×${this.itemQty(row.entry)}` : row.entry.nom;
  }

  protected onDragStarted(row: ReserveRow): void {
    this.placement.startDrag(this.itemsFor(row).map((item) => item.entry.kind), null);
  }

  protected onDragMoved(event: CdkDragMove): void {
    this.placement.hoverCamp.set(this.placement.campAt(event.pointerPosition.x, event.pointerPosition.y));
  }

  protected onDragEnded(event: CdkDragEnd, row: ReserveRow): void {
    const camp = this.placement.campAt(event.dropPoint.x, event.dropPoint.y);
    this.placement.endDrag();
    event.source.reset();
    if (camp) {
      this.placeFrom(row, camp);
    }
  }

  private run(items: readonly ReserveItem[], camp: CombatCamp | 'auto'): void {
    if (this.pending() || !items.length) {
      return;
    }

    this.pending.set(true);
    this.placement.place(this.sessionId(), items, camp).subscribe((placed) => {
      this.pending.set(false);
      if (placed) {
        this.placed.emit();
      }
    });
  }
}
