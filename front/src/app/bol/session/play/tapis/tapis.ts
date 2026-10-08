import {CdkDrag, CdkDragEnd, CdkDragMove, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {CharacterCardComponent} from './character-card';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {ReservePlacementService} from '../../reserve-placement.service';
import {splitRows} from './tapis.util';
import {TapisCard} from '../../models/tapis.model';

/** Le tapis du mode libre : deux rangs de cartes rangées automatiquement, les héros et alliés en bas, face aux
 * autres personnages en haut (« Présents dans la scène »). La carte dépliée est ouverte en dialogue. Ne parle à
 * aucun service : il lit seulement l'état du glisser de la réserve (`dragging`, `hoverCamp`) pour dessiner ses
 * zones de dépôt, repérées par `data-drop-camp`. */
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

  /** Cartes sélectionnées par Ctrl + clic. */
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  /** Ctrl ou Cmd + clic sur une face : ajoute ou retire la carte de la sélection. */
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();

  /** Les zones de dépôt qui s'allument pendant un glisser : pas celle d'où part une carte, ni celle des adversaires
   * pour un héros. */
  protected readonly adversairesDroppable = computed(
    () => this.placement.dragging() && this.placement.originCamp() !== 'adversaires' && this.placement.adversairesDroppable(),
  );
  protected readonly herosDroppable = computed(() => this.placement.dragging() && this.placement.originCamp() !== 'heros');
  protected readonly hotCamp = this.placement.hoverCamp;
  protected readonly rows = computed(() => splitRows(this.cards()));

  /** Seules les cartes d'un PNJ, d'une créature ou d'un démon changent de camp. */
  protected canChangeCamp(card: TapisCard): boolean {
    return card.kind !== 'hero';
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

  /** Clic sur la face : Ctrl ou Cmd + clic sélectionne la carte, un clic simple la déplie. */
  protected onFaceClick(card: TapisCard, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      this.selectToggled.emit(card);
    } else {
      this.cardToggled.emit(card);
    }
  }
}
