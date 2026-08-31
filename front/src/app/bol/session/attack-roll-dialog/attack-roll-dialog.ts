import {ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {DiceBoxHostComponent} from '../../../shared/dice-3d/dice-box-host';
import {ResolvedCombatStats} from '../combat-attack.util';

export interface AttackRollDialogData {
  readonly attackerNom: string;
  readonly targetNom: string;
  readonly attackerAvatar: string;
  readonly targetAvatar: string;
  readonly attacker: ResolvedCombatStats;
  readonly target: ResolvedCombatStats;
}

type DegatsDiceKind = 'd3' | 'd6' | 'd6m' | 'd6b';

const DICE_LABELS: Record<DegatsDiceKind, string> = {d3: 'd3', d6: 'd6', d6m: 'd6 malus', d6b: 'd6 bonus'};

/** Seuil de réussite du jet d'attaque BoL (02-actions-combat.md) — fixe, jamais modifié par les règles. */
const THRESHOLD = 9;

/** Total du jet d'attaque : 2d6 + bonus attaquant − défense cible + modificateur − malus de petit bouclier consommé. */
export function computeAttackTotal(
  diceSum: number,
  attackerBonus: number,
  targetDefense: number,
  modifier: number,
  shieldMalus: number,
): number {
  return diceSum + attackerBonus - targetDefense + modifier - shieldMalus;
}

/**
 * Lance le jet d'attaque (2d6 + bonus attaquant − défense cible, seuil 9+) puis, en cas de succès,
 * le jet de dégâts (dé d'arme + bonus de vigueur − protection). Encapsulation désactivée à dessein,
 * même pattern que `InitiativeRollDialogComponent` (voir `panelClass: 'atd-panel'` côté appelant).
 */
@Component({
  selector: 'bol-attack-roll-dialog',
  imports: [MatDialogModule, MatIconModule, FormsModule, DiceBoxHostComponent],
  templateUrl: './attack-roll-dialog.html',
  styleUrl: './attack-roll-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AttackRollDialogComponent {
  protected readonly data = inject<AttackRollDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<AttackRollDialogComponent, number | undefined>);

  private readonly diceBox = viewChild.required(DiceBoxHostComponent);

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

  protected readonly attackTotal = computed(() => {
    const sum = this.attackDiceSum();
    if (sum === null) {
      return null;
    }
    const shieldMalus = this.shieldBonusAvailable() ? this.data.target.bouclierMalusUneAttaque : 0;
    return computeAttackTotal(sum, this.attackerBonus(), this.targetDefense(), this.modifier(), shieldMalus);
  });

  protected readonly margin = computed(() => {
    const t = this.attackTotal();
    if (t === null) {
      return null;
    }
    const value = t - THRESHOLD;
    return value >= 0 ? `+${value}` : `${value}`;
  });

  protected readonly attackSuccess = computed(() => {
    const t = this.attackTotal();
    return t !== null && t >= THRESHOLD;
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
  protected readonly protection = signal(this.data.target.protection);

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
      this.attackDice.set([a, b]);
      this.expandAttackOverride.set(false);
    } finally {
      this.rollingAttack.set(false);
    }
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
