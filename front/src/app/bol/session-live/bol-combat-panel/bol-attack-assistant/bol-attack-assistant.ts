import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {SelectButtonModule} from 'primeng/selectbutton';
import {SelectModule} from 'primeng/select';
import {InputNumberModule} from 'primeng/inputnumber';
import {ArmeSlot, DamageCategorie, InitiativeSlot, ParticipantType, ReactionResult} from '../bol-combat-panel';
import {BolCombatReferenceService} from '../../../services/bol-combat-reference.service';

const MAINS_NUES: ArmeSlot = {nom: 'Mains nues', degats: 'd3', type: 'M', portee: null, notes: null, categorie: 'nue'};

function categorieFromDegats(degats: string | null): DamageCategorie | null {
  if (!degats) return null;
  if (degats.startsWith('d3'))  return 'nue';
  if (degats.startsWith('d6M')) return 'legere';
  if (degats.startsWith('d6B')) return 'lourde';
  if (degats.startsWith('d6'))  return 'moyenne';
  return null;
}

function protectionFixed(s: string | null): number {
  if (!s) return 0;
  const parens = s.match(/\((\d+)\)/);
  if (parens) return parseInt(parens[1], 10);
  const num = s.match(/^\+?(\d+)$/);
  if (num) return parseInt(num[1], 10);
  return 0;
}

const ADVANTAGE_OPTIONS = [
  {label: 'Désavantage', value: 'desavantage'},
  {label: 'Normal', value: 'normal'},
  {label: 'Avantage', value: 'avantage'},
];

const TYPE_LABELS: Record<ParticipantType, string> = {
  hero: 'PJ',
  creature: 'Créature',
  demon: 'Démon',
  pnj: 'PNJ',
};

