import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavContent, MatSidenavModule} from '@angular/material/sidenav';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {isEditable, isEndTurnShortcut, isPaletteShortcut} from './command-palette/shortcut.util';
import {SessionHeaderComponent} from './session-header/session-header';
import {ReserveComponent} from './reserve/reserve';
import {CombatBoardComponent} from './combat-board/combat-board';
import {CombatEndService} from './table/combat-end.service';
import {CombatStatsStore} from './table/combat-stats.store';
import {CombatTurnStore} from './table/combat-turn.store';
import {CombatWoundsService} from './table/combat-wounds.service';
import {ExpandedCardStore} from './table/expanded-card.store';
import {TableCommandsService} from './table/table-commands.service';
import {TableStore} from './table/table.store';
import {TurnOrderComponent} from './tapis/turn-order';
import {RideauComponent} from './theatre/rideau';
import {SceneActsComponent} from './theatre/scene-acts';
import {SceneStageStore} from './theatre/scene-stage.store';
import {TheatreComponent} from './theatre/theatre';
import {ReservePlacementService} from '../reserve-placement.service';

/** Ce que la page demande au plateau. Le composant est chargé par son `@defer` : ce fichier ne doit le citer que dans `imports`. */
interface CombatBoardHandle {
  requestEndTurn(): void;
}

/**
 * La table : page d'accueil d'une session. Mode libre : la frise des actes dans l'en-tête, le carnet du MJ et la feuille de situation
 * (`bol-theatre`, `bol-situation`) et la réserve. Mode combat : `bol-combat-board`. La page assemble l'écran, écoute le clavier et
 * lance le chargement ; tout le reste vit dans `table/`, un service par domaine.
 */
@Component({
  selector: 'bol-session-play-page',
  imports: [RouterLink, MatIconModule, SessionHeaderComponent, ReserveComponent, CombatBoardComponent, TurnOrderComponent, SceneActsComponent, RideauComponent, TheatreComponent, MatButtonModule, MatSidenavModule],
  // Une instance par table : la frise de l'en-tête et le plateau partagent les scènes et le rideau.
  providers: [SceneStageStore, TableStore, CombatTurnStore, CombatStatsStore, CombatWoundsService, CombatEndService, ExpandedCardStore, TableCommandsService],
  templateUrl: './session-play-page.html',
  styleUrl: './session-play-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class SessionPlayPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  protected readonly stage = inject(SceneStageStore);
  protected readonly table = inject(TableStore);
  protected readonly combat = inject(CombatTurnStore);
  protected readonly stats = inject(CombatStatsStore);
  protected readonly wounds = inject(CombatWoundsService);
  protected readonly ending = inject(CombatEndService);
  protected readonly expanded = inject(ExpandedCardStore);
  protected readonly commands = inject(TableCommandsService);
  /** Un glisser des coulisses vers la scène en cours : le backdrop s'efface pour laisser viser la scène. */
  protected readonly placement = inject(ReservePlacementService);

  private readonly combatBoard = viewChild<CombatBoardHandle>('combatBoard');
  /** Le plateau sous les coulisses : Material le rend `inert` derrière le voile. */
  private readonly sceneContent = viewChild(MatSidenavContent, {read: ElementRef});

  constructor() {
    // Un élément `inert` échappe à `document.elementFromPoint` : pendant un glisser des coulisses vers la scène, le plateau redevient
    // visable (le dépôt cherche la zone sous le pointeur), puis repasse derrière le voile tant que les coulisses restent ouvertes.
    effect(() => {
      const content = this.sceneContent()?.nativeElement as HTMLElement | undefined;
      if (!content) {
        return;
      }
      if (this.placement.dragging()) {
        content.removeAttribute('inert');
      } else if (this.table.reserveOpen()) {
        content.setAttribute('inert', 'true');
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.table.errorMessage.set('Session introuvable.');
      this.table.loading.set(false);
      return;
    }

    this.table.entrer(id);
  }

  /** Échap replie la carte dépliée, sauf si un dialogue est ouvert, ou si un menu ou un popover vient de le
   * traiter (il marque alors l'événement `defaultPrevented`) : Échap ne ferme alors que lui. */
  private onEscape(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }
    if (this.dialog.openDialogs.length === 0) {
      this.table.selectedKeys.set(new Set());
      this.expanded.foldCard();
    }
  }

  /** `/` ou `Ctrl+K` ouvre la barre de commande ; `F` termine le tour en combat. Rien de tout cela
   * quand un dialogue est ouvert. */
  private onKeydown(event: KeyboardEvent): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (event.key === 'Delete' && this.table.mode() === 'libre' && this.table.selectedKeys().size && !isEditable(target)) {
      event.preventDefault();
      this.commands.askRemoveSelection();
      return;
    }
    if (isPaletteShortcut(event, target)) {
      event.preventDefault();
      this.commands.openPalette();
    } else if (this.table.mode() === 'combat' && isEndTurnShortcut(event, target)) {
      event.preventDefault();
      const board = this.combatBoard();
      if (board) {
        board.requestEndTurn();
      } else {
        this.combat.onEndTurn();
      }
    }
  }
}
