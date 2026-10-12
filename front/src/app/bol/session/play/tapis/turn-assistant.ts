import {afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, Injector, input, linkedSignal, output, signal, untracked, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {RollTerm} from '../../models/action-roll.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ARME_IMPROVISEE, DUAL_WIELD_SLUGS, filterAttackMenuCombatOptions, filterVisiblePostures, isDualWieldWeapon, MAINS_NUES} from '../../attack-options.util';
import {dualStrikeDegats} from '../../combat-attack.util';
import {
  ATTACK_THRESHOLD,
  attackBonus,
  computeAttackTotal,
  damageDiceCount,
  damageDie,
  finalDamage,
  HEROIC_OPTIONS,
  rawDamage,
  resolvePostureAttackModifier,
  rollD6,
  suggestedAttackResult,
  vigueurBonus,
} from '../../combat-resolution.util';
import {AttackChoice} from '../../models/attack-options.model';
import {ResolvedCombatStats} from '../../models/combat-attack.model';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {TapisCard} from '../../models/tapis.model';
import {isLowVitalite, vitalitePercent} from './tapis.util';

/** Délai maximal d'un lancer 3D avant de tirer les dés sans animation. */
const DICE_TIMEOUT_MS = 12000;

/** Les postures de l'échelle, de la plus prudente à la plus audacieuse ; les autres sont des options spéciales. */
const SCALE_SLUGS: readonly string[] = ['defensive', 'none', 'offensive', 'intrepid'];

/** Effet d'une posture sur la défense (le bonus d'attaque vient du référentiel). */
const POSTURE_DEFENSE: Readonly<Record<string, number>> = {defensive: 1, offensive: -1, intrepid: -2, 'dual-parry': 1};

/** Effet d'une posture qui ne se chiffre pas en bonus ou malus. */
const POSTURE_EXTRA: Readonly<Record<string, string>> = {
  intrepid: 'perd le bouclier',
  'dual-strike': 'dégâts +1 catégorie',
  'armor-chink': "ignore l'armure si touché",
};

/** Un effet affiché en pastille dans le récapitulatif du tour. */
interface EffectPill {
  readonly label: string;
  readonly tone: 'plus' | 'minus' | 'neutral';
}

/** Une tuile de la fiche d'un combattant : un chiffre de combat et son libellé. */
interface StatTile {
  readonly label: string;
  readonly value: string;
  readonly hot?: boolean;
  /** Vitalité : le chiffre est posé dans un cœur, avec le maximum en petit. */
  readonly heart?: boolean;
  readonly max?: string;
}

/** Un coup porté, une fois ses dégâts appliqués : de quoi l'écrire au journal. */
export interface AppliedHit {
  readonly target: TapisCard;
  readonly damage: number;
}

/** L'assistant de tour, sous la frise en combat : il suit le déroulé d'un tour de la carte active
 * en quatre étapes — action, cible, jet, dégâts. Il calcule le jet d'attaque (2d6 + bonus − défense, 9+), la
 * protection et les dégâts, et propose les options de succès héroïque. Il ne parle à aucun service : il
 * signale à la page ce qui doit être enregistré (dégâts, fin de tour, défense totale). */
@Component({
  selector: 'bol-turn-assistant',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
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
  /** Un héros a obtenu un succès légendaire : +1 aux jets d'attaque de l'attaquant s'il est du camp des héros. */
  readonly legendaryBonus = input(false);
  /** Plateau de dés 3D de l'écran de combat : les dés roulent par-dessus tout l'écran. Sans lui, les dés sont tirés sans animation. */
  readonly diceBox = input<DiceBoxHostComponent | null>(null);

  readonly choiceChanged = output<AttackChoice | null>();
  /** La carte choisie comme cible, ou `null` pour « Changer d'adversaire ». */
  readonly targetSelected = output<TapisCard | null>();
  /** Ouvrir la fiche complète (statbloc) d'un des deux duellistes. */
  readonly sheetRequested = output<TapisCard>();
  readonly attackRolled = output<TapisCard>();
  readonly damageApplied = output<AppliedHit>();
  readonly totalDefenseRequested = output<void>();

  protected readonly heroicOptions = HEROIC_OPTIONS;
  protected readonly isHero = computed(() => this.card().kind === 'hero');
  /** Les options de succès héroïque (dont « Massacrer la piétaille ») sont celles des héros : leurs alliés y ont droit, pas leurs adversaires. */
  protected readonly heroicAllowed = computed(() => this.card().camp === 'heros');

  // ── Étape 1 : arme, posture, arme secondaire — repartent de zéro à chaque nouvelle carte active ──
  /** Un héros attaque avec ses armes équipées, les mains nues ou une arme improvisée ; un PNJ avec n'importe laquelle de ses armes. */
  protected readonly displayArmes = computed(() => (this.isHero() ? [...this.armes(), MAINS_NUES, ARME_IMPROVISEE] : this.armes()));
  private readonly selectedArmeId = linkedSignal<string, number | null>({source: () => this.card().key, computation: () => null});
  private readonly selectedOptionSlug = linkedSignal<string, string | null>({source: () => this.card().key, computation: () => null});
  private readonly selectedOffHandId = linkedSignal<string, number | null>({source: () => this.card().key, computation: () => null});

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

  /** Ce que la posture choisie change à ce tour : attaque, défense et effets particuliers. */
  protected readonly effectPills = computed<readonly EffectPill[]>(() => {
    const option = this.effectiveOption();
    if (!option || option.slug === 'none') {
      return [{label: 'aucun modificateur', tone: 'neutral'}];
    }
    const pills: EffectPill[] = [];
    const attack = this.postureModifier();
    if (attack !== 0) {
      pills.push({label: `attaque ${this.signed(attack)}`, tone: attack > 0 ? 'plus' : 'minus'});
    }
    const defense = POSTURE_DEFENSE[option.slug] ?? 0;
    if (defense !== 0) {
      pills.push({label: `défense ${this.signed(defense)}`, tone: defense > 0 ? 'plus' : 'minus'});
    }
    const extra = POSTURE_EXTRA[option.slug];
    if (extra) {
      pills.push({label: extra, tone: 'neutral'});
    }
    return pills;
  });

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
  protected readonly useTir = linkedSignal<ResolvedCombatStats | null, boolean>({
    source: () => this.attacker(),
    computation: (a) => !!a && a.attaque === null && a.tir > a.melee,
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

  protected readonly dice = signal<readonly [number, number] | null>(null);
  protected readonly rolling = signal(false);

  /** Fiche de l'attaquant : attaque, défense, dégâts (de l'arme choisie), protection, vigueur et vitalité. */
  protected readonly attackerTiles = computed<readonly StatTile[]>(() =>
    this.tilesOf(this.attacker(), this.card(), this.isTir(), this.degats()),
  );

  /** Fiche de la cible choisie, avec les mêmes tuiles. */
  protected readonly targetTiles = computed<readonly StatTile[]>(() => {
    const target = this.target();
    return target ? this.tilesOf(this.targetStats(), target, false, target.degats) : [];
  });

  private tilesOf(stats: ResolvedCombatStats | null, card: TapisCard, useTir: boolean, degats: string): readonly StatTile[] {
    if (!stats) {
      return [];
    }
    return [
      {label: 'Attaque', value: this.signed(attackBonus(stats, useTir))},
      {label: 'Défense', value: String(stats.defense)},
      {label: 'Dégâts', value: degats, hot: true},
      {label: 'Prot.', value: stats.protectionText ?? String(stats.protection)},
      {label: 'Vigueur', value: this.signed(vigueurBonus(stats, useTir))},
      {label: 'Vitalité', value: String(card.vitaliteCourante ?? '—'), max: String(card.vitaliteMax ?? '—'), heart: true},
    ];
  }
  /** Total saisi à table, avant validation. */
  protected readonly manualDraft = signal('');
  protected readonly manualDraftValid = computed(() => {
    const value = Number(this.manualDraft());
    return Number.isInteger(value) && value >= 2 && value <= 12;
  });
  protected readonly manualTotal = signal<number | null>(null);
  protected readonly heroic = signal<string | null>(null);

  protected readonly degats = computed(() => this.choice()?.degats ?? this.attacker()?.degats ?? this.card().degats);
  protected readonly postureModifier = computed(() =>
    resolvePostureAttackModifier(this.choice()?.posture ?? null, this.targetStats()?.protection ?? 0),
  );

  /** Les termes du jet d'attaque, un par puce : « 2d6 », « + 2 agi », « + 2 mêlée », « − 1 défense »… Les termes nuls sont omis ; le total des
   * dés apparaît entre parenthèses une fois le jet fait. */
  protected readonly formulaTerms = computed<readonly RollTerm[]>(() => {
    const a = this.attacker();
    const t = this.targetStats();
    if (!a || !t) {
      return [];
    }
    const dice = this.diceSum();
    const terms: RollTerm[] = [{label: `2d6${dice === null ? '' : ` (${dice})`}`, tone: 'dice'}];
    const add = (value: number, name: string): void => {
      if (value !== 0) {
        terms.push({label: `${value > 0 ? '+' : '−'} ${Math.abs(value)} ${name}`, tone: value > 0 ? 'plus' : 'minus'});
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
    add(-this.shield(), 'bouclier');
    return terms;
  });

  protected readonly threshold = ATTACK_THRESHOLD;

  /** Les termes du jet de dégâts : le dé de l'arme, la vigueur, le coup dévastateur et la protection de la cible. */
  protected readonly damageTerms = computed<readonly RollTerm[]>(() => {
    const terms: RollTerm[] = [{label: this.degats(), tone: 'dice'}];
    const add = (value: number, name: string): void => {
      if (value !== 0) {
        terms.push({label: `${value > 0 ? '+' : '−'} ${Math.abs(value)} ${name}`, tone: value > 0 ? 'plus' : 'minus'});
      }
    };
    add(this.vigueur(), 'vigueur');
    add(this.devastating() ? 6 : 0, 'dévastateur');
    const protection = this.protection();
    const source = this.protectionManual() !== null ? ' (saisie)' : this.protectionFace() !== null ? ` (dé ${this.protectionFace()})` : '';
    // Toujours affichée, même à 0 : c'est elle qu'on clique pour saisir une valeur.
    terms.push({label: `− ${protection} protection${source}`, tone: 'minus', editable: true});
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

  /** Malus du bouclier figé au premier jet de cette attaque : la cible est ensuite marquée « attaquée » et son malus tombe, mais un
   * jet relancé garde le sien. */
  private readonly shieldLock = signal<number | null>(null);
  private readonly shield = computed(() => this.shieldLock() ?? this.targetStats()?.bouclierMalusUneAttaque ?? 0);

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
      0,
      this.shield(),
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

  protected readonly verdictLabel = computed(() => {
    switch (this.tone()) {
      case 'heroique':
        return 'Succès héroïque';
      case 'reussite':
        return 'Touché';
      case 'echec':
        return 'Raté';
      default:
        return 'En attente';
    }
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
  protected readonly damage = computed(() => {
    const raw = this.raw();
    return raw === null ? null : finalDamage(raw, this.vigueur(), this.protection(), this.devastating());
  });
  protected readonly hasDamageStep = computed(() => !!this.verdict()?.hit && this.heroic() !== 'desarmement');

  constructor() {
    effect(() => this.choiceChanged.emit(this.choice()));

    // Un autre attaquant, une autre cible ou un autre choix : le jet précédent ne vaut plus. Le choix est comparé par sa valeur : la table
    // rechargée (enregistrement de l'état du combat) en refait un objet identique, qui ne doit pas effacer le jet en cours.
    effect(() => {
      this.cardKey();
      this.targetKey();
      this.choiceKey();
      untracked(() => this.resetRoll());
    });
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
    this.markAttacked();
    const values = await this.throwDice('2d6', 2);
    this.dice.set([values[0], values[1]]);
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

  protected submitManual(): void {
    if (this.manualDraftValid()) {
      this.setManual(this.manualDraft());
    }
  }

  protected setManual(raw: string): void {
    const value = Number(raw);
    this.dice.set(null);
    this.heroic.set(null);
    this.damageValues.set(null);
    this.manualTotal.set(Number.isInteger(value) && value >= 2 && value <= 12 ? value : null);
    if (this.manualTotal() !== null) {
      this.markAttacked();
    }
  }

  /** Premier jet contre cette cible : fige son malus de bouclier et la signale comme attaquée ce round. */
  private markAttacked(): void {
    const target = this.target();
    if (!target || this.shieldLock() !== null) {
      return;
    }
    this.shieldLock.set(this.targetStats()?.bouclierMalusUneAttaque ?? 0);
    this.attackRolled.emit(target);
  }

  /** Plus grand résultat que peut afficher le dé de dégâts : 3 pour un d3, 6 sinon. */
  protected readonly damageMax = computed(() => (this.die() === 'd3' ? 3 : 6));
  /** Résultat du dé de dégâts saisi à table, avant validation. */
  protected readonly damageDraft = signal('');
  protected readonly damageDraftValid = computed(() => {
    const value = Number(this.damageDraft());
    return this.damageDraft() !== '' && Number.isInteger(value) && value >= 1 && value <= this.damageMax();
  });

  /** Dégâts bruts lus sur le dé lancé à table : un d6 de malus ou de bonus garde le dé retenu (on saisit celui-là), un d3 se lit tel quel. */
  protected submitManualDamage(): void {
    if (!this.damageDraftValid()) {
      return;
    }
    const value = Number(this.damageDraft());
    const count = damageDiceCount(this.die());
    // `rawDamage` lit un d3 comme un d6 divisé par deux : 2n − 1 redonne n.
    const face = this.die() === 'd3' ? 2 * value - 1 : value;
    this.damageValues.set(Array.from({length: count}, () => face));
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
  }

  protected percent(card: TapisCard): number {
    return vitalitePercent(card.vitaliteCourante, card.vitaliteMax);
  }

  protected isLow(card: TapisCard): boolean {
    return isLowVitalite(card.vitaliteCourante, card.vitaliteMax);
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
  }

  protected signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }

  private resetRoll(): void {
    this.manualDraft.set('');
    this.damageDraft.set('');
    this.protectionFace.set(null);
    this.protectionManual.set(null);
    this.editingProtection.set(false);
    this.shieldLock.set(null);
    this.dice.set(null);
    this.manualTotal.set(null);
    this.heroic.set(null);
    this.damageValues.set(null);
  }
}
