import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewEncapsulation,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DiceBoxHostComponent} from '../../../shared/dice-3d/dice-box-host';
import {InitiativeResultat} from '../../models/bol-fight-session.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {ResolvedCombatStats} from '../combat-attack.util';
import {applyHeroismeDelta} from '../heroisme-spend.util';

/** Posture/option de combat choisie dans le menu épée (bol_combat_option) — seul le sous-ensemble
 * "modificateur simple au jet d'attaque" est géré ici (doc/rules/02-actions-combat.md, "Options de
 * combat") : offensive/intrépide/défensive/défaut de l'armure. Le volet défensif de ces postures
 * ("pour tout le round") n'est pas persisté côté session dans cette passe — seul l'attaquant en
 * bénéficie, sur son propre jet d'attaque. */
export interface AttackRollDialogPosture {
  readonly label: string;
  readonly slug: string;
  readonly modificateur: number;
}

export interface AttackRollDialogData {
  readonly attackerNom: string;
  readonly targetNom: string;
  readonly attackerAvatar: string;
  readonly targetAvatar: string;
  readonly attacker: ResolvedCombatStats;
  readonly target: ResolvedCombatStats;
  /** true si l'attaquant a obtenu un succès légendaire au jet de réaction de cette rencontre
   * (`PlayToken.tier`) : +1 personnel à tous ses jets d'attaque durant toute la rencontre
   * (02-actions-combat.md). */
  readonly legendaryBonusActive: boolean;
  readonly posture: AttackRollDialogPosture | null;
}

/** Résout le modificateur d'attaque réellement appliqué par la posture choisie. "Attaque au défaut
 * de l'armure" n'a pas de malus fixe en base (`modificateur_armor: true`) : son malus est la valeur
 * de protection fixe de la cible (−1/−2/−3 légère/moyenne/lourde, doc/rules/02-actions-combat.md). */
export function resolvePostureAttackModifier(posture: AttackRollDialogPosture | null, targetProtection: number): number {
  if (!posture) {
    return 0;
  }
  return posture.slug === 'armor-chink' ? -targetProtection : posture.modificateur;
}

type DegatsDiceKind = 'd3' | 'd6' | 'd6m' | 'd6b';

const DICE_LABELS: Record<DegatsDiceKind, string> = {d3: 'd3', d6: 'd6', d6m: 'd6 malus', d6b: 'd6 bonus'};

/** Seuil de réussite du jet d'attaque BoL (02-actions-combat.md) — fixe, jamais modifié par les règles. */
const THRESHOLD = 9;

/** Total du jet d'attaque : 2d6 + bonus attaquant − défense cible + modificateur − malus de petit
 * bouclier consommé + bonus +1 légendaire personnel (si actif pour la rencontre) + modificateur de
 * posture (offensive/intrépide/défensive/défaut de l'armure). */
export function computeAttackTotal(
  diceSum: number,
  attackerBonus: number,
  targetDefense: number,
  modifier: number,
  shieldMalus: number,
  legendaryBonus: number,
  postureModifier: number,
): number {
  return diceSum + attackerBonus - targetDefense + modifier - shieldMalus + legendaryBonus + postureModifier;
}

/** Résultat suggéré d'un jet d'attaque : 2/12 naturels priment sur le seuil (même règle absolue que
 * pour tout jet d'action, 02-actions-combat.md) — `total` est déjà le résultat de `computeAttackTotal`. */
export function suggestedAttackResult(
  dice: readonly [number, number],
  total: number,
  threshold: number,
): InitiativeResultat {
  const [a, b] = dice;
  if (a === 1 && b === 1) {
    return 'echec';
  }
  if (a === 6 && b === 6) {
    return 'heroique';
  }
  return total >= threshold ? 'reussite' : 'echec';
}

/**
 * Lance le jet d'attaque (2d6 + bonus attaquant − défense cible, seuil 9+) puis, en cas de succès,
 * le jet de dégâts (dé d'arme + bonus de vigueur − protection). Encapsulation désactivée à dessein,
 * même pattern que `ActionRollDialogComponent` (voir `panelClass: 'atd-panel'` côté appelant).
 */