const REACTION_LABELS: Record<ReactionResult, string> = {
  'legendaire': 'Légendaire',
  'heroique': 'Héroïque',
  'reussite': 'Réussite',
  'echec': 'Échec',
  'echec-critique': 'Échec critique',
  'rival': 'Rival',
  'coriace': 'Coriace',
  'pietaille': 'Piétaille',
};

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
  readonly hpChange = output<{id: string; delta: number}>();

  protected readonly mainsNues = MAINS_NUES;
  protected readonly selectedArme = signal<ArmeSlot | null>(null);
  protected readonly damageRoll = signal<number | null>(null);
  protected readonly armorValue = signal<number>(0);
  protected readonly targetId = signal<string | null>(null);
  protected readonly attackType = signal<'melee' | 'tir'>('melee');
  protected readonly dice = signal<number | null>(null);
  protected readonly diceDetail = signal<number[]>([]);
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

  protected readonly availableArmes = computed((): ArmeSlot[] => {
    const attacker = this.attacker();
    if (attacker.armesList.length > 0) return attacker.armesList;
    if (attacker.degats) {
      return [{nom: 'Attaque', degats: attacker.degats, type: 'M', portee: null, notes: null, categorie: categorieFromDegats(attacker.degats)}];
    }
    return [];
  });

  protected readonly showTypeToggle = computed(() => {
    const arme = this.selectedArme();
    return !arme || arme.type === null;
  });

  protected readonly target = computed(() => {
    const id = this.targetId();
    return id ? (this.allSlots().find((s) => s.id === id) ?? null) : null;
  });

  protected readonly targetCards = computed(() =>
    this.allSlots()
      .filter((s) => s.id !== this.attacker().id)
      .map((s, idx) => ({
        slot: s,
        order: idx + 1,
        typeLabel: TYPE_LABELS[s.type],
        categoryLabel: s.category ? REACTION_LABELS[s.category] : null,
      })),
  );

  protected readonly targetTypeText = computed(() => {
    const t = this.target();
    if (!t) return '';
    const parts: string[] = [TYPE_LABELS[t.type]];
    if (t.category) parts.push(REACTION_LABELS[t.category]);
    return parts.join(' • ');
  });

  protected readonly hasTir = computed(() => (this.attacker().tir ?? 0) !== 0);

  protected readonly attackAptitude = computed(() => {
    const a = this.attacker();
    return this.attackType() === 'melee' ? (a.melee ?? 0) : (a.tir ?? 0);
  });

  protected readonly attackAptitudeLabel = computed(() => this.attackType() === 'melee' ? 'Mêlée' : 'Tir');

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
    if (d <= 2) return false;
    if (d >= 12) return true;
    return t >= 9;
  });

  protected readonly isHeroic = computed(() => (this.dice() ?? 0) >= 12);

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

  protected readonly bonusSummary = computed(() => {
    const parts: string[] = [];
    if (this.difficultyMod() !== 0) {
      const d = this.difficultyOptions().find((o) => o.modificateur === this.difficultyMod());
      const sign = this.difficultyMod() > 0 ? '+' : '';
      parts.push(`${d?.label ?? 'Difficulté'} ${sign}${this.difficultyMod()}`);
    }
    if (this.combatOptionMod() !== 0) {
      const opt = this.selectedCombatOption();
      const sign = this.combatOptionMod() > 0 ? '+' : '';
      parts.push(`${opt?.label ?? 'Option'} ${sign}${this.combatOptionMod()}`);
    }
    if (this.advantage() !== 'normal') {
      parts.push(this.advantage() === 'avantage' ? 'Avantage (3d6 ↑)' : 'Désavantage (3d6 ↓)');
    }
    return parts.length === 0 ? 'Aucun modificateur' : parts.join(' • ');
  });

  protected readonly rollStatus = computed<'pending' | 'hit' | 'miss' | 'heroic' | 'critical'>(() => {
    const d = this.dice();
    if (d === null) return 'pending';
    if (d >= 12) return 'heroic';
    if (d <= 2) return 'critical';
    return this.isHit() ? 'hit' : 'miss';
  });

  protected readonly rollStatusLabel = computed(() => {
    switch (this.rollStatus()) {
      case 'pending':  return 'En attente';
      case 'hit':      return 'Touché';
      case 'miss':     return 'Échec';
      case 'heroic':   return 'Succès héroïque';
      case 'critical': return 'Échec critique';
    }
  });

  constructor() {
    effect(() => {
      if (this.attackerHasArmeAmeliorees()) {
        this.advantage.set('avantage');
      }
    });
    effect(() => {
      // Reset weapon selection when attacker changes (new dialog open)
      void this.attacker().id;
      this.selectedArme.set(null);
      this.attackType.set('melee');
    });
    effect(() => {
      // Pre-fill armor value with fixed protection when target changes
      void this.targetId();
      this.armorValue.set(untracked(() => this.targetArmorFixed()));
    });
  }

  protected selectArme(arme: ArmeSlot): void {
    this.selectedArme.set(arme);
    if (arme.type === 'T') this.attackType.set('tir');
    else this.attackType.set('melee');
  }

  protected rollDice(): void {
    const adv = this.advantage();
    const count = adv === 'normal' ? 2 : 3;
    const rolls = Array.from({length: count}, () => Math.floor(Math.random() * 6) + 1);
    const sorted = [...rolls].sort((a, b) => b - a);
    const kept = adv === 'desavantage' ? sorted.slice(-2) : sorted.slice(0, 2);
    this.diceDetail.set(rolls);
    this.dice.set(kept[0] + kept[1]);
  }

  protected resetRoll(): void {
    this.dice.set(null);
    this.diceDetail.set([]);
    this.damageRoll.set(null);
    this.heroicOptionSlug1.set(null);
    this.heroicOptionSlug2.set(null);
    this.useLegendary.set(false);
  }

  protected readonly defautArmure = computed(() => this.combatOptionSlug() === 'armor-chink');

  protected readonly effectiveDamageCategorie = computed((): DamageCategorie => {
    const ORDER: DamageCategorie[] = ['nue', 'legere', 'moyenne', 'lourde'];
    let idx = ORDER.indexOf(this.selectedArme()?.categorie ?? 'nue');
    if (this.combatOptionSlug() === 'dual-strike' && idx < 3) idx++;
    if (this.attackerHasDevastatrices() && idx < 3) idx++;
    return ORDER[Math.min(idx, 3)];
  });

  protected readonly damageDiceLabel = computed(() => {
    switch (this.effectiveDamageCategorie()) {
      case 'nue':     return 'd3';
      case 'legere':  return '2d6 garder le moins bon';
      case 'moyenne': return '1d6';
      case 'lourde':  return '2d6 garder le meilleur';
    }
  });

  protected readonly vigBonus = computed(() => {
    const vigueur = this.attacker().vigueur ?? 0;
    const arme = this.selectedArme();
    if (!arme || arme.categorie === 'nue') return Math.floor(vigueur / 2);
    return this.attackType() === 'tir' ? Math.floor(vigueur / 2) : vigueur;
  });

  protected readonly targetArmorFixed = computed(() =>
    (this.target()?.armures ?? []).reduce((sum, a) => sum + protectionFixed(a.protection), 0),
  );

  protected readonly targetHasArmor = computed(() =>
    !this.defautArmure() && (this.target()?.armures ?? []).length > 0,
  );

  protected readonly totalDamage = computed(() => {
    const roll = this.damageRoll();
    if (roll === null) return null;
    let base = roll + this.vigBonus();
    if ([this.heroicOptionSlug1(), this.heroicOptionSlug2()].some((s) => s === 'devastateur')) base += 6;
    const armor = this.defautArmure() ? 0 : this.armorValue();
    return Math.max(0, base - armor);
  });

  protected readonly advantageDiceLabel = computed(() => {
    switch (this.advantage()) {
      case 'avantage': return '3d6 — garder les 2 meilleurs';
      case 'desavantage': return '3d6 — garder les 2 moins bons';
      default: return '2d6';
    }
  });

  protected applyDamage(): void {
    const t = this.target();
    const dmg = this.totalDamage();
    if (!t || dmg === null) return;
    this.hpChange.emit({id: t.id, delta: -dmg});
    this.damageRoll.set(null);
    this.dice.set(null);
    this.diceDetail.set([]);
  }

  protected close(): void {
    this.selectedArme.set(null);
    this.damageRoll.set(null);
    this.armorValue.set(0);
    this.targetId.set(null);
    this.attackType.set('melee');
    this.dice.set(null);
    this.diceDetail.set([]);
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
