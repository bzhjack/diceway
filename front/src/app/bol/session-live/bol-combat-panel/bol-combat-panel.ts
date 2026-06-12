import {ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked, viewChild} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {DialogModule} from 'primeng/dialog';
import {FormsModule} from '@angular/forms';
import {BolAttackAssistantComponent} from './bol-attack-assistant/bol-attack-assistant';
import {BolCombatGridComponent} from './bol-combat-grid/bol-combat-grid';
import {BolRollPhaseComponent} from './bol-roll-phase/bol-roll-phase';
import {INITIATIVE_ORDER, TYPE_LABELS} from './combat.constants';
import {BolCombatStorageService, CombatSnapshot} from '../../services/bol-combat-storage.service';
export type {CombatSnapshot};

export type ParticipantType = 'hero' | 'creature' | 'demon' | 'pnj';
export type ReactionResult =
  | 'legendaire'
  | 'heroique'
  | 'reussite'
  | 'rival'
  | 'coriace'
  | 'echec'
  | 'pietaille'
  | 'echec-critique';

export interface PouvoirSlot {
  readonly nom: string;
  readonly description: string | null;
  readonly avantage_attaque: boolean;
  readonly degats_superieurs: boolean;
  readonly regeneration: boolean;
  readonly intangible: boolean;
  readonly avertissement_combat: boolean;
}

export type DamageCategorie = 'nue' | 'legere' | 'moyenne' | 'lourde';

export interface ArmeSlot {
  readonly nom: string;
  readonly degats: string | null;
  readonly type: 'M' | 'T' | null;
  readonly portee: string | null;
  readonly notes: string | null;
  readonly categorie: DamageCategorie | null;
}

export interface EtatSlot {
  readonly id: string;
  readonly type:
    | 'posture-off'
    | 'posture-def'
    | 'defense-totale'
    | 'intrepide'
    | 'a-terre'
    | 'desarme'
    | 'de-malus'
    | 'stabilise';
  readonly note?: string;
  readonly expiresAtTurnOf?: string;
}

export interface InitiativeSlot {
  readonly id: string;
  readonly nom: string;
  readonly avatar: string | null;
  readonly type: ParticipantType;
  readonly vitaliteMax: number;
  readonly heroismMax: number | null;
  readonly vigueur: number | null;
  readonly agilite: number | null;
  readonly esprit: number | null;
  readonly initiative: number | null;
  readonly melee: number | null;
  readonly tir: number | null;
  readonly defense: number | null;
  readonly degats: string | null;
  readonly tags: string[];
  readonly pouvoirs: PouvoirSlot[];
  readonly armesList: ArmeSlot[];
  readonly armures: {nom: string; protection: string | null; malus: string | null}[];
  category: ReactionResult | null;
  vitaliteCourante: number;
  heroismCourant: number | null;
  etats: EtatSlot[];
}

// ── Defense helpers ───────────────────────────────────────────────────────────

const ETAT_DEFENSE_DELTA: Partial<Record<EtatSlot['type'], number>> = {
  'posture-off':    -1,
  'intrepide':      -2,
  'posture-def':    +1,
  'defense-totale': +2,
};

export const POSTURE_TYPES: ReadonlySet<EtatSlot['type']> = new Set([
  'posture-off', 'posture-def', 'defense-totale', 'intrepide',
]);

export function effectiveDefense(slot: {defense: number | null; etats: EtatSlot[]}): number {
  const base = slot.defense ?? 0;
  return slot.etats.reduce((sum, e) => sum + (ETAT_DEFENSE_DELTA[e.type] ?? 0), base);
}

export function makeEtat(
  type: EtatSlot['type'],
  expiresAtTurnOf?: string,
  note?: string,
): EtatSlot {
  return {id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, expiresAtTurnOf, note};
}

