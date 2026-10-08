import {ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output, signal, untracked} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {ARME_IMPROVISEE, DUAL_WIELD_SLUGS, filterAttackMenuCombatOptions, filterVisiblePostures, MAINS_NUES} from '../../attack-options.util';
import {dualStrikeDegats, isDualWieldEligible} from '../../combat-attack.util';
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
  readonly targetSelected = output<TapisCard>();
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

  protected readonly eligibleOffHandArmes = computed(() => {
    const mainId = this.effectiveArme()?.id;
    return this.displayArmes().filter((a) => a.id !== mainId && isDualWieldEligible(a.arme?.degats));
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
    return filterVisiblePostures(options, this.effectiveArme()?.arme?.degats ?? null, otherDegats);
  });

  protected readonly effectiveOption = computed(() => {
    const list = this.visibleOptions();
    return list.find((o) => o.slug === this.selectedOptionSlug()) ?? list[0] ?? null;
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

  // ── Étape 3 : le jet d'attaque ──
  protected readonly useTir = linkedSignal<ResolvedCombatStats | null, boolean>({
    source: () => this.attacker(),
    computation: (a) => !!a && a.attaque === null && a.tir > a.melee,
  });
  protected readonly dice = signal<readonly [number, number] | null>(null);
  protected readonly rolling = signal(false);
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

  /** Détail de la formule, en clair : « 2d6 + 3 − 0 + 1 (posture) ». */
  protected readonly formula = computed(() => {
    const a = this.attacker();
    const t = this.targetStats();
    if (!a || !t) {
      return '';
    }
    const parts = ['2d6'];
    if (a.attaque !== null) {
      parts.push(`+ ${a.attaque} (attaque)`);
    } else {
      parts.push(`+ ${a.agilite} (agi)`, `+ ${this.useTir() ? a.tir : a.melee} (${this.useTir() ? 'tir' : 'mêlée'})`);
    }
    parts.push(`− ${t.defense} (défense)`);
    const posture = this.postureModifier();
    if (posture !== 0) {
      parts.push(`${posture > 0 ? '+' : '−'} ${Math.abs(posture)} (posture)`);
    }
    if (this.legendaryBonus()) {
      parts.push('+ 1 (légendaire)');
    }
    if (t.bouclierMalusUneAttaque > 0) {
      parts.push(`− ${t.bouclierMalusUneAttaque} (bouclier)`);
    }
    return `${parts.join(' ')} ≥ ${ATTACK_THRESHOLD}`;
  });

  /** Total des dés : lancés ici, ou saisis à la main (total à table, de 2 à 12). */
  protected readonly diceSum = computed(() => {
    const d = this.dice();
    if (d) {
      return d[0] + d[1];
    }
    return this.manualTotal();
  });

  protected readonly total = computed(() => {
    const sum = this.diceSum();
    const a = this.attacker();
    const t = this.targetStats();
    if (sum === null || !a || !t) {
      return null;
    }
    return computeAttackTotal(
      sum,
      attackBonus(a, this.useTir()),
      t.defense,
      0,
      t.bouclierMalusUneAttaque,
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
  protected readonly protection = computed(() => (this.choice()?.posture?.slug === 'armor-chink' ? 0 : (this.targetStats()?.protection ?? 0)));
  protected readonly vigueur = computed(() => {
    const a = this.attacker();
    return a ? vigueurBonus(a, this.useTir()) : 0;
  });
  protected readonly devastating = computed(() => this.heroic() === 'devastateur');

  protected readonly raw = computed(() => {
    const values = this.damageValues();
    return values ? rawDamage(this.die(), values) : null;
  });
  protected readonly damage = computed(() => {
    const raw = this.raw();
    return raw === null ? null : finalDamage(raw, this.vigueur(), this.protection(), this.devastating());
  });
  protected readonly hasDamageStep = computed(() => !!this.verdict()?.hit && this.heroic() !== 'desarmement');

  constructor() {
    effect(() => this.choiceChanged.emit(this.choice()));

    // Un autre attaquant, une autre cible ou un autre choix : le jet précédent ne vaut plus.
    effect(() => {
      this.card().key;
      this.target()?.key;
      this.choice();
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
    const values = await this.throwDice('2d6', 2);
    this.dice.set([values[0], values[1]]);
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
    this.dice.set(null);
    this.manualTotal.set(null);
    this.heroic.set(null);
    this.damageValues.set(null);
  }
}
