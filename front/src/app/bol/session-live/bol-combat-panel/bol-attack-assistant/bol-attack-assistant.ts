import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {SelectButtonModule} from 'primeng/selectbutton';
import {SelectModule} from 'primeng/select';
import {InputNumberModule} from 'primeng/inputnumber';
import {InitiativeSlot} from '../bol-combat-panel';
import {BolCombatReferenceService} from '../../../services/bol-combat-reference.service';

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
  private readonly refService = inject(BolCombatReferenceService);

  readonly attacker = input.required<InitiativeSlot>();
  readonly allSlots = input.required<InitiativeSlot[]>();
  readonly visible = input.required<boolean>();
  readonly visibleChange = output<boolean>();

  protected readonly targetId = signal<string | null>(null);
  protected readonly attackType = signal<'melee' | 'tir'>('melee');
  protected readonly dice = signal<number | null>(null);
  protected readonly difficultyMod = signal(0);
  protected readonly advantage = signal<'normal' | 'avantage' | 'desavantage'>('normal');
  protected readonly combatOptionSlug = signal<string>('none');
  protected readonly armorChinkPenalty = signal<number>(0);
  protected readonly heroicOptionSlug1 = signal<string | null>(null);
  protected readonly heroicOptionSlug2 = signal<string | null>(null);
  protected readonly useLegendary = signal(false);

  protected readonly difficultyOptions = toSignal(this.refService.getDifficultes(), {initialValue: []});
  protected readonly combatOptions = toSignal(this.refService.getCombatOptions(), {initialValue: []});
  protected readonly heroicOptions = toSignal(this.refService.getHeroicOptions(), {initialValue: []});
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

  protected readonly selectedCombatOption = computed(() =>
    this.combatOptions().find((o) => o.slug === this.combatOptionSlug()) ?? null,
  );

  protected readonly combatOptionMod = computed(() => {
    const opt = this.selectedCombatOption();
    if (!opt) return 0;
    if (opt.modificateur_armor) return -this.armorChinkPenalty();
    return opt.modificateur;
  });

  protected readonly isArmorChink = computed(() => this.selectedCombatOption()?.modificateur_armor ?? false);

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
    this.heroicOptions().find((o) => o.slug === this.heroicOptionSlug1()) ?? null,
  );

  protected readonly heroicOption2Def = computed(() =>
    this.heroicOptions().find((o) => o.slug === this.heroicOptionSlug2()) ?? null,
  );

  protected readonly attackerHasArmeAmeliorees = computed(() =>
    this.attacker().pouvoirs.some((p) => p.avantage_attaque),
  );

  protected readonly attackerHasDevastatrices = computed(() =>
    this.attacker().pouvoirs.some((p) => p.degats_superieurs),
  );

  protected readonly targetIsIntangible = computed(() =>
    this.target()?.pouvoirs.some((p) => p.intangible) ?? false,
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
    this.combatOptionSlug.set('none');
    this.armorChinkPenalty.set(0);
    this.heroicOptionSlug1.set(null);
    this.heroicOptionSlug2.set(null);
    this.useLegendary.set(false);
    this.visibleChange.emit(false);
  }
}
