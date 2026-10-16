import {ChangeDetectionStrategy, Component, input, output, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ActionRollCarriere} from '../../models/action-roll.model';
import {AttackChoice} from '../../models/attack-options.model';
import {AppliedHit, HeroismeChange, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {TapisCard} from '../../models/tapis.model';
import {TurnOrderEntry, TurnOrderInterrupter} from '../../models/turn-order.model';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {TurnAssistantComponent} from '../tapis/turn-assistant';
import {TurnOrderComponent} from '../tapis/turn-order';

/** L'écran du mode combat : la barre et la frise d'initiative en haut, puis l'assistant de tour à gauche et les
 * héros avec le journal à droite. Il ne porte aucun état : la page lui donne tout et reçoit chaque action. */
@Component({
  selector: 'bol-combat-board',
  imports: [MatButtonModule, TurnOrderComponent, TurnAssistantComponent, DiceBoxHostComponent],
  templateUrl: './combat-board.html',
  styleUrl: './combat-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatBoardComponent {
  /** Plateau de dés 3D qui couvre tout l'écran de combat ; l'assistant y lance ses jets. */
  protected readonly diceBox = viewChild(DiceBoxHostComponent);
  protected readonly assistant = viewChild(TurnAssistantComponent);

  // Frise
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  readonly legendaryActive = input(false);
  readonly announcement = input('');
  readonly interrupters = input<readonly TurnOrderInterrupter[]>([]);
  /** Un camp n'a plus personne debout : le combat est gagné (`victoire`) ou perdu (`defaite`). */
  readonly outcome = input<'victoire' | 'defaite' | null>(null);
  // Assistant de tour : `null` quand plus personne ne peut jouer
  readonly activeCard = input<TapisCard | null>(null);
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  readonly ownedArmes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);
  readonly targets = input<readonly TapisCard[]>([]);
  readonly target = input<TapisCard | null>(null);
  readonly attacker = input<ResolvedCombatStats | null>(null);
  readonly targetStats = input<ResolvedCombatStats | null>(null);
  readonly targetsStats = input<ReadonlyMap<string, ResolvedCombatStats>>(new Map());
  readonly legendaryBonus = input(false);
  readonly effets = input<readonly CombatEffect[]>([]);
  readonly carrieres = input<readonly ActionRollCarriere[]>([]);
  /** Un héros mourant, du camp de la carte active, peut être secouru. */
  readonly canRescue = input(false);

  readonly gaveBack = output<string>();
  readonly interruptRequested = output<string>();
  /** « Terminer le combat » depuis le bandeau de fin. */
  readonly endCombatRequested = output<void>();
  readonly addRequested = output<void>();
  readonly delayRequested = output<void>();
  readonly rerollRequested = output<void>();
  /** `true` quand la fin du tour suit un coup qu'on vient de conclure (voir l'assistant). */
  readonly endTurnRequested = output<boolean>();
  readonly choiceChanged = output<AttackChoice | null>();
  readonly targetSelected = output<TapisCard | null>();
  readonly sheetRequested = output<TapisCard>();
  readonly attackRolled = output<TapisCard>();
  readonly effectRemoved = output<string>();
  readonly effectAdded = output<NewEffect>();
  readonly damageApplied = output<AppliedHit>();
  readonly totalDefenseRequested = output<void>();
  readonly rescueRequested = output<void>();
  /** Points d'héroïsme dépensés ou gagnés par la carte active sur son jet d'attaque. */
  readonly heroismeAdjusted = output<number>();
  /** Vitalité de la carte active ou de sa cible corrigée à la main sur son cœur. */
  readonly vitaliteAdjusted = output<VitaliteChange>();
  /** Points d'héroïsme dépensés par la cible pour se défendre (parade in extremis, « Juste une égratignure »). */
  readonly targetHeroismeAdjusted = output<HeroismeChange>();

  /** « Fin du tour » au clavier : l'assistant retient d'abord un coup qui a touché sans être appliqué. */
  requestEndTurn(): void {
    const assistant = this.assistant();
    if (assistant) {
      assistant.requestEndTurn();
    } else {
      this.endTurnRequested.emit(false);
    }
  }
}
