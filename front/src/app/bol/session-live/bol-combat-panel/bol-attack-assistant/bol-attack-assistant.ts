import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {SelectButtonModule} from 'primeng/selectbutton';
import {SelectModule} from 'primeng/select';
import {InputNumberModule} from 'primeng/inputnumber';
import {ArmeSlot, DamageCategorie, EtatSlot, InitiativeSlot, ParticipantType, POSTURE_TYPES, ReactionResult, effectiveDefense, makeEtat} from '../bol-combat-panel';
import {BolCombatReferenceService} from '../../../services/bol-combat-reference.service';

// Maps combat option slugs that create posture states
const POSTURE_BY_SLUG: Partial<Record<string, EtatSlot['type']>> = {
  'offensive':  'posture-off',
  'intrepid':   'intrepide',
  'defensive':  'posture-def',
  'dual-parry': 'posture-def',
};

const ETAT_LABELS: Record<EtatSlot['type'], string> = {
  'posture-off':    'Posture offensive',
  'posture-def':    'Posture défensive',
  'defense-totale': 'Défense totale',
  'intrepide':      'Intrépide',
  'a-terre':        'À terre',
  'desarme':        'Désarmé',
  'de-malus':       'Dé de malus',
  'stabilise':      'Stabilisé',
};

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

// E6: 5-level advantage/disadvantage
type AdvantageMode = 'desavantage2' | 'desavantage' | 'normal' | 'avantage' | 'avantage2';

