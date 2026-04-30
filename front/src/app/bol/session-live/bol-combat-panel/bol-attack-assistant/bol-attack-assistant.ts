import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal} from '@angular/core';
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

interface CombatOptionDef {
  label: string;
  value: string;
  mod: number | 'armor';
  note: string;
}

interface HeroicOptionDef {
  label: string;
  value: string;
  desc: string;
}

const HEROIC_OPTIONS: HeroicOptionDef[] = [
  {label: 'Carnage', value: 'carnage', desc: 'Attaque supplémentaire immédiate'},
  {label: 'Coup dévastateur', value: 'devastateur', desc: '+6 dégâts'},
  {label: 'Coup précis', value: 'precis', desc: 'Dégâts normaux + dé de malus sur un jet (accord MJ)'},
  {label: 'Désarmement', value: 'desarmement', desc: 'Adversaire perd son arme (pas de dégâts)'},
  {label: 'Massacrer la piétaille', value: 'massacre', desc: 'Dégâts = nombre de piétaille mis hors combat'},
  {label: 'Renversement', value: 'renversement', desc: 'Adversaire à terre, dé de malus à sa prochaine action'},
];

const COMBAT_OPTIONS: CombatOptionDef[] = [
  {label: 'Aucune', value: 'none', mod: 0, note: ''},
  {label: 'Posture offensive', value: 'offensive', mod: 1, note: '+1 atk / −1 déf'},
  {label: 'Attaque intrépide', value: 'intrepid', mod: 2, note: '+2 atk / −2 déf, perd bouclier'},
  {label: 'Posture défensive', value: 'defensive', mod: -1, note: '−1 atk / +1 déf'},
  {label: 'Combat 2 armes — parade', value: 'dual-parry', mod: -1, note: '−1 atk / +1 déf'},
  {label: 'Combat 2 armes — double frappe', value: 'dual-strike', mod: -1, note: '−1 atk / dégâts +1 catégorie'},
  {label: 'Attaque au défaut de l\'armure', value: 'armor-chink', mod: 'armor', note: 'Si touché : ignore l\'armure'},
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
  protected readonly combatOption = signal<string>('none');
  protected readonly armorChinkPenalty = signal<number>(0);
  protected readonly heroicOption1 = signal<string | null>(null);
  protected readonly heroicOption2 = signal<string | null>(null);
  protected readonly useLegendary = signal(false);

  protected readonly difficultyOptions = DIFFICULTY_OPTIONS;
  protected readonly advantageOptions = ADVANTAGE_OPTIONS;
  protected readonly combatOptions = COMBAT_OPTIONS;
  protected readonly heroicOptions = HEROIC_OPTIONS;

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

  protected readonly selectedCombatOption = computed(() =>
    COMBAT_OPTIONS.find((o) => o.value === this.combatOption()) ?? COMBAT_OPTIONS[0],
  );

  protected readonly combatOptionMod = computed(() => {
    const opt = this.selectedCombatOption();
    if (opt.mod === 'armor') return -this.armorChinkPenalty();
    return opt.mod;
  });

  protected readonly isArmorChink = computed(() => this.combatOption() === 'armor-chink');

  protected readonly totalBonus = computed(() => {
    const a = this.attacker();
    const aptitude = this.attackAptitude();
    const agilite = a.agilite ?? 0;
    const defense = this.target()?.defense ?? 0;
    return agilite + aptitude - defense + this.difficultyMod() + this.combatOptionMod();
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

  protected readonly hasHeroism = computed(() => (this.attacker().heroismCourant ?? 0) > 0);

  protected readonly heroicOption1Def = computed(() =>
    HEROIC_OPTIONS.find((o) => o.value === this.heroicOption1()) ?? null,
  );

  protected readonly heroicOption2Def = computed(() =>
    HEROIC_OPTIONS.find((o) => o.value === this.heroicOption2()) ?? null,
  );

  protected readonly attackerHasArmeAmeliorees = computed(() =>
    this.attacker().pouvoirs.includes('Armes améliorées'),
  );

  protected readonly attackerHasDevastatrices = computed(() =>
    this.attacker().pouvoirs.includes('Attaques dévastatrices'),
  );

  protected readonly targetIsIntangible = computed(() =>
    this.target()?.pouvoirs.includes('Intangible') ?? false,
  );

  constructor() {
    effect(() => {
      if (this.attackerHasArmeAmeliorees()) {
        this.advantage.set('avantage');
      }
    });
  }

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
    this.combatOption.set('none');
    this.armorChinkPenalty.set(0);
    this.heroicOption1.set(null);
    this.heroicOption2.set(null);
    this.useLegendary.set(false);
    this.visibleChange.emit(false);
  }
}
