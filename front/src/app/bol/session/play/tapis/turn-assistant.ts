import {ChangeDetectionStrategy, Component, inject, input, output, ViewEncapsulation} from '@angular/core';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {ActionRollCarriere} from '../../models/action-roll.model';
import {AttackChoice} from '../../models/attack-options.model';
import {AppliedHit, AttackRolled, HeroismeChange, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {TapisCard} from '../../models/tapis.model';
import {RessourceChange} from '../../models/magie-combat.model';
import {TasAttaqueComponent} from './tas-attaque';
import {TasAttaquantComponent} from './tas-attaquant';
import {TasCibleComponent} from './tas-cible';
import {TasDegatsComponent} from './tas-degats';
import {TasSortComponent} from './tas-sort';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnDamageStore} from './turn-damage.store';
import {TurnCibleStore} from './turn-cible.store';
import {TurnFlowStore} from './turn-flow.store';

/** L'assistant de tour, sous la frise en combat : un registre. Sur une ligne, qui attaque, avec tout ce qui prépare son coup : sa vie, ses
 * points, ses chiffres et ce que dit le MJ ; sa posture et sa manœuvre ; ses armes ; puis ce qu'il peut faire au lieu d'attaquer, et la fin
 * de son tour. Dessous, la cible, puis une ligne par étape — le jet d'attaque (2d6 + bonus − défense, 9+), le jet de dégâts — dont celle
 * où il faut agir s'allume. La formule de chaque jet reste à l'écran ; les actions sont en bout de ligne.
 * Il annonce ce qu'il faut aux dés et les chances, prend les totaux lancés à table, et montre sur la vie de la cible ce que le coup va
 * lui retirer. Pour un héros, le jet d'attaque ouvre les usages de l'héroïsme : faveur divine après un coup raté, échec critique sur un
 * double 1, succès héroïque acheté sur un coup qui touche, succès légendaire sur un double 6 — avec leurs options de combat.
 * Il ne parle à aucun service : il signale à la page ce qui doit être enregistré (dégâts, fin de tour, défense totale, héroïsme). */