@Component({
  selector: 'app-bol-combat-panel',
  imports: [FormsModule, ButtonModule, CardModule, CheckboxModule, DialogModule, BolAttackAssistantComponent, BolCombatGridComponent, BolRollPhaseComponent],
  templateUrl: './bol-combat-panel.html',
  styleUrl: './bol-combat-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class BolCombatPanelComponent {
  readonly participants = input.required<InitiativeSlot[]>();
  readonly scenarioId = input<string | null>(null);
  readonly initialSnapshot = input<CombatSnapshot | null>(null);
  readonly combatEnded = output<void>();

  private readonly storage = inject(BolCombatStorageService);
  private readonly rollPhaseRef = viewChild(BolRollPhaseComponent);

  protected readonly initiativeOrder = signal<InitiativeSlot[]>([]);
  protected readonly attackerSlot = signal<InitiativeSlot | null>(null);
  protected readonly selectedParticipantId = signal<string | null>(null);
  protected readonly rollPhase = signal(false);
  protected readonly rulesDialogVisible = signal(false);
  protected readonly endCombatDialogVisible = signal(false);
  protected readonly allHeroesRolled = signal(false);
  protected readonly currentRound = signal(1);
  protected readonly activeTurnId = signal<string | null>(null);
  protected readonly delayedIds = signal<Set<string>>(new Set());
  protected readonly brawlIds = signal<Set<string>>(new Set());
  private readonly lastDamageById = signal<Record<string, number>>({});

  protected readonly availableParticipants = computed(() => {
    const inOrder = new Set(this.initiativeOrder().map((s) => s.id));
    return this.participants().filter((p) => !inOrder.has(p.id));
  });

  protected readonly availableParticipantOptions = computed(() =>
    this.availableParticipants().map((p) => ({
      label: `${p.nom} — ${TYPE_LABELS[p.type]}`,
      value: p.id,
    })),
  );

  protected readonly sortedInitiative = computed(() =>
    [...this.initiativeOrder()].sort((a, b) => {
      const orderA = a.category != null ? INITIATIVE_ORDER[a.category] : 99;
      const orderB = b.category != null ? INITIATIVE_ORDER[b.category] : 99;
      return orderA - orderB;
    }),
  );

  protected readonly round1Blocked = computed(() =>
    this.initiativeOrder().some(
      (s) => s.type === 'hero' && (s.category === 'heroique' || s.category === 'legendaire'),
    ),
  );

  protected readonly legendaryBonus = computed(() =>
    this.initiativeOrder().some((s) => s.type === 'hero' && s.category === 'legendaire'),
  );

  protected readonly heroesInOrder = computed(() =>
    this.initiativeOrder().filter((s) => s.type === 'hero'),
  );

  protected readonly initiativeConfirmed = computed(() =>
    this.heroesInOrder().length > 0 && this.heroesInOrder().every((s) => s.category !== null),
  );

  protected readonly nonHeroesInOrder = computed(() =>
    this.initiativeOrder().filter((s) => s.type !== 'hero'),
  );

  protected readonly turnOrder = computed((): InitiativeSlot[] => {
    const round = this.currentRound();
    const delayed = this.delayedIds();
    const base = this.sortedInitiative().filter((s) => {
      if (s.vitaliteCourante <= 0) return false;
      if (round === 1) {
        if (s.category === 'echec-critique') return false;
        if (this.round1Blocked() && (s.category === 'coriace' || s.category === 'pietaille')) return false;
      }
      return true;
    });
    const normal = base.filter((s) => !delayed.has(s.id));
    const delayedSlots = base.filter((s) => delayed.has(s.id));
    return [...normal, ...delayedSlots];
  });

  protected readonly activeTurnIndex = computed(() =>
    this.turnOrder().findIndex((s) => s.id === this.activeTurnId()),
  );

  protected readonly recoveryRows = computed(() =>
    this.initiativeOrder().map((s) => {
      const brawl = this.brawlIds().has(s.id);
      const lost = s.vitaliteMax - Math.max(0, s.vitaliteCourante);
      let recovery = 0;
      let note = '';
      if (s.vitaliteCourante < 0) {
        recovery = 0;
        note = 'Soins requis';
      } else {
        recovery = brawl ? lost : Math.ceil(lost / 2);
      }
      return {slot: s, lost, recovery, note, brawl};
    }),
  );

  constructor() {
    // Restore from snapshot when provided (resume flow)
    effect(() => {
      const snap = this.initialSnapshot();
      if (!snap) return;
      untracked(() => {
        const ps = this.participants();
        const restored: InitiativeSlot[] = snap.initiativeIds
          .map((id) => ps.find((p) => p.id === id))
          .filter((p): p is InitiativeSlot => !!p)
          .map((p) => {
            const state = snap.slotStates[p.id];
            return state ? {...p, ...state} : p;
          });
        this.initiativeOrder.set(restored);
        this.currentRound.set(snap.round);
        this.activeTurnId.set(snap.activeTurnId);
        this.delayedIds.set(new Set(snap.delayedIds));
      });
    });

    // Auto-save after initiative is confirmed
    effect(() => {
      const id = this.scenarioId();
      if (!id || !this.initiativeConfirmed()) return;
      const snap: CombatSnapshot = {
        scenarioId: id,
        round: this.currentRound(),
        activeTurnId: this.activeTurnId(),
        delayedIds: [...this.delayedIds()],
        initiativeIds: this.initiativeOrder().map((s) => s.id),
        slotStates: Object.fromEntries(
          this.initiativeOrder().map((s) => [
            s.id,
            {vitaliteCourante: s.vitaliteCourante, heroismCourant: s.heroismCourant, category: s.category, etats: s.etats},
          ]),
        ),
      };
      this.storage.save(id, snap);
    });
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  protected addToInitiative(): void {
    const id = this.selectedParticipantId();
    if (!id) return;
    const participant = this.participants().find((p) => p.id === id);
    if (!participant) return;
    this.initiativeOrder.update((list) => [...list, participant]);
    const next = this.availableParticipants().find((p) => p.id !== id);
    this.selectedParticipantId.set(next?.id ?? null);
  }

  protected adjustHp(id: string, delta: number): void {
    if (delta < 0) {
      this.lastDamageById.update((m) => ({...m, [id]: -delta}));
    }
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === id
          ? {...s, vitaliteCourante: Math.max(-10, Math.min(s.vitaliteMax, s.vitaliteCourante + delta))}
          : s,
      ),
    );
  }

  protected adjustHeroism(id: string, delta: number): void {
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === id && s.heroismMax != null
          ? {...s, heroismCourant: Math.max(0, Math.min(s.heroismMax, (s.heroismCourant ?? 0) + delta))}
          : s,
      ),
    );
  }

  // Adds states to a slot; posture types are mutually exclusive
  protected adjustStates(id: string, etats: EtatSlot[]): void {
    const hasPosture = etats.some((e) => POSTURE_TYPES.has(e.type));
    this.initiativeOrder.update((list) =>
      list.map((s) => {
        if (s.id !== id) return s;
        const existing = hasPosture ? s.etats.filter((e) => !POSTURE_TYPES.has(e.type)) : s.etats;
        return {...s, etats: [...existing, ...etats]};
      }),
    );
  }

  protected removeEtat(slotId: string, etatId: string): void {
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === slotId ? {...s, etats: s.etats.filter((e) => e.id !== etatId)} : s,
      ),
    );
  }

  protected onStateChanges(changes: {id: string; etats: EtatSlot[]}[]): void {
    for (const c of changes) this.adjustStates(c.id, c.etats);
  }

  // Défense totale: apply state and advance turn
  protected defenseTotale(id: string): void {
    this.adjustStates(id, [makeEtat('defense-totale', id)]);
    this.advanceTurn();
  }

  protected removeFromInitiative(id: string): void {
    this.initiativeOrder.update((list) => list.filter((s) => s.id !== id));
  }

  // ── Turn flow ────────────────────────────────────────────────────────────────

  protected startRollPhase(): void {
    this.allHeroesRolled.set(false);
    this.rollPhase.set(true);
  }

  protected startNewRound(): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => {
        let next = s.vitaliteCourante < 0 ? {...s, vitaliteCourante: s.vitaliteCourante - 1} : s;
        if (next.pouvoirs.some((p) => p.regeneration)) {
          next = {...next, vitaliteCourante: Math.min(next.vitaliteMax, next.vitaliteCourante + 1)};
        }
        return next;
      }),
    );
    this.currentRound.update((r) => r + 1);
    this.delayedIds.set(new Set());
    const firstId = this.turnOrder()[0]?.id ?? null;
    if (firstId) this._purgeExpiringStates(firstId);
    this.activeTurnId.set(firstId);
  }

  protected advanceTurn(): void {
    const order = this.turnOrder();
    if (order.length === 0) return;
    const idx = this.activeTurnIndex();
    if (idx === -1 || idx >= order.length - 1) {
      this.startNewRound();
    } else {
      const nextId = order[idx + 1].id;
      this._purgeExpiringStates(nextId);
      this.activeTurnId.set(nextId);
    }
  }

  protected delayTurn(id: string): void {
    const orderBefore = this.turnOrder();
    const idx = orderBefore.findIndex((s) => s.id === id);
    const nextSlot = idx >= 0 && idx < orderBefore.length - 1 ? orderBefore[idx + 1] : null;
    this.delayedIds.update((set) => new Set([...set, id]));
    if (nextSlot) {
      this._purgeExpiringStates(nextSlot.id);
      this.activeTurnId.set(nextSlot.id);
    } else {
      this.startNewRound();
    }
  }

  private _purgeExpiringStates(turnId: string): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => ({...s, etats: s.etats.filter((e) => e.expiresAtTurnOf !== turnId)})),
    );
  }

  protected toggleBrawl(id: string): void {
    this.brawlIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected confirmRecovery(): void {
    for (const row of this.recoveryRows()) {
      if (row.recovery > 0) this.adjustHp(row.slot.id, row.recovery);
    }
    this.brawlIds.set(new Set());
    this.endCombatDialogVisible.set(false);
    const id = this.scenarioId();
    if (id) this.storage.clear(id);
    this.combatEnded.emit();
  }

  protected onPhAction(id: string, action: string): void {
    const slot = this.initiativeOrder().find((s) => s.id === id);
    if (!slot || (slot.heroismCourant ?? 0) <= 0) return;

    switch (action) {
      case 'defier-mort':
        if (slot.vitaliteCourante >= -5 && slot.vitaliteCourante < 0) {
          this.adjustHp(id, -slot.vitaliteCourante); // bring to 0
        } else if (slot.vitaliteCourante < -5) {
          this.adjustStates(id, [makeEtat('stabilise')]);
        }
        this.adjustHeroism(id, -1);
        break;
      case 'egratignure': {
        const roll = Math.ceil(Math.random() * 6);
        const cap = this.lastDamageById()[id] ?? roll;
        this.adjustHp(id, Math.min(roll, cap));
        this.adjustHeroism(id, -1);
        break;
      }
      case 'parade': {
        const last = this.lastDamageById()[id] ?? 0;
        if (last > 0) this.adjustHp(id, last);
        this.adjustHeroism(id, -1);
        break;
      }
      case 'interruption':
        this.adjustHeroism(id, -1);
        break;
    }
  }

  protected cancelRollPhase(): void {
    this.allHeroesRolled.set(false);
    this.rollPhase.set(false);
  }

  protected confirmRollPhase(): void {
    this.rollPhaseRef()?.confirm();
  }

  protected onRollConfirmed(results: {id: string; category: ReactionResult; spentHeroism: boolean}[]): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => {
        const result = results.find((r) => r.id === s.id);
        return result ? {...s, category: result.category} : s;
      }),
    );
    for (const r of results) {
      if (r.spentHeroism) this.adjustHeroism(r.id, -1);
    }
    this.allHeroesRolled.set(false);
    this.rollPhase.set(false);
    this.delayedIds.set(new Set());
    this.activeTurnId.set(this.turnOrder()[0]?.id ?? null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'n' && event.key !== 'N') return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
    if (!this.initiativeConfirmed() || this.rollPhase()) return;
    this.advanceTurn();
  }
}
