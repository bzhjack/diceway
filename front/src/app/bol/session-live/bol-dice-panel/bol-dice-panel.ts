import {ChangeDetectionStrategy, Component, signal, viewChild} from '@angular/core';
import type {DiceBoxRollDie, DiceBoxRollGroup} from '@3d-dice/dice-box';
import {DiceBoxHostComponent} from '../../../shared/dice-3d/dice-box-host';

type BolRollMode = 'standard' | 'bonus' | 'malus';
type RollTone = 'neutral' | 'success' | 'danger';

interface ModeOption {
  readonly label: string;
  readonly value: BolRollMode;
}

interface QuickPreset {
  readonly label: string;
  readonly notation: string;
}

interface RollDieView {
  readonly id: string;
  readonly kept: boolean;
  readonly value: number;
}

interface RollSummary {
  readonly detail: string;
  readonly dice: readonly RollDieView[];
  readonly headline: string;
  readonly label: string;
  readonly tone: RollTone;
  readonly totalLabel: string;
}

@Component({
  selector: 'app-bol-dice-panel',
  imports: [DiceBoxHostComponent],
  templateUrl: './bol-dice-panel.html',
  styleUrl: './bol-dice-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolDicePanelComponent {
  private readonly diceBoxHost = viewChild.required(DiceBoxHostComponent);

  protected readonly mode = signal<BolRollMode>('standard');
  protected readonly modifier = signal(0);
  protected readonly target = signal(9);
  protected readonly rolling = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly lastRoll = signal<RollSummary | null>(null);

  protected readonly modeOptions: readonly ModeOption[] = [
    {label: 'Standard', value: 'standard'},
    {label: 'Bonus', value: 'bonus'},
    {label: 'Malus', value: 'malus'},
  ];

  protected readonly quickPresets: readonly QuickPreset[] = [
    {label: 'd6', notation: '1d6'},
    {label: '2d6', notation: '2d6'},
    {label: 'd8', notation: '1d8'},
    {label: 'd10', notation: '1d10'},
    {label: 'd12', notation: '1d12'},
    {label: 'd20', notation: '1d20'},
  ];

  protected selectMode(mode: BolRollMode): void {
    this.mode.set(mode);
  }

  protected updateModifier(event: Event): void {
    this.modifier.set(this.readNumericInput(event, 0));
  }

  protected updateTarget(event: Event): void {
    this.target.set(this.readNumericInput(event, 9));
  }

  protected async rollBolAction(): Promise<void> {
    this.errorMessage.set('');
    this.rolling.set(true);

    try {
      const diceCount = this.mode() === 'standard' ? 2 : 3;
      const result = await this.roll(`${diceCount}d6`);
      const dice = this.extractDice(result);
      const keptIds = this.resolveKeptRollIds(dice);
      const keptDice = dice.filter((die) => keptIds.has(die.rollId));
      const keptTotal = keptDice.reduce((total, die) => total + die.value, 0);
      const finalTotal = keptTotal + this.modifier();
      const critical =
        keptDice.every((die) => die.value === 6)
          ? 'success'
          : keptDice.every((die) => die.value === 1)
            ? 'failure'
            : null;
      const success = critical === 'success' || (critical !== 'failure' && finalTotal >= this.target());
      const modifierLabel = this.modifier() === 0 ? 'sans modificateur' : `avec ${this.formatModifier(this.modifier())}`;
      const statusLabel =
        critical === 'success'
          ? 'Critique automatique'
          : critical === 'failure'
            ? 'Échec critique'
            : success
              ? 'Réussite'
              : 'Échec';

      this.lastRoll.set({
        label: 'Jet BoL',
        headline: `${statusLabel} · seuil ${this.target()}`,
        totalLabel: `${finalTotal}`,
        tone: success ? 'success' : 'danger',
        detail: `${keptDice.map((die) => die.value).join(' + ')} ${modifierLabel}. Mode ${this.mode()}.`,
        dice: dice.map((die) => ({
          id: die.rollId,
          kept: keptIds.has(die.rollId),
          value: die.value,
        })),
      });
    } catch (error) {
      console.error('BoL roll failed', error);
      this.errorMessage.set('Le jet BoL a échoué. Vérifie que les assets 3D sont bien chargés.');
    } finally {
      this.rolling.set(false);
    }
  }

  protected async rollQuickPreset(notation: string, label: string): Promise<void> {
    this.errorMessage.set('');
    this.rolling.set(true);

    try {
      const result = await this.roll(notation);
      const dice = this.extractDice(result);
      const total = result[0]?.value ?? dice.reduce((sum, die) => sum + die.value, 0);

      this.lastRoll.set({
        label: label,
        headline: `Lancer rapide · ${notation}`,
        totalLabel: `${total}`,
        tone: 'neutral',
        detail: `${dice.map((die) => die.value).join(' + ')} = ${total}`,
        dice: dice.map((die) => ({
          id: die.rollId,
          kept: true,
          value: die.value,
        })),
      });
    } catch (error) {
      console.error('Quick roll failed', error);
      this.errorMessage.set(`Le lancer ${notation} a échoué.`);
    } finally {
      this.rolling.set(false);
    }
  }

  protected async clearTray(): Promise<void> {
    this.lastRoll.set(null);
    this.errorMessage.set('');
    await this.diceBoxHost().clear();
  }

  private async roll(notation: string): Promise<DiceBoxRollGroup[]> {
    return this.diceBoxHost().rollNotation(notation);
  }

  private extractDice(result: DiceBoxRollGroup[]): DiceBoxRollDie[] {
    return result[0]?.rolls ?? [];
  }

  private resolveKeptRollIds(dice: DiceBoxRollDie[]): Set<string> {
    if (this.mode() === 'standard') {
      return new Set(dice.map((die) => die.rollId));
    }

    const rankedDice = [...dice].sort((left, right) =>
      this.mode() === 'bonus' ? right.value - left.value : left.value - right.value,
    );

    return new Set(rankedDice.slice(0, 2).map((die) => die.rollId));
  }

  private readNumericInput(event: Event, fallback: number): number {
    const input = event.target as HTMLInputElement | null;
    const value = Number(input?.value ?? fallback);
    return Number.isFinite(value) ? value : fallback;
  }

  private formatModifier(value: number): string {
    return value > 0 ? `+${value}` : `${value}`;
  }
}
