import {CdkDrag, CdkDragEnd, CdkDragMove, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {CharacterCardComponent} from './character-card';
import {CardCombatState} from '../../models/combat-turn.model';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {ReservePlacementService} from '../../reserve-placement.service';
import {splitRows} from './tapis.util';
import {TapisCard} from '../../models/tapis.model';

/** Le tapis : deux rangs de cartes rangées automatiquement, les héros et alliés en bas, face aux autres
 * personnages en haut (« Présents dans la scène » en mode libre, « Adversaires » en combat). Au milieu :
 * le bandeau « Dernier jet » en mode libre, la barre d'action de la carte active en combat — où un clic
 * sur une carte désignable demande une attaque. La carte dépliée prend la place de sa face ; dans le rang
 * du bas elle grandit vers le haut. Ne parle à aucun service : il lit seulement l'état du glisser de la
 * réserve (`dragging`, `hoverCamp`) pour dessiner ses zones de dépôt, repérées par `data-drop-camp`. */
@Component({
  selector: 'bol-tapis',
  imports: [CdkDrag, CdkDragPreview, CdkDropList, NgTemplateOutlet, CharacterCardComponent, DwScrollerComponent],
  templateUrl: './tapis.html',
  styleUrl: './tapis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TapisComponent {
  private readonly placement = inject(ReservePlacementService);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  readonly mode = input<'libre' | 'combat'>('libre');
  /** État de chaque carte dans le combat — `null` en mode libre. */
  readonly combatStates = input<ReadonlyMap<string, CardCombatState> | null>(null);

  /** Cartes sélectionnées par Ctrl + clic. */
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  /** Ctrl ou Cmd + clic sur une face : ajoute ou retire la carte de la sélection. */
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Clic sur une carte désignable en combat : elle devient la cible de la carte active. */
  readonly attackRequested = output<TapisCard>();

  /** Les zones de dépôt qui s'allument pendant un glisser : pas celle d'où part une carte, ni celle des adversaires
   * pour un héros. */
  protected readonly adversairesDroppable = computed(
    () => this.placement.dragging() && this.placement.originCamp() !== 'adversaires' && this.placement.adversairesDroppable(),
  );
  protected readonly herosDroppable = computed(() => this.placement.dragging() && this.placement.originCamp() !== 'heros');
  protected readonly hotCamp = this.placement.hoverCamp;
  protected readonly rows = computed(() => splitRows(this.cards()));
  protected readonly presentsLabel = computed(() => (this.mode() === 'combat' ? 'Adversaires' : 'Présents dans la scène'));

  /** Seules les cartes d'un PNJ, d'une créature ou d'un démon changent de camp, hors combat. */
  protected canChangeCamp(card: TapisCard): boolean {
    return this.mode() === 'libre' && card.kind !== 'hero';
  }

  /** Aucune liste ne reçoit de carte : CDK n'est là que pour l'aperçu et la place gardée pendant le glisser. */
  protected readonly rejectDrop = (): boolean => false;

  protected onCardDragStarted(card: TapisCard): void {
    this.placement.startDrag([card.kind], card.camp);
  }

  protected onCardDragMoved(event: CdkDragMove): void {
    this.placement.hoverCamp.set(this.placement.campAt(event.pointerPosition.x, event.pointerPosition.y));
  }

  /** Déposée dans l'autre zone, la carte change de camp. */
  protected onCardDragEnded(event: CdkDragEnd, card: TapisCard): void {
    const camp = this.placement.campAt(event.dropPoint.x, event.dropPoint.y);
    this.placement.endDrag();
    event.source.reset();
    if (camp !== null && camp !== card.camp) {
      this.campToggleRequested.emit(card);
    }
  }

  protected stateOf(card: TapisCard): CardCombatState | null {
    return this.combatStates()?.get(card.key) ?? null;
  }

  /** Clic sur la face : en combat, une carte désignable est attaquée ; toute autre carte se déplie. */
  protected onFaceClick(card: TapisCard, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      this.selectToggled.emit(card);
    } else if (this.stateOf(card)?.targetable) {
      this.attackRequested.emit(card);
    } else {
      this.cardToggled.emit(card);
    }
  }
}
