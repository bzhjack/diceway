import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {SelectButtonModule} from 'primeng/selectbutton';
import {TooltipModule} from 'primeng/tooltip';
import {InitiativeSlot, ParticipantType} from '../bol-combat-panel';
import {CATEGORY_LABELS, TYPE_LABELS} from '../combat.constants';

type TypeFilter = 'tous' | ParticipantType;
type Situation = 'embuscade' | 'normale' | 'surpris';

export interface CombatantSelection {
  /** Combattants composés (groupes déjà dépliés en N exemplaires). */
  readonly slots: InitiativeSlot[];
  /** Modificateur de situation à appliquer aux jets de réaction des héros (+2 / 0 / -1). */
  readonly reactionModifier: number;
}

interface PoolRow {
  readonly id: string;
  readonly nom: string;
  readonly letter: string;
  readonly color: string;
  readonly rangLabel: string;
  readonly isHero: boolean;
  readonly included: boolean;
  readonly qtyBadge: string;
}

interface GridCard {
  readonly id: string;
  readonly nom: string;
  readonly avatar: string | null;
  readonly letter: string;
  readonly color: string;
  readonly rangSub: string;
  readonly isHero: boolean;
  readonly isGroup: boolean;
  readonly qty: number;
  readonly vitaliteMax: number;
  readonly num: number;
}

const SITUATION_MOD: Record<Situation, number> = {embuscade: 2, normale: 0, surpris: -1};

