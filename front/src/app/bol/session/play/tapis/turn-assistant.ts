import {afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, Injector, input, linkedSignal, output, signal, untracked, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {ActionDiceTargetLabel, ActionRollTone, RollSumTerm} from '../../models/action-roll.model';
import {CombatEffect, ModifierTerm, NewEffect} from '../../models/combat-effect.model';
import {actionDiceTarget, actionDiceTargetLabel, actionSuccessChance, chanceRingDash, keepBestOrWorstTwo, parseDiceTotal} from '../../action-roll.util';
import {descriptionEffet, doitUnDeDeMalus, libelleDuree, modificateursPour, POSTURE_DEFENSE, sansTerme, sommeModificateurs} from './combat-effects.util';
import {EffectsListComponent} from './effects-list';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ARME_IMPROVISEE, DUAL_WIELD_SLUGS, filterAttackMenuCombatOptions, filterVisiblePostures, isDualWieldWeapon, MAINS_NUES} from '../../attack-options.util';
import {dualStrikeDegats} from '../../combat-attack.util';
import {
  ATTACK_THRESHOLD,
  attackBonus,
  computeAttackTotal,
  DamageDie,
  damageDiceCount,
  damageDie,
  damageDieMax,
  damageRange,
  finalDamage,
  HEROIC_OPTIONS,
  rawDamage,
  resolvePostureAttackModifier,
  rollD6,
  suggestedAttackResult,
  vigueurBonus,
} from '../../combat-resolution.util';
import {AttackChoice} from '../../models/attack-options.model';
import {AppliedHit, ResolvedCombatStats} from '../../models/combat-attack.model';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {TapisCard} from '../../models/tapis.model';
import {isLowVitalite, vitalitePercent} from './tapis.util';

/** Délai maximal d'un lancer 3D avant de tirer les dés sans animation. */
const DICE_TIMEOUT_MS = 12000;

/** Les postures de l'échelle, de la plus prudente à la plus audacieuse ; les autres sont des options spéciales. */
const SCALE_SLUGS: readonly string[] = ['defensive', 'none', 'offensive', 'intrepid'];

/** Ce que rapporte chaque dé de dégâts, en clair, à côté de la case où on le saisit. */
const DIE_NOTES: Readonly<Record<DamageDie, string>> = {
  d3: 'un d6 divisé par deux',
  d6: 'un d6',
  d6m: 'le moins bon de deux d6',
  d6b: 'le meilleur de deux d6',
};

/** Où en est une des trois cases du coup : pas encore son tour, à jouer, ou faite. */
type StationState = 'todo' | 'cur' | 'done';

/** Un chiffre de combat et son libellé : dans la ligne de l'attaquant, ou en tuile sur la fiche de la cible. */
interface StatTile {
  readonly label: string;
  readonly value: string;
  /** La posture choisie améliore (`up`) ou dégrade (`down`) ce chiffre. */
  readonly tone?: 'up' | 'down';
  /** Vitalité : un cœur précède le chiffre. */
  readonly heart?: boolean;
  /** Vitalité : le maximum suit le libellé (« Vitalité /10 »). */
  readonly max?: string;
}

/** Un terme de l'addition d'un jet sur le plateau. */
interface TraySumTerm extends RollSumTerm {
  /** Effet du registre dont le terme vient : sa croix le retire. */
  readonly effetId?: string;
  /** Le terme se clique pour saisir sa valeur à la main (protection de la cible). */
  readonly editable?: boolean;
}

/** Ce qu'il faut aux dés pour toucher, et les chances d'y arriver. */
interface AttackGoal extends ActionDiceTargetLabel {
  readonly chance: number;
  readonly ringDash: string;
}

/** Le verdict du jet d'attaque : son titre, l'écart au seuil, sa couleur. */
interface AttackVerdict {
  readonly title: string;
  readonly detail: string;
  readonly tone: ActionRollTone;
}

/** La barre de vie d'une carte, en pourcentages : ce qu'il lui reste, et ce que le coup en cours va lui retirer. */
interface LifeBar {
  readonly rest: number;
  readonly loss: number;
  readonly low: boolean;
}

