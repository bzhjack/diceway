import {ChangeDetectionStrategy, Component, input, output, viewChild} from '@angular/core';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ActionRollCarriere} from '../../models/action-roll.model';
import {AttackChoice} from '../../models/attack-options.model';
import {AppliedHit, HeroismeChange, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {TapisCard} from '../../models/tapis.model';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {TurnAssistantComponent} from '../tapis/turn-assistant';
import {DeMj} from '../../models/combat-turn.model';

/** L'écran du mode combat : l'assistant de tour, sous les dés 3D (l'ordre d'action est dans l'en-tête de la page). Il ne porte aucun
 * état : la page lui donne tout et reçoit chaque action. */
@Component({
  selector: 'bol-combat-board',
  imports: [TurnAssistantComponent, DiceBoxHostComponent],
  templateUrl: './combat-board.html',
  styleUrl: './combat-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatBoardComponent {
  /** Plateau de dés 3D qui couvre tout l'écran de combat ; l'assistant y lance ses jets. */
  protected readonly diceBox = viewChild(DiceBoxHostComponent);
  protected readonly assistant = viewChild(TurnAssistantComponent);

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
  /** Le dé du MJ pour tous (options du combat), transmis à l'assistant de tour. */
  readonly deMj = input<DeMj | null>(null);
  readonly carrieres = input<readonly ActionRollCarriere[]>([]);
  /** Un héros mourant, du camp de la carte active, peut être secouru. */
  readonly canRescue = input(false);
  /** Les piétailles qui peuvent se joindre à l'attaque de la carte active, en horde. */
  readonly hordeMates = input<readonly TapisCard[]>([]);

  readonly delayRequested = output<void>();
  /** `true` quand la fin du tour suit un coup qu'on vient de conclure (voir l'assistant). */
  readonly endTurnRequested = output<boolean>();
  readonly choiceChanged = output<AttackChoice | null>();
  /** Les piétailles engagées dans la horde de la carte active. */
  readonly hordeChanged = output<readonly string[]>();
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
