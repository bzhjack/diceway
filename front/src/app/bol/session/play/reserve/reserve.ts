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
import {ReservePlacementService} from '../../reserve-placement.service';
import {SceneStripComponent} from './scene-strip';
import {filterReserve, isOnTable, KIND_LABEL, RESERVE_TABS, reserveTab} from './reserve.util';

interface ReserveRow {
  readonly entry: CombatCatalogEntry;
  readonly onTable: boolean;
}

/** Onglet affiché : un des quatre types de personnages, ou les scènes. */
type ReserveView = CombatantKind | 'scene';

/** Réserve de la table (mode libre) : les quatre bibliothèques et les scènes en onglets, en liste. Un
 * personnage se pose avec son bouton « Ajouter », par double-clic ou Entrée (camp par défaut), ou en le
 * glissant sur une zone du tapis (camp de la zone). La page recharge la session sur `placed`. */
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

  /** La liste ne reçoit rien : elle n'existe que pour que CDK dessine l'aperçu et garde la place de la ligne
   * pendant un glisser. Le dépôt est géré par `onDragEnded`, qui cherche la zone du tapis sous le pointeur. */
  protected readonly rejectDrop = (): boolean => false;

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
    inject(DestroyRef).onDestroy(() => this.placement.endDrag());
  }

  protected setView(change: MatButtonToggleChange): void {
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

  /** Entrée : pose le personnage dans son camp par défaut. */
  protected onRowKey(event: KeyboardEvent, row: ReserveRow): void {
    if (event.key === 'Enter' && event.target === event.currentTarget && !row.onTable) {
      event.preventDefault();
      this.add(row);
    }
  }

  /** Bouton « Ajouter » ou double-clic : pose le personnage dans son camp par défaut. */
  protected add(row: ReserveRow): void {
    if (!row.onTable) {
      this.run([row.entry], 'auto');
    }
  }

  protected onDragStarted(row: ReserveRow): void {
    this.placement.startDrag([row.entry.kind], null);
  }

  protected onDragMoved(event: CdkDragMove): void {
    this.placement.hoverCamp.set(this.placement.campAt(event.pointerPosition.x, event.pointerPosition.y));
  }

  protected onDragEnded(event: CdkDragEnd, row: ReserveRow): void {
    const camp = this.placement.campAt(event.dropPoint.x, event.dropPoint.y);
    this.placement.endDrag();
    event.source.reset();
    if (camp) {
      this.run([row.entry], camp);
    }
  }

  private run(entries: readonly CombatCatalogEntry[], camp: CombatCamp | 'auto'): void {
    if (this.pending()) {
      return;
    }

    this.pending.set(true);
    this.placement.place(this.sessionId(), entries, camp).subscribe((placed) => {
      this.pending.set(false);
      if (placed) {
        this.placed.emit();
      }
    });
  }
}
