import {NgTemplateOutlet} from '@angular/common';
import {afterRenderEffect, ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {LastRoll} from '../../action-roll.util';
import {AttackChoice} from '../../attack-options.util';
import {ActionBarComponent} from './action-bar';
import {CharacterCardComponent} from './character-card';
import {CardCombatState} from './combat-turn.util';
import {ExpandedCardComponent, ExpandedHeroData} from './expanded-card';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {splitRows, TapisCard} from './tapis.util';

/** Le tapis : deux rangs de cartes rangées automatiquement, les héros et alliés en bas, face aux autres
 * personnages en haut (« Présents dans la scène » en mode libre, « Adversaires » en combat). Au milieu :
 * le bandeau « Dernier jet » en mode libre, la barre d'action de la carte active en combat — où un clic
 * sur une carte désignable demande une attaque. La carte dépliée prend la place de sa face ; dans le rang
 * du bas elle grandit vers le haut. Ne parle à aucun service. */
@Component({
  selector: 'bol-tapis',
  imports: [NgTemplateOutlet, CharacterCardComponent, ExpandedCardComponent, ActionBarComponent, DwScrollerComponent],
  templateUrl: './tapis.html',
  styleUrl: './tapis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TapisComponent {
  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  /** Clé de la carte dépliée — une seule à la fois. */
  readonly expandedKey = input<string | null>(null);
  readonly hero = input<ExpandedHeroData | null>(null);
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);
  readonly lastRoll = input<LastRoll | null>(null);

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
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  readonly fullSheetRequested = output<TapisCard>();
  readonly attackRequested = output<TapisCard>();
  readonly choiceChanged = output<AttackChoice | null>();
  readonly totalDefenseRequested = output<void>();
  readonly endTurnRequested = output<void>();

  protected readonly rows = computed(() => splitRows(this.cards()));
  protected readonly presentsLabel = computed(() => (this.mode() === 'combat' ? 'Adversaires' : 'Présents dans la scène'));

  /** Dernière carte dépliée, pour rendre le focus à sa face quand elle se replie. */
  private previousKey: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const key = this.expandedKey();
      if (key === null && this.previousKey !== null) {
        document.getElementById(`chc-${this.previousKey}`)?.focus();
      }
      this.previousKey = key;
      if (key !== null) {
        // La carte dépliée est haute : elle est ramenée dans la zone visible du tapis.
        document.querySelector('bol-expanded-card')?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
      }
    });
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
