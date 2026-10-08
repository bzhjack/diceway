import {ChangeDetectionStrategy, Component, input, output, viewChild} from '@angular/core';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {AttackChoice} from '../../models/attack-options.model';
import {ResolvedCombatStats} from '../../models/combat-attack.model';
import {TapisCard} from '../../models/tapis.model';
import {TurnOrderEntry} from '../../models/turn-order.model';
import {CombatSideComponent} from '../side/combat-side';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {AppliedHit, TurnAssistantComponent} from '../tapis/turn-assistant';
import {TurnOrderComponent} from '../tapis/turn-order';

/** L'écran du mode combat : la barre et la frise d'initiative en haut, puis l'assistant de tour à gauche et les
 * héros avec le journal à droite. Il ne porte aucun état : la page lui donne tout et reçoit chaque action. */
@Component({
  selector: 'bol-combat-board',
  imports: [TurnOrderComponent, TurnAssistantComponent, CombatSideComponent, DiceBoxHostComponent],
  templateUrl: './combat-board.html',
  styleUrl: './combat-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatBoardComponent {
  /** Plateau de dés 3D qui couvre tout l'écran de combat ; l'assistant y lance ses jets. */
  protected readonly diceBox = viewChild(DiceBoxHostComponent);

  // Frise
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  readonly title = input('');
  readonly legendaryActive = input(false);
  readonly announcement = input('');
  // Assistant de tour : `null` quand plus personne ne peut jouer
  readonly activeCard = input<TapisCard | null>(null);
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);
  readonly targets = input<readonly TapisCard[]>([]);
  readonly target = input<TapisCard | null>(null);
  readonly attacker = input<ResolvedCombatStats | null>(null);
  readonly targetStats = input<ResolvedCombatStats | null>(null);
  readonly legendaryBonus = input(false);
  // Colonne de droite
  readonly heroes = input<readonly TapisCard[]>([]);
  readonly log = input<readonly string[]>([]);

  readonly gaveBack = output<string>();
  readonly addRequested = output<void>();
  readonly delayRequested = output<void>();
  readonly rerollRequested = output<void>();
  readonly endTurnRequested = output<void>();
  readonly choiceChanged = output<AttackChoice | null>();
  readonly targetSelected = output<TapisCard>();
  readonly damageApplied = output<AppliedHit>();
  readonly totalDefenseRequested = output<void>();
}