@Component({
  selector: 'bol-turn-assistant',
  imports: [TasAttaquantComponent, TasCibleComponent, TasAttaqueComponent, TasSortComponent, TasDegatsComponent],
  // L'état du tour, une instance par assistant : ses quatre blocs le partagent.
  providers: [TurnContextStore, TurnLoadoutStore, TurnAttackStore, TurnDamageStore, TurnCibleStore, TurnFlowStore],
  templateUrl: './turn-assistant.html',
  styleUrls: ['./turn-assistant.scss', './turn-assistant-colonnes.scss', './turn-assistant-attaquant.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'tas-scope'},
  // Une seule feuille pour les quatre blocs : ses classes `tas-*` sont propres à l'assistant, sous `.tas-scope`.
  encapsulation: ViewEncapsulation.None,
})
export class TurnAssistantComponent {
  readonly card = input.required<TapisCard>();
  /** Armes du héros actif — vide pour un PNJ, une créature ou un démon, ou tant qu'elles chargent. */
  readonly armes = input<readonly BolHerosArmeModel[]>([]);
  /** Toutes les armes du héros, équipées ou non : l'arme secondaire du combat à deux armes se choisit parmi elles. */
  readonly ownedArmes = input<readonly BolHerosArmeModel[]>([]);
  readonly combatOptions = input<readonly BolCombatOptionModel[]>([]);
  /** Cartes que la carte active peut viser : le camp d'en face, hors combat exclu. */
  readonly targets = input<readonly TapisCard[]>([]);
  readonly target = input<TapisCard | null>(null);
  /** Statistiques résolues de l'attaquant et de la cible (défense totale de la cible déjà ajoutée). */
  readonly attacker = input<ResolvedCombatStats | null>(null);
  readonly targetStats = input<ResolvedCombatStats | null>(null);
  /** Statistiques de chaque carte visable (clé de carte → statistiques) : son jeton annonce ce qu'il faut pour la toucher. */
  readonly targetsStats = input<ReadonlyMap<string, ResolvedCombatStats>>(new Map());
  /** Un héros a obtenu un succès légendaire : +1 aux jets d'attaque de l'attaquant s'il est du camp des héros. */
  readonly legendaryBonus = input(false);
  /** Les effets en cours (registre du combat) : leurs modificateurs entrent dans les jets. */
  readonly effets = input<readonly CombatEffect[]>([]);
  /** Plateau de dés 3D de l'écran de combat : les dés roulent par-dessus tout l'écran. Sans lui, les dés sont tirés sans animation. */
  readonly diceBox = input<DiceBoxHostComponent | null>(null);
  /** Carrières de l'attaquant (un héros) : le MJ peut en laisser une aider une manœuvre ou une feinte. */
  readonly carrieres = input<readonly ActionRollCarriere[]>([]);
  /** Un héros mourant du camp de la carte active peut être secouru : « Secourir » s'affiche. */
  readonly canRescue = input(false);
  /** Les piétailles de son camp qui peuvent se joindre à l'attaque de la carte active, une piétaille : elles attaquent en horde. */
  readonly hordeMates = input<readonly TapisCard[]>([]);
  /** Les êtres que la carte active peut voir, des deux camps : un prêtre leur donne un dé de foi. */
  readonly visibles = input<readonly TapisCard[]>([]);
  /** Le round en cours : avec la carte, il dit quel tour se joue. Une carte qui joue deux tours de suite (dernière au round N après avoir
   * retardé, première au round N+1) repart ainsi d'un tour neuf. */
  readonly round = input(0);

  readonly choiceChanged = output<AttackChoice | null>();
  /** Les piétailles engagées dans la horde : leur tour finit avec celui de la carte active. */
  readonly hordeChanged = output<readonly string[]>();
  /** La carte choisie comme cible, ou `null` pour « Changer d'adversaire ». */
  readonly targetSelected = output<TapisCard | null>();
  /** Ouvrir la fiche complète (statbloc) d'un des deux duellistes. */
  readonly sheetRequested = output<TapisCard>();
  readonly attackRolled = output<AttackRolled>();
  readonly effectRemoved = output<string>();
  readonly effectAdded = output<NewEffect>();
  readonly damageApplied = output<AppliedHit>();
  /** « Fin du tour » en défense totale ; `true` avec la parade du combat à deux armes, qui se cumule. */
  readonly totalDefenseRequested = output<boolean>();
  /** « Retarder » : la carte active joue en dernier ce round. */
  readonly delayRequested = output<void>();
  /** « Secourir » : la carte active tente de stabiliser un héros mourant, à la place de son attaque. */
  readonly rescueRequested = output<void>();
  /** « Fin du tour ». `true` quand il suit un coup qu'on vient de conclure : la fin du tour attend alors l'enregistrement des effets
   * du coup, au lieu d'être ignorée comme un double clic. */
  readonly endTurnRequested = output<boolean>();
  /** Points d'héroïsme dépensés (négatif) ou gagnés (positif) par l'attaquant sur ce jet. */
  readonly heroismeAdjusted = output<number>();
  /** Vitalité de l'attaquant ou de la cible corrigée à la main sur son cœur, ou rendue par « Juste une égratignure ». */
  readonly vitaliteAdjusted = output<VitaliteChange>();
  /** Points d'héroïsme dépensés par la cible, un héros : parade in extremis, « Juste une égratignure ». */
  readonly targetHeroismeAdjusted = output<HeroismeChange>();
  /** Points de foi (un dé de foi) ou de pouvoir (un sort) dépensés ou rendus par l'attaquant ou la cible. */
  readonly ressourceAdjusted = output<RessourceChange>();

  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly flow = inject(TurnFlowStore);
  protected readonly attack = inject(TurnAttackStore);

  constructor() {
    this.turn.connect(this);
  }

  /** Retire les dés restés sur la table une fois le lancer terminé (un clic n'importe où sur l'écran de combat). */
  dismissDice(): void {
    this.turn.dismissDice();
  }

  /** « Fin du tour » (bouton ou touche F). */
  requestEndTurn(): void {
    this.flow.requestEndTurn();
  }
}