@Component({
  selector: 'app-bol-combatant-picker',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectButtonModule,
    TooltipModule,
  ],
  templateUrl: './bol-combatant-picker.html',
  styleUrl: './bol-combatant-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolCombatantPickerComponent {
  /** Réserve disponible (héros + créatures + démons + PNJ du scénario). */
  readonly participants = input.required<InitiativeSlot[]>();

  readonly confirmed = output<CombatantSelection>();
  readonly cancelled = output<void>();

  protected readonly searchTerm = signal('');
  protected readonly typeFilter = signal<TypeFilter>('tous');
  protected readonly situation = signal<Situation>('normale');
  protected readonly included = signal<ReadonlySet<string>>(new Set());
  protected readonly counts = signal<Record<string, number>>({});

  private seeded = false;

  constructor() {
    // Seed roster once participants arrive: tout inclus, quantité 1.
    effect(() => {
      const ps = this.participants();
      if (!ps.length || this.seeded) return;
      this.seeded = true;
      untracked(() => {
        this.included.set(new Set(ps.map((p) => p.id)));
        this.counts.set(Object.fromEntries(ps.map((p) => [p.id, 1])));
      });
    });
  }

  // ── Options ────────────────────────────────────────────────────────────────

  protected readonly typeOptions = computed(() => {
    const present = new Set(this.participants().map((p) => p.type));
    const all: {label: string; value: TypeFilter}[] = [{label: 'Tous', value: 'tous'}];
    (['hero', 'creature', 'demon', 'pnj'] as ParticipantType[]).forEach((t) => {
      if (present.has(t)) all.push({label: TYPE_LABELS[t], value: t});
    });
    return all;
  });

  protected readonly situationOptions: {label: string; value: Situation}[] = [
    {label: 'Embuscade posée  +2', value: 'embuscade'},
    {label: 'Rencontre normale', value: 'normale'},
    {label: 'Surpris  −1', value: 'surpris'},
  ];

  // ── Vues dérivées ────────────────────────────────────────────────────────────

  protected readonly poolRows = computed<PoolRow[]>(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const filter = this.typeFilter();
    const inc = this.included();
    const counts = this.counts();
    return this.participants()
      .filter((p) => (filter === 'tous' ? true : p.type === filter))
      .filter((p) => !term || p.nom.toLocaleLowerCase().includes(term))
      .map((p) => {
        const isHero = p.type === 'hero';
        const qty = counts[p.id] ?? 1;
        return {
          id: p.id,
          nom: p.nom,
          letter: (p.nom[0] ?? '?').toLocaleUpperCase(),
          color: this.color(p),
          rangLabel: this.rangLabel(p),
          isHero,
          included: inc.has(p.id),
          qtyBadge: !isHero && inc.has(p.id) && qty > 1 ? `×${qty}` : '',
        };
      });
  });

  protected readonly poolEmpty = computed(() => this.poolRows().length === 0);

  protected readonly gridCards = computed<GridCard[]>(() => {
    const inc = this.included();
    const counts = this.counts();
    return this.participants()
      .filter((p) => inc.has(p.id))
      .map((p, i) => {
        const isHero = p.type === 'hero';
        const qty = isHero ? 1 : counts[p.id] ?? 1;
        return {
          id: p.id,
          nom: p.nom,
          avatar: p.avatar,
          letter: (p.nom[0] ?? '?').toLocaleUpperCase(),
          color: this.color(p),
          rangSub: this.rangLabel(p) + (!isHero ? ' · groupe' : ''),
          isHero,
          isGroup: !isHero,
          qty,
          vitaliteMax: p.vitaliteMax,
          num: i + 1,
        };
      });
  });

  protected readonly gridEmpty = computed(() => this.gridCards().length === 0);

  protected readonly combatantCount = computed(() => this.included().size);

  protected readonly figureCount = computed(() => {
    const counts = this.counts();
    let total = 0;
    for (const p of this.participants()) {
      if (!this.included().has(p.id)) continue;
      total += p.type === 'hero' ? 1 : counts[p.id] ?? 1;
    }
    return total;
  });

  protected readonly enemyInitMalus = computed(() => {
    let max = 0;
    for (const p of this.participants()) {
      if (!this.included().has(p.id) || p.type === 'hero') continue;
      if (p.initiative != null) max = Math.max(max, p.initiative);
    }
    return max;
  });

  protected readonly reactionModifier = computed(() => SITUATION_MOD[this.situation()]);

  protected readonly countText = computed(() => {
    const c = this.combatantCount();
    const f = this.figureCount();
    return `${c} combattant${c > 1 ? 's' : ''} · ${f} figurine${f > 1 ? 's' : ''}`;
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  protected add(id: string): void {
    const p = this.participants().find((x) => x.id === id);
    if (!p) return;
    this.included.update((set) => new Set(set).add(id));
    if (p.type !== 'hero') {
      this.counts.update((c) => ({...c, [id]: (c[id] ?? 0) + 1}));
    }
  }

  protected inc(id: string): void {
    this.counts.update((c) => ({...c, [id]: (c[id] ?? 1) + 1}));
  }

  protected dec(id: string): void {
    const next = (this.counts()[id] ?? 1) - 1;
    if (next <= 0) {
      this.remove(id);
    } else {
      this.counts.update((c) => ({...c, [id]: next}));
    }
  }

  protected remove(id: string): void {
    this.included.update((set) => {
      const s = new Set(set);
      s.delete(id);
      return s;
    });
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.typeFilter.set('tous');
  }

  protected confirm(): void {
    const inc = this.included();
    const counts = this.counts();
    const out: InitiativeSlot[] = [];
    for (const p of this.participants()) {
      if (!inc.has(p.id)) continue;
      const n = p.type === 'hero' ? 1 : counts[p.id] ?? 1;
      for (let i = 0; i < n; i++) {
        const suffixed = n > 1;
        out.push({
          ...p,
          id: suffixed ? `${p.id}__${i + 1}` : p.id,
          nom: suffixed ? `${p.nom} #${i + 1}` : p.nom,
          category: p.type === 'hero' ? null : p.category,
          vitaliteCourante: p.vitaliteMax,
          heroismCourant: p.heroismMax,
          etats: [],
        });
      }
    }
    this.confirmed.emit({slots: out, reactionModifier: this.reactionModifier()});
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private color(slot: InitiativeSlot): string {
    if (slot.type === 'hero') return '#4ade80';
    switch (slot.category) {
      case 'rival':
        return '#fb923c';
      case 'coriace':
        return '#cbd5e1';
      case 'pietaille':
        return '#94a3b8';
      default:
        break;
    }
    if (slot.type === 'demon') return '#fda4af';
    if (slot.type === 'pnj') return '#6ee7b7';
    return '#f59e0b';
  }

  private rangLabel(slot: InitiativeSlot): string {
    if (slot.type === 'hero') return 'Héros';
    if (slot.category) return CATEGORY_LABELS[slot.category];
    return TYPE_LABELS[slot.type];
  }
}
