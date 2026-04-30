import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {SelectButtonModule} from 'primeng/selectbutton';
import {SelectModule} from 'primeng/select';
import {InputNumberModule} from 'primeng/inputnumber';
import {InitiativeSlot} from '../bol-combat-panel';

interface DifficultyOption {
  label: string;
  value: number;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {label: 'Très facile +2', value: 2},
  {label: 'Facile +1', value: 1},
  {label: 'Moyenne 0', value: 0},
  {label: 'Ardue −1', value: -1},
  {label: 'Difficile −2', value: -2},
  {label: 'Très difficile −4', value: -4},
  {label: 'Impossible −6', value: -6},
  {label: 'Héroïque −8', value: -8},
];

const ADVANTAGE_OPTIONS = [
  {label: 'Désav.', value: 'desavantage'},
  {label: 'Normal', value: 'normal'},
  {label: 'Avantage', value: 'avantage'},
];

@Component({
  selector: 'app-bol-attack-assistant',
  imports: [FormsModule, ButtonModule, DialogModule, SelectButtonModule, SelectModule, InputNumberModule],
  templateUrl: './bol-attack-assistant.html',
  styleUrl: './bol-attack-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolAttackAssistantComponent {
  readonly attacker = input.required<InitiativeSlot>();
  readonly allSlots = input.required<InitiativeSlot[]>();
  readonly visible = input.required<boolean>();
  readonly visibleChange = output<boolean>();

  protected readonly targetId = signal<string | null>(null);
  protected readonly attackType = signal<'melee' | 'tir'>('melee');
  protected readonly dice = signal<number | null>(null);
  protected readonly difficultyMod = signal(0);
  protected readonly advantage = signal<'normal' | 'avantage' | 'desavantage'>('normal');

  protected readonly difficultyOptions = DIFFICULTY_OPTIONS;
  protected readonly advantageOptions = ADVANTAGE_OPTIONS;

  protected readonly targets = computed(() =>
    this.allSlots()
      .filter((s) => s.id !== this.attacker().id)
      .map((s) => ({label: s.nom, value: s.id})),
  );

  protected readonly target = computed(() => {
    const id = this.targetId();
    return id ? (this.allSlots().find((s) => s.id === id) ?? null) : null;
  });

  protected readonly hasTir = computed(() => (this.attacker().tir ?? 0) !== 0);

  protected readonly attackAptitude = computed(() => {
    const a = this.attacker();
    return this.attackType() === 'melee' ? (a.melee ?? 0) : (a.tir ?? 0);
  });

  protected readonly totalBonus = computed(() => {
    const a = this.attacker();
    const aptitude = this.attackAptitude();
    const agilite = a.agilite ?? 0;
    const defense = this.target()?.defense ?? 0;
    return agilite + aptitude - defense + this.difficultyMod();
  });

  protected readonly total = computed(() => {
    const d = this.dice();
    return d !== null ? d + this.totalBonus() : null;
  });

  protected readonly isHit = computed(() => {
    const d = this.dice();
    const t = this.total();
    if (d === null || t === null) return null;
    if (d === 2) return false;
    if (d === 12) return true;
    return t >= 9;
  });

  protected readonly isHeroic = computed(() => this.dice() === 12);

  protected readonly advantageDiceLabel = computed(() => {
    switch (this.advantage()) {
      case 'avantage': return '3d6 garder les 2 meilleurs';
      case 'desavantage': return '3d6 garder les 2 moins bons';
      default: return '2d6';
    }
  });

  protected close(): void {
    this.targetId.set(null);
    this.attackType.set('melee');
    this.dice.set(null);
    this.difficultyMod.set(0);
    this.advantage.set('normal');
    this.visibleChange.emit(false);
  }
}