/** Typographie d'un terme signé : « +2 », « −1 ». */
function signedTerm(value: number): string {
  return `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
}

/** L'assistant de tour, sous la frise en combat : un coup en trois temps. Trois cartes portent les réglages de la carte active — qui
 * attaque (ses chiffres, les effets en cours, la fin de son tour), avec quoi (arme, distance), comment (posture, options) ; dessous,
 * sur la même grille, trois cases — qui elle vise, son jet d'attaque (2d6 + bonus − défense, 9+), son jet de dégâts — dont celle où
 * il faut agir s'allume, et une ligne qui dit quoi faire ensuite.
 * Il annonce ce qu'il faut aux dés et les chances, prend les totaux lancés à table, et montre sur la vie de la cible ce que le coup va
 * lui retirer. Il ne parle à aucun service : il signale à la page ce qui doit être enregistré (dégâts, fin de tour, défense totale). */
@Component({
  selector: 'bol-turn-assistant',
  imports: [EffectsListComponent, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './turn-assistant.html',
  styleUrl: './turn-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  readonly choiceChanged = output<AttackChoice | null>();
  /** La carte choisie comme cible, ou `null` pour « Changer d'adversaire ». */
  readonly targetSelected = output<TapisCard | null>();
  /** Ouvrir la fiche complète (statbloc) d'un des deux duellistes. */
  readonly sheetRequested = output<TapisCard>();
  readonly attackRolled = output<TapisCard>();
  readonly effectRemoved = output<string>();
  readonly effectAdded = output<NewEffect>();
  readonly damageApplied = output<AppliedHit>();
  readonly totalDefenseRequested = output<void>();
  /** « Fin du tour » depuis le plateau, après un coup raté ou des dégâts appliqués. */
  readonly endTurnRequested = output<void>();

  protected readonly heroicOptions = HEROIC_OPTIONS;
  protected readonly isHero = computed(() => this.card().kind === 'hero');
  /** Les options de succès héroïque (dont « Massacrer la piétaille ») sont celles des héros : leurs alliés y ont droit, pas leurs adversaires. */
  protected readonly heroicAllowed = computed(() => this.card().camp === 'heros');

  // ── Étape 1 : arme, posture, arme secondaire — repartent de zéro à chaque nouvelle carte active ──
  /** Un héros attaque avec ses armes équipées, les mains nues ou une arme improvisée ; un PNJ avec n'importe laquelle de ses armes. */
  protected readonly displayArmes = computed(() => (this.isHero() ? [...this.armes(), MAINS_NUES, ARME_IMPROVISEE] : this.armes()));
  // La source est la clé de la carte (`cardKey`), pas la carte : la table rechargée repasse une carte identique mais neuve, qui remettrait
  // ces choix à zéro — et, avec eux, le jet en cours.
  private readonly selectedArmeId = linkedSignal<string, number | null>({source: () => this.cardKey(), computation: () => null});
  private readonly selectedOptionSlug = linkedSignal<string, string | null>({source: () => this.cardKey(), computation: () => null});
  private readonly selectedOffHandId = linkedSignal<string, number | null>({source: () => this.cardKey(), computation: () => null});

  protected readonly effectiveArme = computed(() => {
    const list = this.displayArmes();
    return list.find((a) => a.id === this.selectedArmeId()) ?? list[0] ?? null;
  });

  /** L'arme secondaire d'un héros se prend parmi toutes ses armes légères ou moyennes, équipées ou non : « équipée » dit
   * seulement ce que le héros propose à l'attaque, pas ce qu'il a en main pour parer ou frapper à deux armes. */
  protected readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    const candidates = this.isHero() ? this.ownedArmes() : this.displayArmes();
    return candidates.filter((a) => a.id !== mainId && isDualWieldWeapon(a));
  });

  protected readonly visibleOptions = computed(() => {
    // Les options de combat sont facultatives (02-actions-combat.md) : créatures et démons, qui n'ont qu'une attaque, n'en ont pas.
    if (this.card().kind === 'creature' || this.card().kind === 'demon') {
      return [];
    }
    const options = filterAttackMenuCombatOptions(this.combatOptions());
    if (!this.isHero()) {
      return options.filter((o) => !DUAL_WIELD_SLUGS.has(o.slug));
    }
    const otherDegats = this.eligibleOffHandArmes().map((a) => a.arme?.degats ?? null);
    // L'arme principale doit elle aussi être une vraie arme légère ou moyenne : mains nues et arme improvisée ne comptent pas.
    const main = this.effectiveArme();
    return filterVisiblePostures(options, main && isDualWieldWeapon(main) ? (main.arme?.degats ?? null) : null, otherDegats);
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.visibleOptions();
    return list.find((o) => o.slug === this.selectedOptionSlug()) ?? list[0] ?? null;
  });

  /** Les trois postures simples plus « Aucune », dans l'ordre de l'échelle. */
  protected readonly scalePostures = computed(() =>
    SCALE_SLUGS.map((slug) => this.visibleOptions().find((o) => o.slug === slug)).filter((o): o is BolCombatOptionModel => !!o),
  );

  /** Combat à deux armes, attaque au défaut de l'armure : des options qui se cochent, en plus de la posture. */
  protected readonly specialPostures = computed(() => this.visibleOptions().filter((o) => !SCALE_SLUGS.includes(o.slug)));

  /** « Posture offensive » → « Offensive », « Attaque intrépide » → « Intrépide ». */
  protected scaleName(option: BolCombatOptionModel): string {
    const short = option.label.replace(/^(Posture|Attaque) /, '');
    return short.charAt(0).toUpperCase() + short.slice(1);
  }

  /** « att +1 · déf −1 » : le bonus d'attaque du référentiel et l'effet connu sur la défense. */
  protected scaleEffect(option: BolCombatOptionModel): string {
    return `att ${this.signed(option.modificateur)} · déf ${this.signed(POSTURE_DEFENSE[option.slug] ?? 0)}`;
  }

  /** Une option spéciale se coche et se décoche ; décochée, on revient à « Aucune ». */
  protected toggleSpecial(slug: string): void {
    this.selectOption(this.effectiveOption()?.slug === slug ? 'none' : slug);
  }

  protected readonly isDualWieldSelected = computed(() => DUAL_WIELD_SLUGS.has(this.effectiveOption()?.slug ?? ''));

  protected readonly effectiveOffHand = computed(() => {
    const list = this.eligibleOffHandArmes();
    return list.find((a) => a.id === this.selectedOffHandId()) ?? list[0] ?? null;
  });

  /** Ce avec quoi la carte attaque — `null` si une posture à deux armes est choisie sans arme secondaire jouable. */
  private readonly choice = computed<AttackChoice | null>(() => {
    if (this.isDualWieldSelected() && !this.effectiveOffHand()) {
      return null;
    }

    const option = this.effectiveOption();
    const mainDegats = this.effectiveArme()?.arme?.degats ?? null;
    const offHand = this.effectiveOffHand();
    const degats = option?.slug === 'dual-strike' && offHand ? dualStrikeDegats(mainDegats, offHand.arme?.degats) : mainDegats;

    return {degats, posture: option && option.slug !== 'none' ? option : null};
  });

  // Les clés, pas les objets : la table rechargée repasse des cartes identiques mais neuves, qui ne doivent pas effacer le jet en cours.
  private readonly cardKey = computed(() => this.card().key);
  private readonly targetKey = computed(() => this.target()?.key ?? null);
  private readonly choiceKey = computed(() => {
    const choice = this.choice();
    return choice ? `${this.effectiveArme()?.id ?? ''}|${this.effectiveOffHand()?.id ?? ''}|${choice.degats}|${choice.posture?.slug ?? ''}` : '';
  });

  // ── Étape 3 : le jet d'attaque ──
  /** Un combattant meilleur au tir qu'en mêlée part à distance. */
  private readonly prefersTir = computed(() => {
    const a = this.attacker();
    return !!a && a.attaque === null && a.tir > a.melee;
  });
  /** Mêlée ou tir, quand l'arme permet les deux : repart de la préférence du combattant à chaque nouvelle carte active, pas à chaque
   * relecture de ses statistiques. */
  protected readonly useTir = linkedSignal<{readonly key: string; readonly tir: boolean}, boolean>({
    source: () => ({key: this.cardKey(), tir: this.prefersTir()}),
    computation: (source) => source.tir,
  });
  /** Façons d'utiliser l'arme choisie : mêlée seulement (épée, mains nues), tir seulement (arc, javelot) ou les deux (arme qui se lance :
   * dague, hache, lance, arme improvisée) — la distance ne se choisit que dans ce dernier cas. */
  protected readonly distanceModes = computed<readonly ('melee' | 'tir')[]>(() => {
    const arme = this.effectiveArme();
    if (!arme) {
      return ['melee', 'tir'];
    }
    if (arme.id === MAINS_NUES.id) {
      return ['melee'];
    }
    if (arme.id === ARME_IMPROVISEE.id) {
      return ['melee', 'tir'];
    }
    if (arme.arme?.type === 'T') {
      return ['tir'];
    }
    const portee = arme.arme?.portee?.trim();
    return portee && portee !== '-' ? ['melee', 'tir'] : ['melee'];
  });

  /** L'attaque se fait à distance : imposée par l'arme quand elle n'a qu'un mode, sinon choisie dans l'assistant. */
  protected readonly isTir = computed(() => {
    const modes = this.distanceModes();
    return modes.length === 1 ? modes[0] === 'tir' : this.useTir();
  });

  /** L'attaquant porte l'effet « dé de malus à sa prochaine action » (posé à la main après un renversement, un coup précis…). */
  private readonly malusDieOwed = computed(() => doitUnDeDeMalus(this.effets(), this.card().key));
  /** Dé de bonus ou de malus accordé par le MJ pour cette attaque, selon les circonstances (attaquant ivre, adversaire à terre, arme
   * favorite…) : le jet se fait à 3d6, dont on garde les deux meilleurs ou les deux moins bons (02-actions-combat.md). L'un exclut
   * l'autre. À chaque nouvelle carte active il repart de zéro — ou du dé de malus, si la carte en doit un à sa prochaine action ; il
   * suit aussi cet effet quand on le pose ou qu'on le retire en cours de tour. */
  protected readonly gmDie = linkedSignal<{readonly key: string; readonly malus: boolean}, 'bonus' | 'malus' | null>({
    source: () => ({key: this.cardKey(), malus: this.malusDieOwed()}),
    computation: (source) => (source.malus ? 'malus' : null),
  });
  /** +1 avec un dé de bonus, −1 avec un dé de malus, 0 pour un jet à deux dés. */
  private readonly netDice = computed(() => (this.gmDie() === 'bonus' ? 1 : this.gmDie() === 'malus' ? -1 : 0));
  /** Nombre de dés du jet d'attaque : deux, ou trois avec le dé du MJ. */
  protected readonly diceCount = computed(() => 2 + Math.abs(this.netDice()));

  /** Les deux dés qui comptent : ceux du lancer, ou les deux gardés quand le MJ a accordé un dé. */
  protected readonly dice = signal<readonly [number, number] | null>(null);
  /** Tous les dés d'un lancer à l'écran à trois dés, pour dire lesquels sont gardés ; `null` sinon. */
  private readonly rolledDice = signal<readonly number[] | null>(null);
  protected readonly rolling = signal(false);

  /** Les chiffres de l'attaquant, en tuiles : attaque, défense, vigueur et vitalité. La défense montre déjà ce que la posture
   * choisie lui fera jusqu'à son prochain tour. */
  protected readonly attackerTiles = computed<readonly StatTile[]>(() => {
    const stats = this.attacker();
    if (!stats) {
      return [];
    }
    const card = this.card();
    const posture = POSTURE_DEFENSE[this.effectiveOption()?.slug ?? ''] ?? 0;
    return [
      {label: 'Attaque', value: this.signed(attackBonus(stats, this.isTir()))},
      {label: 'Défense', value: String(stats.defense + posture), ...(posture !== 0 ? {tone: posture > 0 ? ('up' as const) : ('down' as const)} : {})},
      {label: 'Vigueur', value: this.signed(vigueurBonus(stats, this.isTir()))},
      {label: 'Vitalité', value: String(card.vitaliteCourante ?? '—'), max: String(card.vitaliteMax ?? '—'), heart: true},
    ];
  });

  /** Fiche de la cible choisie : ce qui s'oppose au coup, sa défense et sa protection. */
  protected readonly targetTiles = computed<readonly StatTile[]>(() => {
    const stats = this.targetStats();
    if (!stats) {
      return [];
    }
    const armorIgnored = this.choice()?.posture?.slug === 'armor-chink';
    return [
      {label: 'Défense', value: String(stats.defense)},
      armorIgnored ? {label: 'Armure ignorée', value: '0', tone: 'up'} : {label: 'Protection', value: stats.protectionText ?? String(stats.protection)},
    ];
  });

  protected readonly manualTotal = signal<number | null>(null);
  protected readonly heroic = signal<string | null>(null);

  protected readonly degats = computed(() => this.choice()?.degats ?? this.attacker()?.degats ?? this.card().degats);
  protected readonly postureModifier = computed(() =>
    resolvePostureAttackModifier(this.choice()?.posture ?? null, this.targetStats()?.protection ?? 0),
  );

  /** Ce qui s'ajoute aux deux dés contre la cible choisie : bonus d'attaque − défense + posture + effets en cours. `null` sans cible. */
  protected readonly attackModifier = computed(() => {
    const a = this.attacker();
    const t = this.targetStats();
    if (!a || !t || !this.target()) {
      return null;
    }
    return computeAttackTotal(0, attackBonus(a, this.isTir()), t.defense, sommeModificateurs(this.effectTerms()), this.legendaryBonus() ? 1 : 0, this.postureModifier());
  });

  /** Ce qu'il faut aux dés pour toucher la cible choisie, et les chances. */
  protected readonly attackGoal = computed<AttackGoal | null>(() => {
    const modifier = this.attackModifier();
    return modifier === null ? null : this.goalFor(modifier);
  });

  private goalFor(modifier: number): AttackGoal {
    const net = this.netDice();
    const chance = Math.round(actionSuccessChance(net, modifier, ATTACK_THRESHOLD) * 100);
    const label = actionDiceTargetLabel(actionDiceTarget(modifier, ATTACK_THRESHOLD));
    // Avec le dé du MJ, le total à atteindre se lit sur les deux dés gardés.
    const small = net !== 0 && label.small === 'aux dés' ? this.keptCaption() : label.small;
    return {big: label.big, small, chance, ringDash: chanceRingDash(chance)};
  }

  /** Lesquels des trois dés comptent : « 2 meilleurs » ou « 2 moins bons » ; « dés » pour un jet à deux dés. */
  private keptCaption(): string {
    const net = this.netDice();
    return net > 0 ? '2 meilleurs' : net < 0 ? '2 moins bons' : 'dés';
  }

  /** Ce que les trois dés d'un lancer à l'écran ont donné : « 1, 5 et 2 → 5 et 2 gardés ». Vide pour deux dés ou une saisie à table. */
  protected readonly attackDetail = computed(() => {
    const values = this.rolledDice();
    const kept = this.dice();
    if (!values || values.length < 3 || !kept) {
      return '';
    }
    return `${values.slice(0, -1).join(', ')} et ${values[values.length - 1]} → ${kept[0]} et ${kept[1]} gardés`;
  });

  /** Sur le jeton de chaque carte visable, ce qu'il faut pour la toucher avec l'arme et la posture choisies : « 6+ · 72 % ». Absent tant
   * que ses statistiques ne sont pas connues. */
  protected readonly odds = computed<Readonly<Record<string, string>>>(() => {
    const a = this.attacker();
    const odds: Record<string, string> = {};
    if (!a) {
      return odds;
    }
    const selected = this.target()?.key;
    for (const card of this.targets()) {
      const stats = this.targetsStats().get(card.key);
      // La cible choisie reprend le calcul du plateau, modificateurs figés compris.
      const modifier =
        card.key === selected
          ? this.attackModifier()
          : stats
            ? computeAttackTotal(
                0,
                attackBonus(a, this.isTir()),
                stats.defense,
                sommeModificateurs(modificateursPour(this.effets(), {jet: 'attaque', attaquant: this.card().key, cible: card.key, bouclier: stats.bouclierMalusUneAttaque, bouclierToutes: stats.bouclierDefenseToutes})),
                this.legendaryBonus() ? 1 : 0,
                resolvePostureAttackModifier(this.choice()?.posture ?? null, stats.protection),
              )
            : null;
      if (modifier !== null) {
        const goal = this.goalFor(modifier);
        odds[card.key] = `${goal.big} · ${goal.chance} %`;
      }
    }
    return odds;
  });

  /** L'addition du jet d'attaque, sur une ligne : un nombre par terme, son nom dessous. Les termes nuls sont omis. Avant le jet elle
   * s'ouvre sur « 2d6 » et se ferme sur le seuil ; après, sur le total des dés et le total du jet. */
  protected readonly attackSum = computed<readonly TraySumTerm[]>(() => {
    const a = this.attacker();
    const t = this.targetStats();
    if (!a || !t) {
      return [];
    }
    const dice = this.diceSum();
    const terms: TraySumTerm[] = [{value: dice === null ? `${this.diceCount()}d6` : `${dice}`, caption: this.keptCaption(), tone: 'dice'}];
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    if (a.attaque !== null) {
      add(a.attaque, 'attaque');
    } else {
      add(a.agilite, 'agi');
      add(this.isTir() ? a.tir : a.melee, this.isTir() ? 'tir' : 'mêlée');
    }
    add(-t.defense, 'défense');
    add(this.postureModifier(), 'posture');
    add(this.legendaryBonus() ? 1 : 0, 'légendaire');
    terms.push(...this.effectTerms().map((term) => this.sumTermOf(term)));
    const total = this.total();
    terms.push(total === null ? {value: `≥ ${ATTACK_THRESHOLD}`, caption: 'seuil', tone: 'total'} : {value: `= ${total}`, caption: `pour ${ATTACK_THRESHOLD}`, tone: 'total'});
    return terms;
  });

  /** Un modificateur du registre (« − 1 bouclier (Krongar) ») en terme d'addition : sa valeur, puis son nom dessous. */
  private sumTermOf(term: ModifierTerm): TraySumTerm {
    return {value: signedTerm(term.valeur), caption: term.label.replace(/^[+−] \d+ /, ''), tone: term.tone, ...(term.effetId ? {effetId: term.effetId} : {})};
  }

  /** Clé → nom des deux duellistes : une puce dit à qui est l'effet. */
  private readonly noms = computed<Readonly<Record<string, string>>>(() => {
    const target = this.target();
    return {[this.card().key]: this.card().nom, ...(target ? {[target.key]: target.nom} : {})};
  });

  /** Les deux duellistes, pour nommer à qui appartient un effet et à qui l'ajouter. */
  protected readonly duelistes = computed(() => {
    const target = this.target();
    return [{key: this.card().key, nom: this.card().nom}, ...(target ? [{key: target.key, nom: target.nom}] : [])];
  });

  private badgesDe(key: string | undefined): readonly string[] {
    return key
      ? this.effets()
          .filter((effet) => effet.porteur === key && effet.valeur !== 0)
          .map((effet) => `${descriptionEffet(effet)} · ${libelleDuree(effet.duree)}`)
      : [];
  }
  protected readonly targetBadges = computed(() => this.badgesDe(this.target()?.key));

  /** L'addition du jet de dégâts : le dé de l'arme, la vigueur, le coup dévastateur, la protection de la cible (elle se clique pour la
   * saisir), les effets en cours, puis la fourchette des dégâts — et, le dé tombé, leur total. */
  protected readonly damageSum = computed<readonly TraySumTerm[]>(() => {
    const raw = this.raw();
    const terms: TraySumTerm[] = [{value: raw === null ? this.degats() : `${raw}`, caption: 'dé', tone: 'dice'}];
    const add = (value: number, caption: string): void => {
      if (value !== 0) {
        terms.push({value: signedTerm(value), caption, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    add(this.vigueur(), 'vigueur');
    add(this.devastating() ? 6 : 0, 'dévastateur');
    if (this.choice()?.posture?.slug === 'armor-chink') {
      terms.push({value: '0', caption: 'armure ignorée', tone: 'dice'});
    } else {
      const protection = this.protection();
      const source = this.protectionManual() !== null ? ' (saisie)' : this.protectionFace() !== null ? ` (dé ${this.protectionFace()})` : '';
      // Toujours affichée, même à 0 : c'est elle qu'on clique pour saisir une valeur.
      terms.push({value: protection === 0 ? '0' : signedTerm(-protection), caption: `protection${source}`, tone: 'minus', editable: true});
    }
    terms.push(...this.damageEffectTerms().map((term) => this.sumTermOf(term)));
    const damage = this.damage();
    if (damage === null) {
      const [min, max] = damageRange(this.die(), this.vigueur(), this.effectiveProtection(), this.devastating());
      terms.push({value: min === max ? `${min}` : `${min} à ${max}`, caption: 'dégâts', tone: 'total'});
    } else {
      terms.push({value: `= ${damage}`, caption: 'dégâts', tone: 'total'});
    }
    return terms;
  });

  /** Total des dés : lancés ici, ou saisis à la main (total à table, de 2 à 12). */
  protected readonly diceSum = computed(() => {
    const d = this.dice();
    if (d) {
      return d[0] + d[1];
    }
    return this.manualTotal();
  });

  /** Les modificateurs du registre pour ce jet, tels qu'ils sont au moment où on les lit. */
  private readonly liveTerms = computed<readonly ModifierTerm[]>(() => {
    const t = this.targetStats();
    const target = this.target();
    return target
      ? modificateursPour(this.effets(), {jet: 'attaque', attaquant: this.card().key, cible: target.key, bouclier: t?.bouclierMalusUneAttaque ?? 0, bouclierToutes: t?.bouclierDefenseToutes ?? 0, noms: this.noms()})
      : [];
  });

  /** Modificateurs figés au premier jet de cette attaque : la cible est ensuite marquée « attaquée » (son bouclier tombe du registre), mais un
   * jet relancé garde les siens. */
  private readonly frozenTerms = signal<readonly ModifierTerm[] | null>(null);
  protected readonly effectTerms = computed(() => this.frozenTerms() ?? this.liveTerms());

  /** Les modificateurs du registre pour le jet de dégâts (effets de dégâts de l'attaquant, protection de la cible), figés comme ceux de
   * l'attaque : un effet à usage limité consommé par le jet d'attaque compte encore pour ses dégâts. */
  private readonly liveDamageTerms = computed<readonly ModifierTerm[]>(() => {
    const target = this.target();
    return target ? modificateursPour(this.effets(), {jet: 'degats', attaquant: this.card().key, cible: target.key, bouclier: 0, bouclierToutes: 0, noms: this.noms()}) : [];
  });
  private readonly frozenDamageTerms = signal<readonly ModifierTerm[] | null>(null);
  private readonly damageEffectTerms = computed(() => this.frozenDamageTerms() ?? this.liveDamageTerms());

  protected readonly total = computed(() => {
    const sum = this.diceSum();
    const a = this.attacker();
    const t = this.targetStats();
    if (sum === null || !a || !t) {
      return null;
    }
    return computeAttackTotal(
      sum,
      attackBonus(a, this.isTir()),
      t.defense,
      sommeModificateurs(this.effectTerms()),
      this.legendaryBonus() ? 1 : 0,
      this.postureModifier(),
    );
  });

  private readonly naturalDice = computed<readonly [number, number] | null>(() => {
    const d = this.dice();
    if (d) {
      return d;
    }
    const manual = this.manualTotal();
    // Un total saisi de 2 ou 12 est un double naturel : les règles absolues s'appliquent.
    return manual === 2 ? [1, 1] : manual === 12 ? [6, 6] : null;
  });

  protected readonly isNatural12 = computed(() => {
    const d = this.naturalDice();
    return this.heroicAllowed() && !!d && d[0] === 6 && d[1] === 6;
  });

  protected readonly verdict = computed(() => {
    const d = this.naturalDice() ?? (this.diceSum() === null ? null : ([0, this.diceSum() as number] as const));
    const t = this.total();
    if (t === null || d === null) {
      return null;
    }
    const result = suggestedAttackResult([d[0], d[1]], t, ATTACK_THRESHOLD);
    return {result, hit: result === 'reussite' || result === 'heroique' || result === 'legendaire'};
  });

  /** Ton du résultat : réussite, échec ou succès héroïque (réservé aux héros et alliés). */
  protected readonly tone = computed<'reussite' | 'echec' | 'heroique' | null>(() => {
    const v = this.verdict();
    if (!v || this.total() === null) {
      return null;
    }
    if (!v.hit) {
      return 'echec';
    }
    return this.heroicAllowed() && (v.result === 'heroique' || v.result === 'legendaire') ? 'heroique' : 'reussite';
  });

  /** Le verdict en clair : touché ou raté, et de combien. Un double 1 rate et un double 6 touche quel que soit le total. */
  protected readonly attackVerdict = computed<AttackVerdict | null>(() => {
    const tone = this.tone();
    const total = this.total();
    if (!tone || total === null) {
      return null;
    }
    const d = this.naturalDice();
    if (tone === 'heroique') {
      return {title: 'Succès héroïque', detail: 'Double 6 : le coup touche, avec une option au choix.', tone};
    }
    if (tone === 'echec') {
      const double1 = !!d && d[0] === 1 && d[1] === 1;
      return {title: 'Raté', detail: double1 ? 'Double 1 : échec automatique.' : `il manquait ${ATTACK_THRESHOLD - total}`, tone};
    }
    const double6 = !!d && d[0] === 6 && d[1] === 6;
    return {title: 'Touché', detail: double6 ? 'Double 6 : réussite automatique.' : total > ATTACK_THRESHOLD ? `réussi de ${total - ATTACK_THRESHOLD}` : 'tout juste', tone};
  });

  // ── Étape 4 : les dégâts ──
  protected readonly damageValues = signal<readonly number[] | null>(null);
  protected readonly die = computed(() => damageDie(this.degats()));
  /** Le dé de protection de la cible, lu sur son armure (« d6-1(3) » → un d6 moins 1), avec le +1 d'un casque ; `null` sans dé. */
  protected readonly protectionDie = computed<{readonly malus: number; readonly bonus: number} | null>(() => {
    const text = this.targetStats()?.protectionText ?? '';
    // « d6-1 (3) » : un d6 moins 1 ; « d6 (4) » : un d6 sans retrait (certaines créatures).
    const match = text.match(/d6\s*(?:-\s*(\d+))?/i);
    return match ? {malus: Number(match[1] ?? 0), bonus: /\)\s*\+1/.test(text) ? 1 : 0} : null;
  });
  /** Face du dé de protection lancé à la place de la valeur fixe (le livre laisse le choix au MJ) ; `null` : valeur fixe. */
  protected readonly protectionFace = signal<number | null>(null);
  /** Valeur de protection saisie à la main (clic sur la puce) ; prime sur le dé et sur la valeur fixe. */
  protected readonly protectionManual = signal<number | null>(null);
  protected readonly editingProtection = signal(false);
  protected readonly protectionDraft = signal('');
  private readonly protectionInput = viewChild<ElementRef<HTMLInputElement>>('protectionInput');
  private readonly injector = inject(Injector);
  protected readonly protection = computed(() => {
    if (this.choice()?.posture?.slug === 'armor-chink') {
      return 0;
    }
    const manual = this.protectionManual();
    if (manual !== null) {
      return manual;
    }
    const die = this.protectionDie();
    const face = this.protectionFace();
    return die && face !== null ? Math.max(0, face - die.malus) + die.bonus : (this.targetStats()?.protection ?? 0);
  });
  protected readonly vigueur = computed(() => {
    const a = this.attacker();
    return a ? vigueurBonus(a, this.isTir()) : 0;
  });
  protected readonly devastating = computed(() => this.heroic() === 'devastateur');

  protected readonly raw = computed(() => {
    const values = this.damageValues();
    return values ? rawDamage(this.die(), values) : null;
  });
  /** Ce que les dés ont donné quand l'arme en lance deux : « 1 et 4 → 1 retenu (le moins bon) ». Vide pour un dé unique ou une saisie à table. */
  protected readonly damageDetail = computed(() => {
    const values = this.damageValues();
    const die = this.die();
    if (!values || values.length < 2 || (die !== 'd6m' && die !== 'd6b')) {
      return '';
    }
    return `${values.join(' et ')} → ${this.raw()} retenu (${die === 'd6m' ? 'le moins bon' : 'le meilleur'})`;
  });
  /** Ce qui se retranche vraiment des dégâts : un modificateur positif des effets ajoute aux dégâts, il se retranche de la protection. */
  private readonly effectiveProtection = computed(() => this.protection() - sommeModificateurs(this.damageEffectTerms()));
  protected readonly damage = computed(() => {
    const raw = this.raw();
    return raw === null ? null : finalDamage(raw, this.vigueur(), this.effectiveProtection(), this.devastating());
  });
  /** Ce que rapporte le dé de dégâts, à côté de sa case : « d6M : le moins bon de deux d6 ». */
  protected readonly dieNote = computed(() => `${this.degats()} : ${DIE_NOTES[this.die()]}`);
  protected readonly hasDamageStep = computed(() => !!this.verdict()?.hit && this.heroic() !== 'desarmement');
  /** Plus grand résultat que peut afficher le dé de dégâts : 3 pour un d3, 6 sinon. */
  protected readonly damageMax = computed(() => damageDieMax(this.die()));

  /** Le dernier coup appliqué par cette carte : il reste affiché sur le plateau tant qu'un nouveau jet n'est pas fait. */
  protected readonly lastHit = linkedSignal<string, AppliedHit | null>({source: () => this.cardKey(), computation: () => null});

  /** La vie de la cible choisie, en chiffres : ce qu'il lui reste, et où le coup en cours la fait tomber (`after`, `null` sans dégâts). */
  protected readonly targetLife = computed(() => {
    const target = this.target();
    const current = target?.vitaliteCourante ?? null;
    const damage = this.damage();
    const after = current !== null && damage !== null && damage > 0 ? current - damage : null;
    return {current, max: target?.vitaliteMax ?? null, after, loss: after === null ? 0 : damage, out: after !== null && after <= 0};
  });

  /** Où en sont les trois cases — qui, l'attaque, les dégâts : celle où il faut agir s'allume. Après des dégâts appliqués, l'attaque
   * se rallume (une nouvelle attaque est possible) et les dégâts gardent le rappel du coup. */
  protected readonly stations = computed<readonly [StationState, StationState, StationState]>(() => {
    const aimed = this.target() !== null;
    const rolled = this.attackVerdict() !== null;
    return [aimed ? 'done' : 'cur', !aimed ? 'todo' : rolled ? 'done' : 'cur', this.hasDamageStep() ? 'cur' : rolled || this.lastHit() ? 'done' : 'todo'];
  });

  /** Ce qu'il y a à faire maintenant, en une phrase ; `step` est le numéro de la case concernée, vide quand il ne reste qu'à conclure. */
  protected readonly nextStep = computed<{readonly step: string; readonly text: string}>(() => {
    const target = this.target();
    if (!target) {
      return {step: '1', text: `Choisis qui ${this.card().nom} attaque.`};
    }
    const verdict = this.attackVerdict();
    if (!verdict) {
      return this.lastHit()
        ? {step: '', text: 'Dégâts appliqués. Il ne reste qu’à finir le tour, ou à lancer une nouvelle attaque.'}
        : {step: '2', text: this.gmDie() ? `Tape le total des deux dés gardés (les ${this.keptCaption()} de 3d6), ou lance-les à l’écran.` : 'Tape le total des deux dés d’attaque, ou lance-les à l’écran.'};
    }
    if (!this.hasDamageStep()) {
      return {step: '', text: `${verdict.tone === 'echec' ? 'Raté' : 'Désarmement'}. Il ne reste qu’à finir le tour.`};
    }
    const damage = this.damage();
    return damage === null
      ? {step: '3', text: `Tape le dé de dégâts (${this.dieNote()}), ou lance-le à l’écran.`}
      : {step: '', text: `Entrée applique ${damage} ${damage > 1 ? 'dégâts' : 'dégât'} à ${target.nom}.`};
  });

  // Les cases et boutons du plateau, pour passer la main de l'un à l'autre au fil de la saisie.
  private readonly attackInput = viewChild<ElementRef<HTMLInputElement>>('attackInput');
  private readonly damageInput = viewChild<ElementRef<HTMLInputElement>>('damageInput');
  private readonly applyButton = viewChild('applyButton', {read: ElementRef<HTMLButtonElement>});
  private readonly endButton = viewChild('endButton', {read: ElementRef<HTMLButtonElement>});
  /** Une cible vient d'être choisie : la case du jet d'attaque prend la main dès qu'elle est à l'écran. */
  private attackFocusWanted = false;

  constructor() {
    effect(() => this.choiceChanged.emit(this.choice()));

    // Un autre attaquant, une autre cible, un autre choix ou un dé du MJ accordé ou retiré : le jet précédent ne vaut plus. Le choix est comparé par sa valeur : la table
    // rechargée (enregistrement de l'état du combat) en refait un objet identique, qui ne doit pas effacer le jet en cours.
    effect(() => {
      this.cardKey();
      this.targetKey();
      this.choiceKey();
      this.gmDie();
      untracked(() => this.resetRoll());
    });

    // La case du jet d'attaque n'existe qu'une fois les statistiques de la cible lues : elle prend la main à ce moment-là.
    effect(() => {
      const input = this.attackInput();
      if (input && this.attackFocusWanted) {
        this.attackFocusWanted = false;
        input.nativeElement.focus();
      }
    });
  }

  /** Vise une carte — ou, si c'est déjà la cible, y renonce. */
  protected selectTarget(card: TapisCard): void {
    const same = this.target()?.key === card.key;
    this.attackFocusWanted = !same;
    this.targetSelected.emit(same ? null : card);
  }

  /** Donne la main à un élément du plateau une fois l'écran à jour (il n'existe parfois qu'après le rendu). */
  private focusAfterRender(element: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => element()?.nativeElement.focus(), {injector: this.injector});
  }

  /** Accorde le dé de bonus ou de malus du MJ pour cette attaque ; un second clic sur le même le retire. */
  protected toggleGmDie(kind: 'bonus' | 'malus'): void {
    this.gmDie.update((current) => (current === kind ? null : kind));
  }

  protected selectArme(id: number | undefined): void {
    this.selectedArmeId.set(id ?? null);
  }

  protected selectOption(slug: string): void {
    this.selectedOptionSlug.set(slug);
    if (!DUAL_WIELD_SLUGS.has(slug)) {
      this.selectedOffHandId.set(null);
    }
  }

  protected selectOffHand(id: number | undefined): void {
    this.selectedOffHandId.set(id ?? null);
  }

  protected async roll(): Promise<void> {
    if (this.rolling()) {
      return;
    }
    this.manualTotal.set(null);
    this.heroic.set(null);
    this.damageValues.set(null);
    this.dice.set(null);
    this.lastHit.set(null);
    this.markAttacked();
    const net = this.netDice();
    const count = this.diceCount();
    const values = await this.throwDice(`${count}d6`, count);
    this.rolledDice.set(count > 2 ? values : null);
    this.dice.set(keepBestOrWorstTwo(values, net));
    this.focusAfterRender(() => (this.hasDamageStep() ? this.damageInput() : this.endButton()));
  }

  /** Retire les dés restés sur la table une fois le lancer terminé (un clic n'importe où sur l'écran de combat). */
  dismissDice(): void {
    if (!this.rolling()) {
      void this.diceBox()?.clear();
    }
  }

  /** Lance `count` d6 sur le plateau 3D (ou au hasard s'il est absent ou échoue) et renvoie leurs valeurs. */
  private async throwDice(notation: string, count: number): Promise<number[]> {
    const box = this.diceBox();
    if (!box) {
      return Array.from({length: count}, () => rollD6());
    }
    this.rolling.set(true);
    try {
      await box.clear();
      // Garde-fou : si le moteur 3D ne répond pas, le tirage se fait sans animation plutôt que de bloquer le tour.
      const results = await Promise.race([
        box.rollNotation(notation),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('dice timeout')), DICE_TIMEOUT_MS)),
      ]);
      return results.map((r) => r.value);
    } catch {
      return Array.from({length: count}, () => rollD6());
    } finally {
      this.rolling.set(false);
    }
  }

  /** Saisie du total des deux dés lancés à table. De 2 à 9 un chiffre suffit : le jet est pris tout de suite, et la main passe au dé de
   * dégâts s'il touche, à « Fin du tour » sinon. Une case vidée efface le jet. */
  protected onAttackInput(raw: string): void {
    if (raw.trim() === '') {
      if (this.diceSum() !== null) {
        this.dice.set(null);
        this.manualTotal.set(null);
        this.heroic.set(null);
        this.damageValues.set(null);
      }
      return;
    }
    const total = parseDiceTotal(raw);
    if (total === null) {
      return;
    }
    this.dice.set(null);
    this.rolledDice.set(null);
    this.heroic.set(null);
    this.damageValues.set(null);
    this.lastHit.set(null);
    this.manualTotal.set(total);
    this.markAttacked();
    this.focusAfterRender(() => (this.hasDamageStep() ? this.damageInput() : this.endButton()));
  }

  /** En quittant une case, une saisie laissée incomplète ou hors bornes cède la place à la valeur retenue. */
  protected restoreInput(input: HTMLInputElement, value: number | null): void {
    input.value = value === null ? '' : `${value}`;
  }

  /** Le MJ retire un effet : le registre l'oublie, et le jet déjà fait (modificateurs figés) perd sa puce et recalcule son total. */
  protected removeEffect(id: string): void {
    this.frozenTerms.update((termes) => (termes ? sansTerme(termes, id) : termes));
    this.frozenDamageTerms.update((termes) => (termes ? sansTerme(termes, id) : termes));
    this.effectRemoved.emit(id);
  }

  /** Premier jet contre cette cible : fige les modificateurs et signale l'attaque au registre. */
  private markAttacked(): void {
    const target = this.target();
    if (!target || this.frozenTerms() !== null) {
      return;
    }
    this.frozenTerms.set(this.liveTerms());
    this.frozenDamageTerms.set(this.liveDamageTerms());
    this.attackRolled.emit(target);
  }

  /** Saisie du dé de dégâts lancé à table : un chiffre, pris tout de suite. Un d6 de malus ou de bonus garde le dé retenu (on saisit
   * celui-là), un d3 se lit tel quel. La main passe ensuite au bouton qui applique. */
  protected onDamageInput(raw: string): void {
    const text = raw.trim();
    if (text === '') {
      this.damageValues.set(null);
      return;
    }
    const value = Number(text);
    if (!/^[1-6]$/.test(text) || value > this.damageMax()) {
      return;
    }
    // `rawDamage` lit un d3 comme un d6 divisé par deux : 2n − 1 redonne n.
    const face = this.die() === 'd3' ? 2 * value - 1 : value;
    this.damageValues.set(Array.from({length: damageDiceCount(this.die())}, () => face));
    this.focusAfterRender(() => this.applyButton());
  }

  /** Ouvre la saisie de la protection : le champ remplace la puce, prérempli avec la valeur courante. */
  protected startEditProtection(): void {
    this.protectionDraft.set(String(this.protection()));
    this.editingProtection.set(true);
    afterNextRender(
      () => {
        const input = this.protectionInput()?.nativeElement;
        input?.focus();
        input?.select();
      },
      {injector: this.injector},
    );
  }

  /** Entrée : valide un entier positif ou nul ; une saisie invalide referme le champ sans rien changer. */
  protected commitProtection(): void {
    const value = Number(this.protectionDraft());
    if (this.protectionDraft().trim() !== '' && Number.isInteger(value) && value >= 0) {
      this.protectionManual.set(value);
      this.protectionFace.set(null);
    }
    this.editingProtection.set(false);
  }

  protected resetProtection(): void {
    this.protectionManual.set(null);
    this.protectionFace.set(null);
  }

  /** Lance le dé de protection de la cible : son résultat remplace la valeur fixe pour ce coup. */
  protected async rollProtection(): Promise<void> {
    if (this.rolling() || !this.protectionDie()) {
      return;
    }
    const [face] = await this.throwDice('1d6', 1);
    this.protectionFace.set(face);
    this.protectionManual.set(null);
  }

  protected async rollDamage(): Promise<void> {
    if (this.rolling()) {
      return;
    }
    const count = damageDiceCount(this.die());
    this.damageValues.set(await this.throwDice(`${count}d6`, count));
    this.focusAfterRender(() => this.applyButton());
  }

  /** La barre de vie d'une carte. Celle de la cible choisie montre aussi ce que le coup en cours va lui retirer. */
  protected lifeOf(card: TapisCard): LifeBar {
    const rest = vitalitePercent(card.vitaliteCourante, card.vitaliteMax);
    const max = card.vitaliteMax ?? 0;
    const hit = card.key === this.target()?.key ? (this.damage() ?? 0) : 0;
    const loss = max > 0 ? Math.min(rest, (hit / max) * 100) : 0;
    return {rest: rest - loss, loss, low: isLowVitalite(card.vitaliteCourante, card.vitaliteMax)};
  }

  protected setHeroic(slug: string): void {
    this.heroic.set(this.heroic() === slug ? null : slug);
  }

  protected apply(): void {
    const target = this.target();
    const damage = this.damage();
    if (!target || damage === null) {
      return;
    }
    this.damageApplied.emit({target, damage});
    this.resetRoll();
    this.lastHit.set({target, damage});
    this.focusAfterRender(() => this.endButton());
  }

  protected signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  private resetRoll(): void {
    this.protectionFace.set(null);
    this.protectionManual.set(null);
    this.editingProtection.set(false);
    this.frozenTerms.set(null);
    this.frozenDamageTerms.set(null);
    this.dice.set(null);
    this.rolledDice.set(null);
    this.manualTotal.set(null);
    this.heroic.set(null);
    this.damageValues.set(null);
  }
}
