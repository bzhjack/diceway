import {CdkDrag, CdkDragEnd, CdkDragMove, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {TapisCard} from '../../models/tapis.model';
import {ReservePlacementService} from '../../reserve-placement.service';
import {ActeurComponent} from './acteur';
import {troupe} from './theatre.util';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';

/** La troupe en scène, posée sur la rampe du plateau : les personnages du camp des adversaires, rangés par
 * rang, sur des cartes dont la taille dit le rang. C'est la zone de dépôt `adversaires` : un personnage glissé
 * depuis les coulisses y entre, une carte glissée vers la compagnie devient alliée. Ne parle à aucun service
 * hormis l'état du glisser (`ReservePlacementService`). */
@Component({
  selector: 'bol-troupe',
  imports: [AvatarFallbackDirective, CdkDrag, CdkDragPreview, CdkDropList, MatButtonModule, MatIconModule, DwScrollerComponent, ActeurComponent],
  templateUrl: './troupe.html',
  styleUrl: './troupe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TroupeComponent {
  private readonly placement = inject(ReservePlacementService);

  readonly cards = input.required<readonly TapisCard[]>();
  /** Cartes sélectionnées par Ctrl + clic. */
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** « Ouvrir les coulisses », quand personne n'est en scène. */
  readonly coulissesRequested = output<void>();

  protected readonly acteurs = computed(() => troupe(this.cards()));
  /** La zone s'allume pendant un glisser qui peut y finir : pas une carte qui en part, ni un héros. */
  protected readonly droppable = computed(
    () => this.placement.dragging() && this.placement.originCamp() !== 'adversaires' && this.placement.adversairesDroppable(),
  );
  protected readonly hot = computed(() => this.placement.hoverCamp() === 'adversaires');

  /** Aucune liste ne reçoit de carte : CDK n'est là que pour l'aperçu et la place gardée pendant le glisser. */
  protected readonly rejectDrop = (): boolean => false;

  protected onFaceClick(card: TapisCard, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      this.selectToggled.emit(card);
    } else {
      this.cardToggled.emit(card);
    }
  }

  protected onDragStarted(card: TapisCard): void {
    this.placement.startDrag([card.kind], card.camp);
  }

  protected onDragMoved(event: CdkDragMove): void {
    this.placement.hoverCamp.set(this.placement.campAt(event.pointerPosition.x, event.pointerPosition.y));
  }

  /** Déposée sur la compagnie, la carte passe du côté des héros. */
  protected onDragEnded(event: CdkDragEnd, card: TapisCard): void {
    const camp = this.placement.campAt(event.dropPoint.x, event.dropPoint.y);
    this.placement.endDrag();
    event.source.reset();
    if (camp !== null && camp !== card.camp) {
      this.campToggleRequested.emit(card);
    }
  }
}
