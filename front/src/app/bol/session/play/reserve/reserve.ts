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
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {SceneStripComponent} from './scene-strip';
import {filterReserve, isOnTable, RESERVE_TABS, reserveTab} from './reserve.util';

interface ReserveRow {
  readonly entry: CombatCatalogEntry;
  readonly onTable: boolean;
}

/** Onglet affiché : un des quatre types de personnages, ou les scènes. */
type ReserveView = CombatantKind | 'scene';

/** Réserve de la table (mode libre), en bandeau au bas de l'écran comme une main de cartes : les
 * quatre bibliothèques et les scènes en onglets. Un clic sur un personnage le pose ; la page
 * recharge la session sur `placed`. */
@Component({
  selector: 'bol-reserve',
  imports: [RouterLink, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule, SceneStripComponent, DwScrollerComponent],
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
  /** Entrée en cours de pose : désactive tous les boutons « Poser » le temps de la requête. */
  protected readonly pendingCatalogId = signal<string | null>(null);
  /** Entrées dont l'avatar a échoué au chargement : repli sur l'initiale du nom. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

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

  protected miniLabel(row: ReserveRow): string {
    return row.onTable ? `${row.entry.nom}, déjà à table` : `Poser ${row.entry.nom} sur la table`;
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