const ADVANTAGE_OPTIONS: {label: string; value: AdvantageMode}[] = [
  {label: 'Dés.×2', value: 'desavantage2'},
  {label: 'Désav.', value: 'desavantage'},
  {label: 'Normal', value: 'normal'},
  {label: 'Avantage', value: 'avantage'},
  {label: 'Av.×2', value: 'avantage2'},
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
  readonly heroismChange = output<{id: string; delta: number}>();  // E2
  readonly stateChange = output<{id: string; etats: EtatSlot[]}[]>();  // Phase 3

  protected readonly mainsNues = MAINS_NUES;
  protected readonly selectedArme = signal<ArmeSlot | null>(null);
  protected readonly damageRoll = signal<number | null>(null);
  protected readonly armorValue = signal<number>(0);
  protected readonly targetId = signal<string | null>(null);
  protected readonly attackType = signal<'melee' | 'tir'>('melee');
  protected readonly dice = signal<number | null>(null);
  protected readonly diceDetail = signal<number[]>([]);
  protected readonly difficultyMod = signal(0);
  protected readonly advantage = signal<AdvantageMode>('normal');
  protected readonly combatOptionSlug = signal<string>('none');
  protected readonly armorChinkPenalty = signal<number>(0);
  protected readonly heroicOptionSlug1 = signal<string | null>(null);
  protected readonly heroicOptionSlug2 = signal<string | null>(null);
  protected readonly useLegendary = signal(false);
  protected readonly convertedToHeroic = signal(false);   // E3
  protected readonly echecCritiqueAccepte = signal(false); // E4
  protected readonly vigBonusOverride = signal<number | null>(null); // E5
  protected readonly carnagePending = signal(false);
  protected readonly massacrePending = signal(false);
  protected readonly massacreMax = signal(0);
  protected readonly massacreSelected = signal<Set<string>>(new Set());

  protected readonly difficultyOptions = toSignal(this.refService.getDifficultes(), {initialValue: []});
  protected readonly combatOptions = toSignal(this.refService.getCombatOptions(), {initialValue: []});
  protected readonly heroicOptions = toSignal(this.refService.getHeroicOptions(), {initialValue: []});
  protected readonly advantageOptions = ADVANTAGE_OPTIONS;

  protected readonly availableArmes = computed((): ArmeSlot[] => {
    const attacker = this.attacker();
    // E8: disarmed → only mains nues available
    if (attacker.etats.some((e) => e.type === 'desarme')) return [];
    if (attacker.armesList.length > 0) return attacker.armesList;
    if (attacker.degats) {
      return [{nom: 'Attaque', degats: attacker.degats, type: 'M', portee: null, notes: null, categorie: categorieFromDegats(attacker.degats)}];
    }
    return [];
  });

  protected readonly attackerIsDisarmed = computed(() =>
    this.attacker().etats.some((e) => e.type === 'desarme'),
  );

  protected readonly attackerEtats = computed(() =>
    this.attacker().etats.filter((e) => !POSTURE_TYPES.has(e.type) || true), // show all including postures
  );

  protected readonly targetEtats = computed(() => this.target()?.etats ?? []);

  protected readonly targetHasDeMalus = computed(() =>
    (this.target()?.etats ?? []).some((e) => e.type === 'de-malus'),
  );

  protected readonly availablePietaille = computed(() =>
    this.allSlots().filter(
      (s) => s.category === 'pietaille' && s.vitaliteCourante > 0 && s.id !== this.attacker().id,
    ),
  );

  protected readonly effectiveTargetDefense = computed(() =>
    this.target() ? effectiveDefense(this.target()!) : 0,
  );

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

  // E1: +1 bonus if attacker is a legendary hero (applies only to heroes)
  protected readonly legendaryAttackBonus = computed(() =>
    this.attacker().type === 'hero' && this.attacker().category === 'legendaire' ? 1 : 0,
  );

  protected readonly totalBonus = computed(() => {
    const a = this.attacker();
    const aptitude = this.attackAptitude();
    const agilite = a.agilite ?? 0;
    const t = this.target();
    const defense = t ? effectiveDefense(t) : 0;
    return agilite + aptitude - defense + this.difficultyMod() + this.combatOptionMod() + this.legendaryAttackBonus();
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

  // E3: heroic if 12+ OR converted via 1 PH
  protected readonly isHeroic = computed(() => (this.dice() ?? 0) >= 12 || this.convertedToHeroic());

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
    if (this.legendaryAttackBonus() > 0) parts.push('Légendaire +1');  // E1
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
      const labels: Record<AdvantageMode, string> = {
        desavantage2: 'Désavantage ×2 (4d6 ↓)',
        desavantage:  'Désavantage (3d6 ↓)',
        normal:       '',
        avantage:     'Avantage (3d6 ↑)',
        avantage2:    'Avantage ×2 (4d6 ↑)',
      };
      parts.push(labels[this.advantage()]);
    }
    return parts.length === 0 ? 'Aucun modificateur' : parts.join(' • ');
  });

  protected readonly rollStatus = computed<'pending' | 'hit' | 'miss' | 'heroic' | 'critical'>(() => {
    const d = this.dice();
    if (d === null) return 'pending';
    if (d >= 12) return 'heroic';
    if (d <= 2) return 'critical';
    if (this.convertedToHeroic()) return 'heroic';  // E3
    return this.isHit() ? 'hit' : 'miss';
  });

  protected readonly rollStatusLabel = computed(() => {
    switch (this.rollStatus()) {
      case 'pending':  return 'En attente';
      case 'hit':      return 'Touché';
      case 'miss':     return 'Échec';
      case 'heroic':   return 'Succès héroïque';
      case 'critical': return this.echecCritiqueAccepte() ? 'Échec critique' : 'Échec automatique';  // E4
    }
  });

  // E5: vigor bonus with manual override
  protected readonly vigBonusBase = computed(() => {
    const vigueur = this.attacker().vigueur ?? 0;
    const arme = this.selectedArme();
    if (!arme || arme.categorie === 'nue') return Math.floor(vigueur / 2);
    return this.attackType() === 'tir' ? Math.floor(vigueur / 2) : vigueur;
  });

  protected readonly vigBonus = computed(() => this.vigBonusOverride() ?? this.vigBonusBase());

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
      case 'avantage2':    return '4d6 — garder les 2 meilleurs';
      case 'avantage':     return '3d6 — garder les 2 meilleurs';
      case 'desavantage':  return '3d6 — garder les 2 moins bons';
      case 'desavantage2': return '4d6 — garder les 2 moins bons';
      default:             return '2d6';
    }
  });

  // E10: warnings (no blocking)
  protected readonly warnHeavyDualStrike = computed(() =>
    this.selectedArme()?.categorie === 'lourde' && this.combatOptionSlug() === 'dual-strike',
  );

  protected readonly warnHeavyLowVigueur = computed(() =>
    this.selectedArme()?.categorie === 'lourde' && (this.attacker().vigueur ?? 0) < 0,
  );

  constructor() {
    effect(() => {
      if (this.attackerHasArmeAmeliorees()) {
        this.advantage.set('avantage');
      }
    });
    effect(() => {
      void this.attacker().id;
      this.selectedArme.set(null);
      this.attackType.set('melee');
    });
    effect(() => {
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
    const count = adv === 'normal' ? 2 : (adv === 'avantage2' || adv === 'desavantage2') ? 4 : 3;
    const rolls = Array.from({length: count}, () => Math.floor(Math.random() * 6) + 1);
    const sorted = [...rolls].sort((a, b) => b - a);
    const kept = (adv === 'desavantage' || adv === 'desavantage2') ? sorted.slice(-2) : sorted.slice(0, 2);
    this.diceDetail.set(rolls);
    this.dice.set(kept[0] + kept[1]);
  }

  // E2: toggle legendary with live PH adjustment
  protected toggleLegendary(): void {
    const newVal = !this.useLegendary();
    this.heroismChange.emit({id: this.attacker().id, delta: newVal ? -1 : 1});
    this.useLegendary.set(newVal);
  }

  // E3: convert normal hit to heroic via 1 PH
  protected convertToHeroic(): void {
    this.convertedToHeroic.set(true);
    this.heroismChange.emit({id: this.attacker().id, delta: -1});
  }

  // E4: voluntary critical failure (+1 PH)
  protected toggleEchecCritique(): void {
    const newVal = !this.echecCritiqueAccepte();
    this.heroismChange.emit({id: this.attacker().id, delta: newVal ? 1 : -1});
    this.echecCritiqueAccepte.set(newVal);
  }

  protected resetRoll(): void {
    this._reverseHeroismChanges();
    this.dice.set(null);
    this.diceDetail.set([]);
    this.damageRoll.set(null);
    this.heroicOptionSlug1.set(null);
    this.heroicOptionSlug2.set(null);
    this.useLegendary.set(false);
    this.convertedToHeroic.set(false);
    this.echecCritiqueAccepte.set(false);
    this.vigBonusOverride.set(null);
    this.carnagePending.set(false);
    this.massacrePending.set(false);
    this.massacreSelected.set(new Set());
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

  protected etatLabel(etat: EtatSlot): string {
    return etat.type === 'de-malus' && etat.note ? etat.note : ETAT_LABELS[etat.type];
  }

  protected applyDamage(): void {
    const t = this.target();
    const dmg = this.totalDamage();
    if (!t || dmg === null) return;

    this.hpChange.emit({id: t.id, delta: -dmg});

    // Phase 3: build state changes for attacker (posture) and target (heroic effects)
    const changes: {id: string; etats: EtatSlot[]}[] = [];

    const postureType = POSTURE_BY_SLUG[this.combatOptionSlug()];
    if (postureType) {
      changes.push({id: this.attacker().id, etats: [makeEtat(postureType, this.attacker().id)]});
    }

    const heroicSlugs = [this.heroicOptionSlug1(), this.heroicOptionSlug2()].filter((s): s is string => !!s);
    const targetEtats: EtatSlot[] = [];
    if (heroicSlugs.includes('renversement')) {
      targetEtats.push(makeEtat('a-terre', t.id));
      targetEtats.push(makeEtat('de-malus', t.id));
    }
    if (heroicSlugs.includes('desarmement')) {
      targetEtats.push(makeEtat('desarme'));
    }
    if (heroicSlugs.includes('precis')) {
      targetEtats.push(makeEtat('de-malus', undefined, 'Coup précis'));
    }
    if (targetEtats.length > 0) changes.push({id: t.id, etats: targetEtats});

    if (changes.length > 0) this.stateChange.emit(changes);

    // Phase 4: Carnage → chain attack; Massacre → multi-select piétaille
    if (heroicSlugs.includes('carnage')) {
      this.carnagePending.set(true);
    }
    if (heroicSlugs.includes('massacre')) {
      this.massacrePending.set(true);
      this.massacreMax.set(dmg);
      this.massacreSelected.set(new Set());
    }

    this.damageRoll.set(null);
    this.dice.set(null);
    this.diceDetail.set([]);
  }

  protected continueAttack(): void {
    this.carnagePending.set(false);
    this.damageRoll.set(null);
    this.dice.set(null);
    this.diceDetail.set([]);
    this.heroicOptionSlug1.set(null);
    this.heroicOptionSlug2.set(null);
    this.useLegendary.set(false);
    this.convertedToHeroic.set(false);
    this.echecCritiqueAccepte.set(false);
    this.vigBonusOverride.set(null);
  }

  protected toggleMassacreTarget(id: string): void {
    this.massacreSelected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < this.massacreMax()) {
        next.add(id);
      }
      return next;
    });
  }

  protected confirmMassacre(): void {
    for (const id of this.massacreSelected()) {
      this.hpChange.emit({id, delta: -999});
    }
    this.massacrePending.set(false);
    this.massacreSelected.set(new Set());
  }

  protected close(): void {
    this._reverseHeroismChanges();
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
    this.convertedToHeroic.set(false);
    this.echecCritiqueAccepte.set(false);
    this.vigBonusOverride.set(null);
    this.carnagePending.set(false);
    this.massacrePending.set(false);
    this.massacreSelected.set(new Set());
    this.visibleChange.emit(false);
  }

  // Reverse any pending heroism changes before resetting state
  private _reverseHeroismChanges(): void {
    const id = this.attacker().id;
    if (this.useLegendary()) this.heroismChange.emit({id, delta: 1});
    if (this.convertedToHeroic()) this.heroismChange.emit({id, delta: 1});
    if (this.echecCritiqueAccepte()) this.heroismChange.emit({id, delta: -1});
  }
}
