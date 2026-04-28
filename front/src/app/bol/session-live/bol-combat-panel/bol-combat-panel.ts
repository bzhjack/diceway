import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {DialogModule} from 'primeng/dialog';
import {InputNumberModule} from 'primeng/inputnumber';
import {MessageModule} from 'primeng/message';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';

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

export interface InitiativeSlot {
  readonly id: string;
  readonly nom: string;
  readonly avatar: string | null;
  readonly type: ParticipantType;
  readonly vitaliteMax: number;
  readonly heroismMax: number | null;
  readonly defense: number | null;
  readonly degats: string | null;
  readonly tags: string[];
  category: ReactionResult | null;
  vitaliteCourante: number;
  heroismCourant: number | null;
}

interface RollEntry {
  esprit: number;
  bonusInit: number;
  dice: number | null;
  surpris: boolean;
  embuscade: boolean;
  carriere: number;
  initiativeEnnemie: number;
  acceptEchecCritique: boolean;
  depenseHeroisme: boolean;
}

type PrimeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const DEFAULT_ROLL_ENTRY: RollEntry = {
  esprit: 0,
  bonusInit: 0,
  dice: null,
  surpris: false,
  embuscade: false,
  carriere: 0,
  initiativeEnnemie: 0,
  acceptEchecCritique: false,
  depenseHeroisme: false,
};

const INITIATIVE_ORDER: Record<ReactionResult, number> = {
  legendaire: 0,
  heroique: 1,
  reussite: 2,
  rival: 3,
  coriace: 4,
  echec: 5,
  pietaille: 6,
  'echec-critique': 7,
};

const TYPE_LABELS: Record<ParticipantType, string> = {
  hero: 'PJ',
  creature: 'Créature',
  demon: 'Démon',
  pnj: 'PNJ',
};

const TYPE_SEVERITIES: Record<ParticipantType, PrimeSeverity> = {
  hero: 'info',
  creature: 'warn',
  demon: 'danger',
  pnj: 'secondary',
};

const CATEGORY_LABELS: Record<ReactionResult, string> = {
  legendaire: 'Légendaire ★★',
  heroique: 'Héroïque ★',
  reussite: 'Réussite',
  rival: 'Rival',
  coriace: 'Coriace',
  echec: 'Échec',
  pietaille: 'Piétaille',
  'echec-critique': 'Échec critique',
};

const CATEGORY_SEVERITIES: Record<ReactionResult, PrimeSeverity> = {
  legendaire: 'warn',
  heroique: 'warn',
  reussite: 'info',
  rival: 'warn',
  coriace: 'secondary',
  echec: 'danger',
  pietaille: 'secondary',
  'echec-critique': 'danger',
};

@Component({
  selector: 'app-bol-combat-panel',
  imports: [FormsModule, ButtonModule, CardModule, CheckboxModule, DialogModule, InputNumberModule, MessageModule, SelectModule, TagModule],
  templateUrl: './bol-combat-panel.html',
  styleUrl: './bol-combat-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolCombatPanelComponent {
  readonly participants = input.required<InitiativeSlot[]>();

  protected readonly initiativeOrder = signal<InitiativeSlot[]>([]);
  protected readonly selectedParticipantId = signal<string | null>(null);
  protected readonly rollPhase = signal(false);
  protected readonly rollEntries = signal<Record<string, RollEntry>>({});
  protected readonly rulesDialogVisible = signal(false);

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

  protected readonly nonHeroesInOrder = computed(() =>
    this.initiativeOrder().filter((s) => s.type !== 'hero'),
  );

  protected readonly allHeroesRolled = computed(() =>
    this.heroesInOrder().every((s) => this.rollEntries()[s.id]?.dice != null),
  );

  protected getEntry(id: string): RollEntry {
    return this.rollEntries()[id] ?? DEFAULT_ROLL_ENTRY;
  }

  protected updateEntry(id: string, patch: Partial<RollEntry>): void {
    this.rollEntries.update((r) => ({
      ...r,
      [id]: {...this.getEntry(id), ...patch},
    }));
  }

  protected rollTotal(id: string): number | null {
    const e = this.getEntry(id);
    if (e.dice === null || e.dice === 12 || (e.dice === 2 && e.acceptEchecCritique)) return null;
    return (
      e.dice +
      e.esprit +
      e.bonusInit +
      (e.surpris ? -1 : 0) +
      (e.embuscade ? 2 : 0) +
      e.carriere -
      e.initiativeEnnemie
    );
  }

  protected rollResultFor(id: string): ReactionResult | null {
    const e = this.getEntry(id);
    if (e.dice === null) return null;
    if (e.dice === 2 && e.acceptEchecCritique) return 'echec-critique';
    if (e.dice === 12) return e.depenseHeroisme ? 'legendaire' : 'heroique';
    const total = this.rollTotal(id);
    if (total === null) return null;
    return total >= 9 ? 'reussite' : 'echec';
  }

  protected startRollPhase(): void {
    const entries: Record<string, RollEntry> = {};
    for (const slot of this.heroesInOrder()) {
      entries[slot.id] = {...DEFAULT_ROLL_ENTRY};
    }
    this.rollEntries.set(entries);
    this.rollPhase.set(true);
  }

  protected confirmRollPhase(): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => {
        if (s.type !== 'hero') return s;
        const result = this.rollResultFor(s.id);
        return result ? {...s, category: result} : s;
      }),
    );
    this.rollPhase.set(false);
  }

  protected typeLabel(type: ParticipantType): string {
    return TYPE_LABELS[type];
  }

  protected typeSeverity(type: ParticipantType): PrimeSeverity {
    return TYPE_SEVERITIES[type];
  }

  protected categoryLabel(category: ReactionResult): string {
    return CATEGORY_LABELS[category];
  }

  protected categorySeverity(category: ReactionResult): PrimeSeverity {
    return CATEGORY_SEVERITIES[category];
  }

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
    this.initiativeOrder.update((list) =>
      list.map((s) =>
        s.id === id
          ? {...s, vitaliteCourante: Math.max(0, Math.min(s.vitaliteMax, s.vitaliteCourante + delta))}
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

  protected removeFromInitiative(id: string): void {
    this.initiativeOrder.update((list) => list.filter((s) => s.id !== id));
  }

}