@Component({
  selector: 'bol-attack-roll-dialog',
  imports: [MatDialogModule, MatIconModule, MatTooltipModule, FormsModule, DiceBoxHostComponent],
  templateUrl: './attack-roll-dialog.html',
  styleUrl: './attack-roll-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AttackRollDialogComponent {
  protected readonly data = inject<AttackRollDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<AttackRollDialogComponent, number | undefined>);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

  /** Héroïsme courant de l'attaquant — null si l'attaquant n'est pas un héros (pas de Faveur divine). */
  protected readonly heroisme = signal(this.data.attacker.heroisme ?? 0);

  protected readonly threshold = THRESHOLD;
  protected readonly diceKinds: DegatsDiceKind[] = ['d3', 'd6', 'd6m', 'd6b'];
  protected readonly diceLabel = (kind: DegatsDiceKind): string => DICE_LABELS[kind];

  // --- Jet d'attaque : formule éditable, préremplie depuis les stats résolues ---
  protected readonly useTir = signal(this.data.attacker.attaque === null && this.data.attacker.tir > this.data.attacker.melee);
  protected readonly attackerBonus = signal(this.initialAttackerBonus());
  protected readonly targetDefense = signal(this.data.target.defense);
  protected readonly modifier = signal(0);
  protected readonly shieldBonusAvailable = signal(this.data.target.bouclierMalusUneAttaque > 0);

  protected readonly rollingAttack = signal(false);
  protected readonly attackDice = signal<readonly [number, number] | null>(null);

  protected readonly attackDiceSum = computed(() => {
    const d = this.attackDice();
    return d ? d[0] + d[1] : null;
  });

  protected readonly legendaryBonus = computed(() => (this.data.legendaryBonusActive ? 1 : 0));
  protected readonly postureModifier = computed(() =>
    resolvePostureAttackModifier(this.data.posture, this.data.target.protection),
  );

  protected readonly attackTotal = computed(() => {
    const sum = this.attackDiceSum();
    if (sum === null) {
      return null;
    }
    const shieldMalus = this.shieldBonusAvailable() ? this.data.target.bouclierMalusUneAttaque : 0;
    return computeAttackTotal(
      sum,
      this.attackerBonus(),
      this.targetDefense(),
      this.modifier(),
      shieldMalus,
      this.legendaryBonus(),
      this.postureModifier(),
    );
  });

  protected readonly margin = computed(() => {
    const t = this.attackTotal();
    if (t === null) {
      return null;
    }
    const value = t - THRESHOLD;
    return value >= 0 ? `+${value}` : `${value}`;
  });

  protected readonly isNatural2 = computed(() => {
    const d = this.attackDice();
    return !!d && d[0] === 1 && d[1] === 1;
  });

  protected readonly isNatural12 = computed(() => {
    const d = this.attackDice();
    return !!d && d[0] === 6 && d[1] === 6;
  });

  /** Réussite normale (ni 2 ni 12 naturel) — seul ce cas peut être converti en succès héroïque
   * par dépense de PH (02-actions-combat.md : on ne peut pas ensuite convertir en légendaire). */
  protected readonly canUpgradeToHeroique = computed(() => {
    const d = this.attackDice();
    const t = this.attackTotal();
    if (!d || t === null || this.isNatural2() || this.isNatural12()) {
      return false;
    }
    return suggestedAttackResult(d, t, THRESHOLD) === 'reussite';
  });

  /** Échec critique (2 naturel) — choix volontaire qui OCTROIE 1 PH. */
  protected readonly critiqueChosen = signal(false);
  /** Succès légendaire (12 naturel) — choix volontaire qui DÉPENSE 1 PH. */
  protected readonly legendaryChosen = signal(false);
  /** Conversion réussite normale → succès héroïque — choix volontaire qui DÉPENSE 1 PH. */
  protected readonly heroicUpgradeChosen = signal(false);

  protected readonly attackResult = computed<InitiativeResultat | null>(() => {
    const d = this.attackDice();
    const t = this.attackTotal();
    if (!d || t === null) {
      return null;
    }
    if (this.isNatural2()) {
      return this.critiqueChosen() ? 'echec_critique' : 'echec';
    }
    if (this.isNatural12()) {
      return this.legendaryChosen() ? 'legendaire' : 'heroique';
    }
    const base = suggestedAttackResult(d, t, THRESHOLD);
    return base === 'reussite' && this.heroicUpgradeChosen() ? 'heroique' : base;
  });

  protected readonly attackSuccess = computed(() => {
    const result = this.attackResult();
    return result === 'reussite' || result === 'heroique' || result === 'legendaire';
  });

  // --- Étapes progressives : chaque section rolled se réduit à un résumé, dépliable au clic ---
  private readonly expandAttackOverride = signal(false);
  private readonly expandDamageOverride = signal(false);

  protected readonly attackDetailVisible = computed(() => this.attackDice() === null || this.expandAttackOverride());
  protected readonly damageDetailVisible = computed(() => this.damageDice() === null || this.expandDamageOverride());

  protected toggleAttackDetail(): void {
    this.expandAttackOverride.update((v) => !v);
  }

  protected toggleDamageDetail(): void {
    this.expandDamageOverride.update((v) => !v);
  }

  protected readonly attackFormula = computed(() => {
    const d = this.attackDice();
    if (!d) {
      return '';
    }
    const bonus = this.attackerBonus();
    const mod = this.modifier();
    const shieldMalus = this.shieldBonusAvailable() ? this.data.target.bouclierMalusUneAttaque : 0;
    let formula = `2d6 (${d[0]}+${d[1]}) ${bonus >= 0 ? '+' : ''}${bonus} −${this.targetDefense()}`;
    if (mod !== 0) {
      formula += ` ${mod >= 0 ? '+' : ''}${mod}`;
    }
    if (shieldMalus !== 0) {
      formula += ` −${shieldMalus} (bouclier)`;
    }
    const posture = this.postureModifier();
    if (posture !== 0) {
      formula += ` ${posture >= 0 ? '+' : ''}${posture} (${this.data.posture?.label.toLowerCase()})`;
    }
    if (this.legendaryBonus() !== 0) {
      formula += ` +${this.legendaryBonus()} (légendaire)`;
    }
    return formula;
  });

  protected readonly damageFormula = computed(() => {
    const values = this.damageDice();
    if (!values) {
      return '';
    }
    const kind = this.diceKind();
    const diceLabel = kind === 'd6m' || kind === 'd6b' ? `2d6 (${values[0]},${values[1]})` : `${kind === 'd3' ? 'd3' : '1d6'} (${values[0]})`;
    return `${diceLabel} +${this.vigueurBonus()} −${this.protection()}`;
  });

  // --- Jet de dégâts (uniquement après un jet d'attaque réussi) ---
  protected readonly diceKind = signal<DegatsDiceKind>(this.parseDiceKind(this.data.attacker.degats));
  protected readonly vigueurBonus = signal(this.data.attacker.vigueur);
  /** "Attaque au défaut de l'armure" (02-actions-combat.md) : si l'attaque touche, les dégâts
   * ignorent entièrement la protection de la cible. */
  protected readonly protection = signal(this.data.posture?.slug === 'armor-chink' ? 0 : this.data.target.protection);

  protected readonly rollingDamage = signal(false);
  protected readonly damageDice = signal<readonly number[] | null>(null);

  protected readonly damageRaw = computed(() => {
    const values = this.damageDice();
    if (!values) {
      return null;
    }
    const kind = this.diceKind();
    if (kind === 'd6m') {
      return Math.min(...values);
    }
    if (kind === 'd6b') {
      return Math.max(...values);
    }
    if (kind === 'd3') {
      return Math.ceil(values[0] / 2);
    }
    return values[0];
  });

  protected readonly finalDamage = computed(() => {
    const raw = this.damageRaw();
    return raw === null ? null : Math.max(0, raw + this.vigueurBonus() - this.protection());
  });

  private initialAttackerBonus(): number {
    const a = this.data.attacker;
    if (a.attaque !== null) {
      return a.attaque;
    }
    return a.agilite + (this.useTirDefault() ? a.tir : a.melee);
  }

  private useTirDefault(): boolean {
    const a = this.data.attacker;
    return a.attaque === null && a.tir > a.melee;
  }

  protected toggleUseTir(useTir: boolean): void {
    this.useTir.set(useTir);
    const a = this.data.attacker;
    if (a.attaque === null) {
      this.attackerBonus.set(a.agilite + (useTir ? a.tir : a.melee));
      this.vigueurBonus.set(useTir ? Math.floor(a.vigueur / 2) : a.vigueur);
    }
  }

  private parseDiceKind(degats: string): DegatsDiceKind {
    const s = degats.toLowerCase();
    if (s.includes('d3')) {
      return 'd3';
    }
    if (s.includes('m')) {
      return 'd6m';
    }
    if (s.includes('b')) {
      return 'd6b';
    }
    return 'd6';
  }

  protected async rollAttack(): Promise<void> {
    this.rollingAttack.set(true);
    this.damageDice.set(null);

    try {
      await this.diceBox().clear();
      const results = await this.diceBox().rollNotation('2d6');
      const [a, b] = results.map((r) => r.value);
      this.resetTierChoices();
      this.attackDice.set([a, b]);
      this.expandAttackOverride.set(false);
    } finally {
      this.rollingAttack.set(false);
    }
  }

  /** Faveur divine (02-actions-combat.md) : dépense 1 PH, relance le jet d'attaque, conserve le
   * résultat du second jet — utilisable même après un 2 naturel. Ne s'applique qu'au jet d'attaque
   * (pas au jet de dégâts, qui n'est pas "un jet d'action"). */
  protected async rollAttackWithDivineFavor(): Promise<void> {
    const herosId = this.data.attacker.herosId;
    if (!herosId || this.heroisme() <= 0) {
      return;
    }

    applyHeroismeDelta(this.herosService, this.snackBar, herosId, this.heroisme, -1);
    await this.rollAttack();
  }

  private resetTierChoices(): void {
    this.critiqueChosen.set(false);
    this.legendaryChosen.set(false);
    this.heroicUpgradeChosen.set(false);
  }

  /** Échec critique (2 naturel) : choisir OCTROIE 1 PH ; revenir en arrière le reprend. */
  protected toggleCritique(): void {
    this.toggleTierChoice(this.critiqueChosen, {spendOnChoose: false});
  }

  /** Succès légendaire (12 naturel) : choisir DÉPENSE 1 PH ; revenir en arrière la rembourse. */
  protected toggleLegendaire(): void {
    this.toggleTierChoice(this.legendaryChosen, {spendOnChoose: true});
  }

  /** Conversion réussite normale → succès héroïque : choisir DÉPENSE 1 PH ; revenir en arrière la rembourse. */
  protected toggleHeroicUpgrade(): void {
    this.toggleTierChoice(this.heroicUpgradeChosen, {spendOnChoose: true});
  }

  /** Bascule un choix de palier (critique/légendaire/héroïque) et son effet en héroïsme — octroi ou
   * dépense selon `spendOnChoose`, dans les deux sens (choisir / revenir en arrière). Aucun héros
   * attaquant (pnj/créature/démon) : `herosId` est null, ces bascules ne sont jamais affichées. */
  private toggleTierChoice(chosen: WritableSignal<boolean>, {spendOnChoose}: {spendOnChoose: boolean}): void {
    const herosId = this.data.attacker.herosId;
    if (!herosId) {
      return;
    }

    const wasChosen = chosen();
    const nextChosen = !wasChosen;
    if (spendOnChoose && nextChosen && this.heroisme() <= 0) {
      return;
    }

    const sign = spendOnChoose ? -1 : 1;
    const delta = nextChosen ? sign : -sign;
    chosen.set(nextChosen);
    applyHeroismeDelta(this.herosService, this.snackBar, herosId, this.heroisme, delta, () => chosen.set(wasChosen));
  }

  protected async rollDamage(): Promise<void> {
    this.rollingDamage.set(true);

    try {
      await this.diceBox().clear();
      const kind = this.diceKind();
      const notation = kind === 'd6m' || kind === 'd6b' ? '2d6' : '1d6';
      const results = await this.diceBox().rollNotation(notation);
      this.damageDice.set(results.map((r) => r.value));
      this.expandDamageOverride.set(false);
    } finally {
      this.rollingDamage.set(false);
    }
  }

  protected applyDamage(): void {
    const damage = this.finalDamage();
    if (damage === null) {
      return;
    }
    this.ref.close(-damage);
  }

  protected cancel(): void {
    this.ref.close(undefined);
  }
}
