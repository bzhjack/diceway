import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {MessageModule} from 'primeng/message';
import {PopoverModule} from 'primeng/popover';
import {SelectModule} from 'primeng/select';
import {SelectButtonModule} from 'primeng/selectbutton';
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
  readonly type: ParticipantType;
  readonly vitaliteMax: number;
  readonly defense: number | null;
  readonly degats: string | null;
  readonly tags: string[];
  category: ReactionResult | null;
  vitaliteCourante: number;
}

interface CategoryOption {
  readonly label: string;
  readonly value: ReactionResult;
}

type PrimeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

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

const HERO_OPTIONS: readonly CategoryOption[] = [
  {label: 'Lég. ★★', value: 'legendaire'},
  {label: 'Hér. ★', value: 'heroique'},
  {label: 'Réussite', value: 'reussite'},
  {label: 'Échec', value: 'echec'},
  {label: 'Éch. crit.', value: 'echec-critique'},
];

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
  imports: [FormsModule, ButtonModule, CardModule, MessageModule, PopoverModule, SelectModule, SelectButtonModule, TagModule],
  templateUrl: './bol-combat-panel.html',
  styleUrl: './bol-combat-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolCombatPanelComponent {
  readonly participants = input.required<InitiativeSlot[]>();

  protected readonly initiativeOrder = signal<InitiativeSlot[]>([]);
  protected readonly selectedParticipantId = signal<string | null>(null);

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

  protected readonly heroOptions: CategoryOption[] = [...HERO_OPTIONS];

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

  protected removeFromInitiative(id: string): void {
    this.initiativeOrder.update((list) => list.filter((s) => s.id !== id));
  }

  protected setCategory(id: string, category: ReactionResult | null): void {
    this.initiativeOrder.update((list) =>
      list.map((s) => s.id === id ? {...s, category} : s),
    );
  }
}
