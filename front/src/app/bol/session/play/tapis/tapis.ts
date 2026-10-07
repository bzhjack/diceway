import {CdkDrag, CdkDragEnd, CdkDragMove, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {NgTemplateOutlet} from '@angular/common';
import {afterRenderEffect, ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {BolStatblockData} from '../../../shared/models/bol-statblock.model';
import {AttackChoice} from '../../models/attack-options.model';
import {ActionBarComponent} from './action-bar';
import {CharacterCardComponent} from './character-card';
import {CardCombatState} from '../../models/combat-turn.model';
import {ExpandedCardComponent} from './expanded-card';
import {ExpandedHeroData} from '../../models/expanded-card.model';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {ReservePlacementService} from '../../reserve-placement.service';
import {revealDelta, splitRows} from './tapis.util';
import {TapisCard} from '../../models/tapis.model';

/** Marge (px) laissée autour de la carte dépliée quand on la ramène dans la zone visible. */
const REVEAL_MARGIN = 12;

/** Le tapis : deux rangs de cartes rangées automatiquement, les héros et alliés en bas, face aux autres
 * personnages en haut (« Présents dans la scène » en mode libre, « Adversaires » en combat). Au milieu :
 * le bandeau « Dernier jet » en mode libre, la barre d'action de la carte active en combat — où un clic
 * sur une carte désignable demande une attaque. La carte dépliée prend la place de sa face ; dans le rang
 * du bas elle grandit vers le haut. Ne parle à aucun service : il lit seulement l'état du glisser de la
 * réserve (`dragging`, `hoverCamp`) pour dessiner ses zones de dépôt, repérées par `data-drop-camp`. */
@Component({
  selector: 'bol-tapis',
  imports: [CdkDrag, CdkDragPreview, CdkDropList, NgTemplateOutlet, CharacterCardComponent, ExpandedCardComponent, ActionBarComponent, DwScrollerComponent],
  templateUrl: './tapis.html',
  styleUrl: './tapis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TapisComponent {
  private readonly placement = inject(ReservePlacementService);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  /** Clé de la carte dépliée — une seule à la fois. */
  readonly expandedKey = input<string | null>(null);
  readonly hero = input<ExpandedHeroData | null>(null);
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);

  readonly mode = input<'libre' | 'combat'>('libre');
  /** État de chaque carte dans le combat — `null` en mode libre. */
  readonly combatStates = input<ReadonlyMap<string, CardCombatState> | null>(null);
  /** Carte dont c'est le tour — `null` en mode libre ou quand plus personne ne peut jouer. */
  readonly activeCard = input<TapisCard | null>(null);
  /** Armes du héros actif, pour la barre d'action. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);

  readonly cardToggled = output<TapisCard>();
  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly removeRequested = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Un clic sur une armure du popover d'un héros : la carte et l'id de l'armure à équiper ou déséquiper. */
  readonly armureToggled = output<{card: TapisCard; armureId: number}>();
  /** Un clic sur une arme du popover d'un héros : la carte et l'id de l'arme à équiper ou déséquiper. */
  readonly armeToggled = output<{card: TapisCard; armeId: number}>();
  readonly attackRequested = output<TapisCard>();
  readonly choiceChanged = output<AttackChoice | null>();
  readonly totalDefenseRequested = output<void>();
  readonly endTurnRequested = output<void>();

  /** Les zones de dépôt qui s'allument pendant un glisser : pas celle d'où part une carte, ni celle des adversaires
   * pour un héros. */
  protected readonly adversairesDroppable = computed(
    () => this.placement.dragging() && this.placement.originCamp() !== 'adversaires' && this.placement.adversairesDroppable(),
  );
  protected readonly herosDroppable = computed(() => this.placement.dragging() && this.placement.originCamp() !== 'heros');
  protected readonly hotCamp = this.placement.hoverCamp;
  protected readonly rows = computed(() => splitRows(this.cards()));
  protected readonly presentsLabel = computed(() => (this.mode() === 'combat' ? 'Adversaires' : 'Présents dans la scène'));

  /** Dernière carte dépliée, pour rendre le focus à sa face quand elle se replie. */
  private previousKey: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const key = this.expandedKey();
      // La fiche d'un héros arrive après l'ouverture et allonge la carte : on la ramène dans la vue à ce moment aussi.
      this.hero();
      if (key === null && this.previousKey !== null) {
        document.getElementById(`chc-${this.previousKey}`)?.focus();
      }
      this.previousKey = key;
      if (key !== null) {
        this.revealExpandedCard();
      }
    });
  }

  /** Ramène la carte dépliée dans la zone visible : d'abord dans la piste de son rang (le dernier élément
   * d'un rang qui défile se déplierait sinon coupé), puis dans le tapis lui-même (carte haute).
   * Pas de `scrollIntoView` : il ferait aussi défiler la page entière, dont le débordement est masqué. */
  private revealExpandedCard(): void {
    const card = document.querySelector('bol-expanded-card');
    if (!card) {
      return;
    }
    const item = card.getBoundingClientRect();
    const track = card.closest<HTMLElement>('.dws-track');
    if (track) {
      const view = track.getBoundingClientRect();
      const delta = revealDelta(item.left, item.right, view.left, view.right, REVEAL_MARGIN);
      if (delta !== 0) {
        track.scrollTo({left: track.scrollLeft + delta, behavior: 'instant'});
      }
    }
    const tapis = card.closest<HTMLElement>('.tps');
    if (tapis) {
      const view = tapis.getBoundingClientRect();
      const delta = revealDelta(item.top, item.bottom, view.top, view.bottom, REVEAL_MARGIN);
      if (delta !== 0) {
        tapis.scrollTo({top: tapis.scrollTop + delta, behavior: 'instant'});
      }
    }
  }

  /** Seules les cartes d'un PNJ, d'une créature ou d'un démon changent de camp, hors combat et repliées. */
  protected canChangeCamp(card: TapisCard): boolean {
    return this.mode() === 'libre' && card.kind !== 'hero' && card.key !== this.expandedKey();
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
  protected onFaceClick(card: TapisCard): void {
    if (this.stateOf(card)?.targetable) {
      this.attackRequested.emit(card);
    } else {
      this.cardToggled.emit(card);
    }
  }

  /** « Attaquer cette carte » sur la carte dépliée : en combat, pour toute carte qui n'est ni la
   * carte active ni hors combat. */
  protected canAttack(card: TapisCard): boolean {
    const active = this.activeCard();
    return this.mode() === 'combat' && active !== null && active.key !== card.key && !this.stateOf(card)?.out;
  }
}
