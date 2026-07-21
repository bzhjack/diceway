import {NgTemplateOutlet} from '@angular/common';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolFightSessionModel, CombatCamp} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {combatantKindIcon, combatantKindIconIsSvg} from '../select/combat-statblock.util';
import {buildPlayBoard, PlayToken} from '../combat-play.util';
import {AddCombatantDialogComponent} from './add-combatant-dialog/add-combatant-dialog';

const COLS_PER_ZONE = 3;
const HERO_ZONE = {xMin: 8, xMax: 32, yMin: 16, yMax: 84};
const ADVERSAIRE_ZONE = {xMin: 68, xMax: 92, yMin: 16, yMax: 84};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Petit décalage déterministe (basé sur la clé du jeton) pour éviter un alignement trop rigide sur la carte. */
function jitter(key: string): {jx: number; jy: number} {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const jx = ((hash % 1000) / 1000) * 2 - 1;
  const jy = (((hash >> 8) % 1000) / 1000) * 2 - 1;
  return {jx, jy};
}

/**
 * Écran plein page affiché après « Lancer le combat » : ruban d'initiative en haut, battlemap en
 * dessous où les jetons sont librement déplaçables (glisser-déposer, non persisté — repositionnés
 * par défaut à chaque rechargement). Un combattant peut être ajouté en cours de combat depuis le
 * ruban ; les PV restent en revanche non modifiables pour l'instant.
 */
@Component({
  selector: 'bol-combat-play-page',
  imports: [MatIconModule, NgTemplateOutlet, RouterLink, DragDropModule],
  templateUrl: './combat-play-page.html',
  styleUrl: './combat-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatPlayPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly session = signal<BolFightSessionModel | null>(null);

  protected readonly board = computed(() => {
    const session = this.session();
    return session ? buildPlayBoard(session) : null;
  });

  /** Réordonnancement manuel du ruban (glisser-déposer), non persisté — clés dans l'ordre voulu. */
  private readonly manualOrder = signal<readonly string[] | null>(null);

  /** Ordre d'initiative affiché : ordre calculé par défaut, sauf réordonnancement manuel ; les
   * nouveaux combattants (ajout en cours de combat) rejoignent la fin, ceux retirés disparaissent. */
  protected readonly orderedTokens = computed(() => {
    const tokens = this.board()?.tokens ?? [];
    const order = this.manualOrder();
    if (!order) {
      return tokens;
    }

    const byKey = new Map(tokens.map((t) => [t.key, t]));
    const reordered = order.map((key) => byKey.get(key)).filter((t): t is PlayToken => !!t);
    const knownKeys = new Set(reordered.map((t) => t.key));
    const missing = tokens.filter((t) => !knownKeys.has(t.key));
    return [...reordered, ...missing];
  });

  protected readonly heroTokens = computed(() => this.board()?.tokens.filter((t) => t.camp === 'heros') ?? []);
  protected readonly adversaireTokens = computed(
    () => this.board()?.tokens.filter((t) => t.camp === 'adversaires') ?? [],
  );

  /** Premier de l'ordre affiché (calculé ou réordonné) = combattant dont c'est le tour. */
  protected readonly activeKey = computed(() => this.orderedTokens()[0]?.key ?? null);

  protected readonly kindIcon = combatantKindIcon;
  protected readonly kindIconIsSvg = combatantKindIconIsSvg;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Combat introuvable.');
      this.loading.set(false);
      return;
    }

    this.loadSession(id);
  }

  protected openAddCombatantDialog(): void {
    const session = this.session();
    const sessionId = session?.id;
    if (!session || !sessionId) {
      return;
    }

    const existingHeroIds = new Set((session.heros ?? []).map((h) => String(h.heros_id)));
    const existingPnjIds = new Set(
      (session.pnjs ?? []).map((p) => p.pnj_id).filter((pnjId): pnjId is string => !!pnjId).map(String),
    );

    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {sessionId, existingHeroIds, existingPnjIds},
      })
      .afterClosed()
      .subscribe((didAdd: boolean | undefined) => {
        if (didAdd) {
          this.loadSession(sessionId);
        }
      });
  }

  protected askRemoveCombatant(token: PlayToken, event: Event): void {
    event.stopPropagation();

    const sessionId = this.session()?.id;
    if (!sessionId) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: 'Retirer ce combattant',
        message: `Voulez-vous retirer « ${token.nom} » de ce combat ?`,
        confirmLabel: 'Retirer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.removeCombatant(sessionId, token.kind, token.pivotId).subscribe({
        next: () => this.loadSession(sessionId),
        error: (error: unknown) => {
          this.snackBar.open(
            extractApiErrorMessage(error, 'Impossible de retirer ce combattant.'),
            'Fermer',
            {duration: 5000},
          );
        },
      });
    });
  }

  /** Glisser-déposer dans le ruban : réordonnancement manuel, non persisté (perdu au rechargement). */
  protected onRailDrop(event: CdkDragDrop<PlayToken[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const keys = this.orderedTokens().map((t) => t.key);
    moveItemInArray(keys, event.previousIndex, event.currentIndex);
    this.manualOrder.set(keys);
  }

  private loadSession(id: string): void {
    this.fightSessionService
      .fightSession(id)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger ce combat.');
          this.loading.set(false);
        },
      });
  }

  protected hpPct(token: PlayToken): number {
    if (token.vitaliteMax === null || token.vitaliteMax <= 0 || token.vitaliteCourante === null) {
      return 100;
    }

    return Math.max(0, Math.min(100, (token.vitaliteCourante / token.vitaliteMax) * 100));
  }

  protected hpColor(token: PlayToken): string {
    return this.hpPct(token) <= 50 ? 'var(--dw-color-echec)' : 'var(--dw-color-reussite)';
  }

  protected chipClass(token: PlayToken): string {
    const active = token.key === this.activeKey() ? ' cp-rail-chip--active' : '';
    return `cp-rail-chip cp-rail-chip--${token.kind}${active}`;
  }

  protected tokenClass(token: PlayToken): string {
    const active = token.key === this.activeKey() ? ' cp-token--active' : '';
    return `cp-token cp-token--${token.kind}${active}`;
  }

  /** Position par défaut d'un jeton sur la battlemap (héros à gauche, adversaires à droite), avant tout glisser-déposer. */
  protected tokenStyle(token: PlayToken, indexInCamp: number, camp: CombatCamp): Record<string, string> {
    const zone = camp === 'heros' ? HERO_ZONE : ADVERSAIRE_ZONE;
    const campCount = (camp === 'heros' ? this.heroTokens() : this.adversaireTokens()).length;
    const rows = Math.max(1, Math.ceil(campCount / COLS_PER_ZONE));

    const col = indexInCamp % COLS_PER_ZONE;
    const row = Math.floor(indexInCamp / COLS_PER_ZONE);
    const colWidth = (zone.xMax - zone.xMin) / COLS_PER_ZONE;
    const rowHeight = (zone.yMax - zone.yMin) / rows;
    const baseX = zone.xMin + colWidth * (col + 0.5);
    const baseY = zone.yMin + rowHeight * (row + 0.5);

    const {jx, jy} = jitter(token.key);
    const x = clamp(baseX + jx * colWidth * 0.18, zone.xMin, zone.xMax);
    const y = clamp(baseY + jy * rowHeight * 0.18, zone.yMin, zone.yMax);

    return {left: `${x}%`, top: `${y}%`};
  }
}
